import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Bird, Skull } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { OwnerBadge } from '@/components/ui/owner-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface ReportData {
  totalSales: number;
  totalExpenses: number;
  totalFeedCost: number;
  netProfit: number;
  totalChickensNow: number;
  totalDeaths: number;
  soldLive: number;
  soldSlaughtered: number;
}

export default function Reports() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [ownerFilter, setOwnerFilter] = useState<OwnerType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    totalSales: 0,
    totalExpenses: 0,
    totalFeedCost: 0,
    netProfit: 0,
    totalChickensNow: 0,
    totalDeaths: 0,
    soldLive: 0,
    soldSlaughtered: 0,
  });

  useEffect(() => {
    fetchReportData();
  }, [period, ownerFilter]);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return {
          start: format(now, "yyyy-MM-dd'T'00:00:00"),
          end: format(now, "yyyy-MM-dd'T'23:59:59"),
        };
      case 'week':
        return {
          start: format(startOfWeek(now), "yyyy-MM-dd'T'00:00:00"),
          end: format(endOfWeek(now), "yyyy-MM-dd'T'23:59:59"),
        };
      case 'month':
        return {
          start: format(startOfMonth(now), "yyyy-MM-dd'T'00:00:00"),
          end: format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59"),
        };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      // Fetch sales
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .gte('sold_at', start)
        .lte('sold_at', end);

      if (ownerFilter !== 'all') {
        salesQuery = salesQuery.eq('owner', ownerFilter);
      }

      const { data: sales } = await salesQuery;

      // Fetch expenses
      let expensesQuery = supabase
        .from('expenses')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

      if (ownerFilter !== 'all') {
        expensesQuery = expensesQuery.eq('owner', ownerFilter);
      }

      const { data: expenses } = await expensesQuery;

      // Fetch feed purchases
      let feedQuery = supabase
        .from('feed_purchases')
        .select('*')
        .gte('purchased_at', start)
        .lte('purchased_at', end);

      if (ownerFilter !== 'all') {
        feedQuery = feedQuery.eq('owner', ownerFilter);
      }

      const { data: feed } = await feedQuery;

      // Fetch deaths
      let deathsQuery = supabase
        .from('natural_deaths')
        .select('*')
        .gte('recorded_at', start)
        .lte('recorded_at', end);

      if (ownerFilter !== 'all') {
        deathsQuery = deathsQuery.eq('owner', ownerFilter);
      }

      const { data: deaths } = await deathsQuery;

      // Fetch current batches
      let batchesQuery = supabase
        .from('batches')
        .select('*')
        .eq('status', 'active');

      if (ownerFilter !== 'all') {
        batchesQuery = batchesQuery.eq('owner', ownerFilter);
      }

      const { data: batches } = await batchesQuery;

      // Calculate totals
      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalFeedCost = feed?.reduce((sum, f) => sum + Number(f.total_cost), 0) || 0;
      const totalDeaths = deaths?.reduce((sum, d) => sum + d.quantity, 0) || 0;
      const totalChickensNow = batches?.reduce((sum, b) => sum + b.current_quantity, 0) || 0;
      const soldLive = sales?.filter(s => s.source === 'fowl_run').reduce((sum, s) => sum + s.quantity, 0) || 0;
      const soldSlaughtered = sales?.filter(s => s.source === 'fridge').reduce((sum, s) => sum + s.quantity, 0) || 0;

      setData({
        totalSales,
        totalExpenses,
        totalFeedCost,
        netProfit: totalSales - totalExpenses - totalFeedCost,
        totalChickensNow,
        totalDeaths,
        soldLive,
        soldSlaughtered,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  return (
    <MainLayout>
      <PageHeader
        title="Reports"
        description="Financial and operational insights"
        actions={
          <div className="flex items-center gap-3">
            <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v as OwnerType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="miss_munyanyi">{OWNER_DISPLAY_NAMES.miss_munyanyi}</SelectItem>
                <SelectItem value="mai_zindove">{OWNER_DISPLAY_NAMES.mai_zindove}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Sales"
          value={`$${data.totalSales.toFixed(2)}`}
          subtitle={periodLabels[period]}
          icon={TrendingUp}
          variant="accent"
        />
        <StatCard
          title="Total Expenses"
          value={`$${(data.totalExpenses + data.totalFeedCost).toFixed(2)}`}
          subtitle="Expenses + Feed"
          icon={TrendingDown}
        />
        <StatCard
          title="Net Profit"
          value={`$${data.netProfit.toFixed(2)}`}
          subtitle={data.netProfit >= 0 ? 'Profit' : 'Loss'}
          icon={DollarSign}
          variant={data.netProfit >= 0 ? 'munyanyi' : 'default'}
        />
        <StatCard
          title="Live Stock"
          value={data.totalChickensNow}
          subtitle="Current chickens"
          icon={Bird}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold mb-4">Sales Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Live Chickens</span>
              <div className="text-right">
                <p className="font-semibold">{data.soldLive}</p>
                <p className="text-sm text-muted-foreground">${(data.soldLive * 7).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slaughtered</span>
              <div className="text-right">
                <p className="font-semibold">{data.soldSlaughtered}</p>
                <p className="text-sm text-muted-foreground">${(data.soldSlaughtered * 6).toFixed(2)}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="font-medium">Total Revenue</span>
              <span className="font-bold text-success">${data.totalSales.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Feed Purchases</span>
              <span className="font-semibold text-destructive">-${data.totalFeedCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Other Expenses</span>
              <span className="font-semibold text-destructive">-${data.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="font-medium">Total Expenses</span>
              <span className="font-bold text-destructive">
                -${(data.totalExpenses + data.totalFeedCost).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Mortality Stats */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-display font-semibold mb-4">Mortality Report</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Deaths ({periodLabels[period]})</span>
              <span className="font-semibold text-destructive">{data.totalDeaths}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Live Stock</span>
              <span className="font-semibold text-success">{data.totalChickensNow}</span>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  {data.totalChickensNow > 0 
                    ? `${((data.totalDeaths / (data.totalChickensNow + data.totalDeaths)) * 100).toFixed(1)}% mortality rate`
                    : 'No data'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Comparison - Only when showing all */}
      {ownerFilter === 'all' && (
        <div className="mt-8">
          <h3 className="text-xl font-display font-semibold mb-4">Owner Comparison</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {(['miss_munyanyi', 'mai_zindove'] as OwnerType[]).map((owner) => (
              <div
                key={owner}
                className={`rounded-xl p-6 ${
                  owner === 'miss_munyanyi' 
                    ? 'bg-owner-munyanyi-light border border-owner-munyanyi/20' 
                    : 'bg-owner-zindove-light border border-owner-zindove/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <OwnerBadge owner={owner} />
                </div>
                <p className="text-sm text-muted-foreground">
                  View detailed report by selecting this owner from the filter.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
