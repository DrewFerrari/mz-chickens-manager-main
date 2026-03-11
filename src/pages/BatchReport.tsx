import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Bird, Skull, Percent, Package } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Batch, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { format, differenceInWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface BatchStats {
  batch: Batch;
  totalCost: number;
  totalRevenue: number;
  totalSold: number;
  totalDeaths: number;
  profit: number;
  roi: number;
  costPerBird: number;
  avgSalePrice: number;
  survivalRate: number;
  weeksOld: number;
}

export default function BatchReport() {
  const [batchStats, setBatchStats] = useState<BatchStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState<OwnerType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  useEffect(() => {
    fetchBatchStats();
  }, [ownerFilter, statusFilter]);

  const fetchBatchStats = async () => {
    setLoading(true);

    // Fetch batches
    let batchQuery = supabase.from('batches').select('*').order('date_introduced', { ascending: false });
    
    if (ownerFilter !== 'all') {
      batchQuery = batchQuery.eq('owner', ownerFilter);
    }
    if (statusFilter !== 'all') {
      batchQuery = batchQuery.eq('status', statusFilter);
    }

    const { data: batches } = await batchQuery;
    if (!batches) {
      setLoading(false);
      return;
    }

    // Fetch related data for all batches
    const batchIds = batches.map(b => b.id);
    
    const [salesRes, deathsRes, feedRes, expensesRes] = await Promise.all([
      supabase.from('sales').select('*').in('batch_id', batchIds),
      supabase.from('natural_deaths').select('*').in('batch_id', batchIds),
      supabase.from('feed_purchases').select('*'),
      supabase.from('expenses').select('*'),
    ]);

    const sales = salesRes.data || [];
    const deaths = deathsRes.data || [];
    const feeds = feedRes.data || [];
    const expenses = expensesRes.data || [];

    // Calculate stats for each batch
    const stats: BatchStats[] = batches.map(batch => {
      const batchSales = sales.filter(s => s.batch_id === batch.id);
      const batchDeaths = deaths.filter(d => d.batch_id === batch.id);
      
      // Calculate costs (cost of chicks + proportional feed/expenses)
      const chickCost = batch.starting_quantity * Number(batch.cost_per_chick || 0);
      
      // Proportional feed cost based on owner
      const ownerFeeds = feeds.filter(f => f.owner === batch.owner);
      const ownerExpenses = expenses.filter(e => e.owner === batch.owner);
      const totalFeedCost = ownerFeeds.reduce((sum, f) => sum + Number(f.total_cost), 0);
      const totalExpensesCost = ownerExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      
      // Estimate proportional costs (simplified - divide by number of active batches for that owner)
      const ownerBatches = batches.filter(b => b.owner === batch.owner);
      const proportionalFeed = totalFeedCost / Math.max(ownerBatches.length, 1);
      const proportionalExpenses = totalExpensesCost / Math.max(ownerBatches.length, 1);
      
      const totalCost = chickCost + proportionalFeed + proportionalExpenses;
      
      // Calculate revenue
      const totalRevenue = batchSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const totalSold = batchSales.reduce((sum, s) => sum + s.quantity, 0);
      const totalDeathsCount = batchDeaths.reduce((sum, d) => sum + d.quantity, 0);
      
      const profit = totalRevenue - totalCost;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      const costPerBird = batch.starting_quantity > 0 ? totalCost / batch.starting_quantity : 0;
      const avgSalePrice = totalSold > 0 ? totalRevenue / totalSold : 0;
      const survivalRate = batch.starting_quantity > 0 
        ? ((batch.starting_quantity - totalDeathsCount) / batch.starting_quantity) * 100 
        : 100;
      const weeksOld = differenceInWeeks(new Date(), new Date(batch.date_introduced));

      return {
        batch,
        totalCost,
        totalRevenue,
        totalSold,
        totalDeaths: totalDeathsCount,
        profit,
        roi,
        costPerBird,
        avgSalePrice,
        survivalRate,
        weeksOld,
      };
    });

    setBatchStats(stats);
    setLoading(false);
  };

  const totals = batchStats.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.totalRevenue,
      cost: acc.cost + s.totalCost,
      profit: acc.profit + s.profit,
      sold: acc.sold + s.totalSold,
    }),
    { revenue: 0, cost: 0, profit: 0, sold: 0 }
  );

  const avgRoi = totals.cost > 0 ? (totals.profit / totals.cost) * 100 : 0;

  return (
    <MainLayout>
      <PageHeader
        title="Batch ROI Report"
        description="Track profitability per batch"
        actions={
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
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
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={`$${totals.revenue.toFixed(2)}`}
          subtitle={`${totals.sold} birds sold`}
          icon={DollarSign}
          variant="accent"
        />
        <StatCard
          title="Total Costs"
          value={`$${totals.cost.toFixed(2)}`}
          subtitle="Feed + Expenses + Chicks"
          icon={Package}
        />
        <StatCard
          title="Total Profit"
          value={`$${totals.profit.toFixed(2)}`}
          subtitle={totals.profit >= 0 ? 'Net gain' : 'Net loss'}
          icon={TrendingUp}
          variant={totals.profit >= 0 ? 'munyanyi' : 'default'}
        />
        <StatCard
          title="Average ROI"
          value={`${avgRoi.toFixed(1)}%`}
          subtitle="Return on investment"
          icon={Percent}
          variant={avgRoi >= 100 ? 'accent' : 'default'}
        />
      </div>

      {/* Batch Cards */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))
        ) : batchStats.length === 0 ? (
          <div className="text-center py-12">
            <Bird className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Batches Found</h3>
            <p className="text-muted-foreground">Add batches to see ROI analysis.</p>
          </div>
        ) : (
          batchStats.map((stats) => (
            <div key={stats.batch.id} className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-display font-semibold">{stats.batch.batch_name}</h3>
                    <OwnerBadge owner={stats.batch.owner} size="sm" />
                    <Badge variant="outline">{stats.batch.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Started {format(new Date(stats.batch.date_introduced), 'MMM d, yyyy')} • {stats.weeksOld} weeks old
                  </p>
                </div>
                <div className={cn(
                  "text-right px-4 py-2 rounded-lg",
                  stats.roi >= 100 ? "bg-success/10" : stats.roi >= 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-destructive/10"
                )}>
                  <p className="text-2xl font-bold">
                    {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">ROI</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cost per Bird</p>
                  <p className="text-lg font-semibold">${stats.costPerBird.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Sale Price</p>
                  <p className="text-lg font-semibold text-success">${stats.avgSalePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Birds Sold</p>
                  <p className="text-lg font-semibold">{stats.totalSold} / {stats.batch.starting_quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deaths</p>
                  <p className="text-lg font-semibold text-destructive">{stats.totalDeaths}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={cn("text-lg font-semibold", stats.profit >= 0 ? "text-success" : "text-destructive")}>
                    ${stats.profit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Survival Rate Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Survival Rate</span>
                  <span className={cn(
                    stats.survivalRate >= 90 ? "text-success" : 
                    stats.survivalRate >= 75 ? "text-amber-600" : "text-destructive"
                  )}>
                    {stats.survivalRate.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={stats.survivalRate} 
                  className={cn(
                    "h-2",
                    stats.survivalRate >= 90 ? "[&>div]:bg-success" :
                    stats.survivalRate >= 75 ? "[&>div]:bg-amber-500" : "[&>div]:bg-destructive"
                  )}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
