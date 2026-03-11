import { useEffect, useState } from 'react';
import { BarChart3, Loader2, TrendingUp, TrendingDown, Bird, DollarSign, Skull, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { OWNER_DISPLAY_NAMES, OwnerType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OwnerStats {
  owner: OwnerType;
  liveChickens: number;
  fridgeStock: number;
  totalSales: number;
  salesCount: number;
  totalExpenses: number;
  deaths: number;
  feedCost: number;
}

const OWNER_COLORS = {
  miss_munyanyi: 'hsl(142, 50%, 35%)',
  mai_zindove: 'hsl(35, 85%, 50%)',
};

export function OwnerComparisonTab() {
  const [stats, setStats] = useState<OwnerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const owners: OwnerType[] = ['miss_munyanyi', 'mai_zindove'];
    const statsPromises = owners.map(async (owner) => {
      const [batches, fridgeStock, sales, expenses, deaths, feed] = await Promise.all([
        supabase.from('batches').select('current_quantity').eq('owner', owner).eq('status', 'active'),
        supabase.from('fridge_stock').select('quantity').eq('owner', owner),
        supabase.from('sales').select('total_amount').eq('owner', owner),
        supabase.from('expenses').select('amount').eq('owner', owner),
        supabase.from('natural_deaths').select('quantity').eq('owner', owner),
        supabase.from('feed_purchases').select('total_cost').eq('owner', owner),
      ]);

      return {
        owner,
        liveChickens: batches.data?.reduce((sum, b) => sum + (b.current_quantity || 0), 0) || 0,
        fridgeStock: fridgeStock.data?.reduce((sum, f) => sum + (f.quantity || 0), 0) || 0,
        totalSales: sales.data?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0,
        salesCount: sales.data?.length || 0,
        totalExpenses: expenses.data?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0,
        deaths: deaths.data?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0,
        feedCost: feed.data?.reduce((sum, f) => sum + Number(f.total_cost || 0), 0) || 0,
      };
    });

    const results = await Promise.all(statsPromises);
    setStats(results);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const chartConfig = {
    miss_munyanyi: { label: OWNER_DISPLAY_NAMES.miss_munyanyi, color: OWNER_COLORS.miss_munyanyi },
    mai_zindove: { label: OWNER_DISPLAY_NAMES.mai_zindove, color: OWNER_COLORS.mai_zindove },
  };

  const salesComparisonData = stats.map(s => ({
    name: OWNER_DISPLAY_NAMES[s.owner],
    value: s.totalSales,
    fill: OWNER_COLORS[s.owner],
  }));

  const metricsData = [
    { metric: 'Live Birds', miss_munyanyi: stats[0]?.liveChickens || 0, mai_zindove: stats[1]?.liveChickens || 0 },
    { metric: 'Fridge Stock', miss_munyanyi: stats[0]?.fridgeStock || 0, mai_zindove: stats[1]?.fridgeStock || 0 },
    { metric: 'Deaths', miss_munyanyi: stats[0]?.deaths || 0, mai_zindove: stats[1]?.deaths || 0 },
  ];

  const getComparisonIcon = (val1: number, val2: number, lowerIsBetter = false) => {
    if (val1 === val2) return null;
    const winner = lowerIsBetter ? val1 < val2 : val1 > val2;
    return winner ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Owner Performance Comparison</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {stats.map((ownerStats) => (
          <Card key={ownerStats.owner} className={ownerStats.owner === 'miss_munyanyi' ? 'border-owner-munyanyi/30' : 'border-owner-zindove/30'}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${ownerStats.owner === 'miss_munyanyi' ? 'bg-owner-munyanyi' : 'bg-owner-zindove'}`} />
                {OWNER_DISPLAY_NAMES[ownerStats.owner]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Bird className="w-3 h-3" /> Live Birds
                  </div>
                  <p className="text-2xl font-bold">{ownerStats.liveChickens}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="w-3 h-3" /> Fridge Stock
                  </div>
                  <p className="text-2xl font-bold">{ownerStats.fridgeStock}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> Total Sales
                  </div>
                  <p className="text-2xl font-bold text-success">${ownerStats.totalSales.toFixed(0)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Skull className="w-3 h-3" /> Mortality
                  </div>
                  <p className="text-2xl font-bold text-destructive">{ownerStats.deaths}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Feed Costs</span>
                  <span className="font-medium">${ownerStats.feedCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Other Expenses</span>
                  <span className="font-medium">${ownerStats.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                  <span className="font-medium">Net Profit</span>
                  <span className={`font-bold ${ownerStats.totalSales - ownerStats.feedCost - ownerStats.totalExpenses > 0 ? 'text-success' : 'text-destructive'}`}>
                    ${(ownerStats.totalSales - ownerStats.feedCost - ownerStats.totalExpenses).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Distribution</CardTitle>
            <CardDescription>Total sales by owner</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <PieChart>
                <Pie
                  data={salesComparisonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                >
                  {salesComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Metrics Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Comparison</CardTitle>
            <CardDescription>Live birds, fridge stock, and mortality</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart data={metricsData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="metric" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="miss_munyanyi" name={OWNER_DISPLAY_NAMES.miss_munyanyi} fill={OWNER_COLORS.miss_munyanyi} radius={4} />
                <Bar dataKey="mai_zindove" name={OWNER_DISPLAY_NAMES.mai_zindove} fill={OWNER_COLORS.mai_zindove} radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Head-to-Head Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Metric</th>
                  <th className="text-right py-2 font-medium">{OWNER_DISPLAY_NAMES.miss_munyanyi}</th>
                  <th className="text-center py-2 w-10"></th>
                  <th className="text-right py-2 font-medium">{OWNER_DISPLAY_NAMES.mai_zindove}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2">Total Sales</td>
                  <td className="text-right font-mono">${stats[0]?.totalSales.toFixed(2)}</td>
                  <td className="text-center">{getComparisonIcon(stats[0]?.totalSales || 0, stats[1]?.totalSales || 0)}</td>
                  <td className="text-right font-mono">${stats[1]?.totalSales.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2">Sales Count</td>
                  <td className="text-right font-mono">{stats[0]?.salesCount}</td>
                  <td className="text-center">{getComparisonIcon(stats[0]?.salesCount || 0, stats[1]?.salesCount || 0)}</td>
                  <td className="text-right font-mono">{stats[1]?.salesCount}</td>
                </tr>
                <tr>
                  <td className="py-2">Live Birds</td>
                  <td className="text-right font-mono">{stats[0]?.liveChickens}</td>
                  <td className="text-center">{getComparisonIcon(stats[0]?.liveChickens || 0, stats[1]?.liveChickens || 0)}</td>
                  <td className="text-right font-mono">{stats[1]?.liveChickens}</td>
                </tr>
                <tr>
                  <td className="py-2">Mortality (lower is better)</td>
                  <td className="text-right font-mono">{stats[0]?.deaths}</td>
                  <td className="text-center">{getComparisonIcon(stats[0]?.deaths || 0, stats[1]?.deaths || 0, true)}</td>
                  <td className="text-right font-mono">{stats[1]?.deaths}</td>
                </tr>
                <tr>
                  <td className="py-2">Feed Costs (lower is better)</td>
                  <td className="text-right font-mono">${stats[0]?.feedCost.toFixed(2)}</td>
                  <td className="text-center">{getComparisonIcon(stats[0]?.feedCost || 0, stats[1]?.feedCost || 0, true)}</td>
                  <td className="text-right font-mono">${stats[1]?.feedCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
