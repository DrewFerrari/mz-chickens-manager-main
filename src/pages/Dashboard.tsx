import { useEffect, useState } from 'react';
import { Bird, Snowflake, DollarSign, TrendingUp, Package, Skull } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { OwnerCard } from '@/components/dashboard/OwnerCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStats, OwnerStats, OwnerType } from '@/lib/types';

export default function Dashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalLiveChickens: 0,
    totalFridgeStock: 0,
    todaySales: 0,
    todayExpenses: 0,
    cashAtHand: 0,
    totalDeaths: 0,
    activeBatches: 0,
  });
  const [ownerStats, setOwnerStats] = useState<OwnerStats[]>([]);

  useEffect(() => {
    fetchDashboardData();

    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch batches for live chickens
      const { data: batches } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'active');

      // Fetch fridge stock
      const { data: fridgeStock } = await supabase
        .from('fridge_stock')
        .select('*');

      // Fetch today's sales
      const { data: todaySales } = await supabase
        .from('sales')
        .select('*')
        .gte('sold_at', `${today}T00:00:00`)
        .lte('sold_at', `${today}T23:59:59`);

      // Fetch today's expenses
      const { data: todayExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', today);

      // Fetch today's feed purchases
      const { data: todayFeed } = await supabase
        .from('feed_purchases')
        .select('*')
        .gte('purchased_at', `${today}T00:00:00`)
        .lte('purchased_at', `${today}T23:59:59`);

      // Fetch deaths
      const { data: deaths } = await supabase
        .from('natural_deaths')
        .select('*');

      // Calculate stats
      const totalLive = batches?.reduce((sum, b) => sum + (b.current_quantity || 0), 0) || 0;
      const totalFridge = fridgeStock?.reduce((sum, f) => sum + (f.quantity || 0), 0) || 0;
      const totalSales = todaySales?.reduce((sum, s) => sum + Number(s.total_amount || 0), 0) || 0;
      const totalExp = (todayExpenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0) +
                       (todayFeed?.reduce((sum, f) => sum + Number(f.total_cost || 0), 0) || 0);
      const totalDeaths = deaths?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0;

      setStats({
        totalLiveChickens: totalLive,
        totalFridgeStock: totalFridge,
        todaySales: totalSales,
        todayExpenses: totalExp,
        cashAtHand: totalSales - totalExp,
        totalDeaths: totalDeaths,
        activeBatches: batches?.length || 0,
      });

      // Calculate per-owner stats
      const owners: OwnerType[] = ['miss_munyanyi', 'mai_zindove'];
      const ownerStatsData: OwnerStats[] = owners.map((owner) => {
        const ownerBatches = batches?.filter(b => b.owner === owner) || [];
        const ownerFridge = fridgeStock?.filter(f => f.owner === owner) || [];
        const ownerSales = todaySales?.filter(s => s.owner === owner) || [];
        const ownerDeaths = deaths?.filter(d => d.owner === owner) || [];

        return {
          owner,
          liveChickens: ownerBatches.reduce((sum, b) => sum + (b.current_quantity || 0), 0),
          fridgeStock: ownerFridge.reduce((sum, f) => sum + (f.quantity || 0), 0),
          todaySales: ownerSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
          todayExpenses: 0,
          cashAtHand: ownerSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
          deaths: ownerDeaths.reduce((sum, d) => sum + (d.quantity || 0), 0),
        };
      });

      setOwnerStats(ownerStatsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <MainLayout>
      <PageHeader
        title={`${getGreeting()}, ${profile?.full_name || 'User'}!`}
        description="Here's what's happening with MZ Chickens today."
      />

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Live Chickens"
          value={stats.totalLiveChickens}
          subtitle={`${stats.activeBatches} active batches`}
          icon={Bird}
          variant="accent"
        />
        <StatCard
          title="Fridge Stock"
          value={stats.totalFridgeStock}
          subtitle="Ready for sale"
          icon={Snowflake}
        />
        <StatCard
          title="Today's Sales"
          value={`$${stats.todaySales.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Cash at Hand"
          value={`$${stats.cashAtHand.toFixed(2)}`}
          subtitle="Sales - Expenses"
          icon={TrendingUp}
        />
      </div>

      {/* Owner Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {ownerStats.map((ownerStat) => (
          <OwnerCard
            key={ownerStat.owner}
            owner={ownerStat.owner}
            liveChickens={ownerStat.liveChickens}
            fridgeStock={ownerStat.fridgeStock}
            todaySales={ownerStat.todaySales}
            deaths={ownerStat.deaths}
          />
        ))}
      </div>

      {/* Additional Stats & Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={[]} />
        </div>
        <div className="space-y-4">
          <StatCard
            title="Total Deaths"
            value={stats.totalDeaths}
            subtitle="All time"
            icon={Skull}
            variant="default"
          />
          <StatCard
            title="Today's Expenses"
            value={`$${stats.todayExpenses.toFixed(2)}`}
            subtitle="Feed & other"
            icon={Package}
          />
        </div>
      </div>
    </MainLayout>
  );
}
