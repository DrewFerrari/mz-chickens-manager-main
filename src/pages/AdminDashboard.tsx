import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Bird, Thermometer, Package, DollarSign, Trash2, Edit, Plus, Loader2, History, Settings, Download, Scale, BarChart3, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Batch, Fridge, FowlRun, Sale, Expense, FeedPurchase, OWNER_DISPLAY_NAMES, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { format } from 'date-fns';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { SystemConfigTab } from '@/components/admin/SystemConfigTab';
import { DataExportTab } from '@/components/admin/DataExportTab';
import { StockReconciliationTab } from '@/components/admin/StockReconciliationTab';
import { OwnerComparisonTab } from '@/components/admin/OwnerComparisonTab';
import { EditBatchDialog } from '@/components/edit-dialogs/EditBatchDialog';
import { EditFridgeDialog } from '@/components/edit-dialogs/EditFridgeDialog';
import { EditFowlRunDialog } from '@/components/edit-dialogs/EditFowlRunDialog';
import { EditSaleDialog } from '@/components/edit-dialogs/EditSaleDialog';
import { EditExpenseDialog } from '@/components/edit-dialogs/EditExpenseDialog';

export default function AdminDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [fowlRuns, setFowlRuns] = useState<FowlRun[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feedPurchases, setFeedPurchases] = useState<FeedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { userRole, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is admin
    if (userRole && userRole.role !== 'admin') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the admin dashboard.',
      });
      navigate('/dashboard');
      return;
    }
    
    fetchAllData();

    const handleFocus = () => fetchAllData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userRole]);

  const fetchAllData = async () => {
    setLoading(true);
    
    const [batchesRes, fridgesRes, fowlRunsRes, salesRes, expensesRes, feedRes] = await Promise.all([
      supabase.from('batches').select('*').order('created_at', { ascending: false }),
      supabase.from('fridges').select('*').order('created_at', { ascending: false }),
      supabase.from('fowl_runs').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('sold_at', { ascending: false }).limit(100),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('feed_purchases').select('*').order('purchased_at', { ascending: false }).limit(100),
    ]);

    if (batchesRes.data) setBatches(batchesRes.data as Batch[]);
    if (fridgesRes.data) setFridges(fridgesRes.data as Fridge[]);
    if (fowlRunsRes.data) setFowlRuns(fowlRunsRes.data as FowlRun[]);
    if (salesRes.data) setSales(salesRes.data as Sale[]);
    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (feedRes.data) setFeedPurchases(feedRes.data as FeedPurchase[]);
    
    setLoading(false);
  };

  const handleDelete = async (table: string, id: string, name: string) => {
    setDeleting(id);
    
    // Cast table name to any to handle dynamic table access
    const { error } = await supabase.from(table as any).delete().eq('id', id);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: `Could not delete ${name}. ${error.message}`,
      });
    } else {
      // Log the deletion to activity_logs
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'delete',
          table_name: table,
          record_id: id,
          details: { name, deleted_at: new Date().toISOString() },
        });
      }
      
      toast({
        title: 'Deleted',
        description: `${name} has been deleted.`,
      });
      fetchAllData();
    }
    
    setDeleting(null);
  };

  const handleBulkDeleteExpenses = async () => {
    if (selectedExpenses.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedExpenses);
    const { error } = await supabase.from('expenses').delete().in('id', ids);
    if (error) {
      toast({ variant: 'destructive', title: 'Bulk Delete Failed', description: error.message });
    } else {
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'bulk_delete',
          table_name: 'expenses',
          details: { count: ids.length, deleted_at: new Date().toISOString() },
        });
      }
      toast({ title: 'Deleted', description: `${ids.length} expense(s) deleted.` });
      setSelectedExpenses(new Set());
      fetchAllData();
    }
    setBulkDeleting(false);
  };

  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllExpenses = () => {
    const visible = expenses.slice(0, 50);
    if (selectedExpenses.size === visible.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(visible.map((e) => e.id)));
    }
  };


  const totalLiveChickens = batches.filter(b => b.status === 'active').reduce((sum, b) => sum + b.current_quantity, 0);
  const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0) + 
                        feedPurchases.reduce((sum, f) => sum + Number(f.total_cost), 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Admin Dashboard"
        description="Full system management and oversight"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAllData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Shield className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Live Chickens"
          value={totalLiveChickens}
          subtitle="Active batches"
          icon={Bird}
          variant="munyanyi"
        />
        <StatCard
          title="Fridges"
          value={fridges.length}
          subtitle="Total storage"
          icon={Thermometer}
        />
        <StatCard
          title="Total Sales"
          value={`$${totalSales.toFixed(2)}`}
          subtitle="All time"
          icon={DollarSign}
          variant="accent"
        />
        <StatCard
          title="Total Expenses"
          value={`$${totalExpenses.toFixed(2)}`}
          subtitle="Feed + Other"
          icon={Package}
        />
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="batches">Batches ({batches.length})</TabsTrigger>
          <TabsTrigger value="fridges">Fridges ({fridges.length})</TabsTrigger>
          <TabsTrigger value="fowl-runs">Fowl Runs ({fowlRuns.length})</TabsTrigger>
          <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="audit-logs" className="gap-1"><History className="w-3 h-3" />Audit Logs</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1"><Settings className="w-3 h-3" />Settings</TabsTrigger>
          <TabsTrigger value="export" className="gap-1"><Download className="w-3 h-3" />Export</TabsTrigger>
          <TabsTrigger value="stock-take" className="gap-1"><Scale className="w-3 h-3" />Stock Take</TabsTrigger>
          <TabsTrigger value="comparison" className="gap-1"><BarChart3 className="w-3 h-3" />Compare</TabsTrigger>
        </TabsList>

        {/* Batches Tab */}
        <TabsContent value="batches">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Batch Management</h3>
              <Button size="sm" onClick={() => navigate('/batches')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Batch
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_name}</TableCell>
                    <TableCell><OwnerBadge owner={batch.owner} size="sm" /></TableCell>
                    <TableCell>{batch.current_quantity} / {batch.starting_quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{batch.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(batch.date_introduced), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditBatchDialog batch={batch} onSuccess={fetchAllData} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              {deleting === batch.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Batch?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{batch.batch_name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete('batches', batch.id, batch.batch_name)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Fridges Tab */}
        <TabsContent value="fridges">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Fridge Management</h3>
              <Button size="sm" onClick={() => navigate('/fridges')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Fridge
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fridge Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Temperature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fridges.map((fridge) => (
                  <TableRow key={fridge.id}>
                    <TableCell className="font-medium">{fridge.name}</TableCell>
                    <TableCell><OwnerBadge owner={fridge.owner} size="sm" /></TableCell>
                    <TableCell>{fridge.capacity}</TableCell>
                    <TableCell>{fridge.temperature}°C</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={fridge.is_active ? 'bg-success/10 text-success' : 'bg-muted'}>
                        {fridge.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditFridgeDialog fridge={fridge} onSuccess={fetchAllData} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              {deleting === fridge.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Fridge?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{fridge.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete('fridges', fridge.id, fridge.name)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Fowl Runs Tab */}
        <TabsContent value="fowl-runs">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Fowl Run Management</h3>
              <Button size="sm" onClick={() => navigate('/fowl-runs')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Fowl Run
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fowlRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell><OwnerBadge owner={run.owner} size="sm" /></TableCell>
                    <TableCell>{run.capacity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={run.is_active ? 'bg-success/10 text-success' : 'bg-muted'}>
                        {run.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditFowlRunDialog fowlRun={run} onSuccess={fetchAllData} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              {deleting === run.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Fowl Run?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{run.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete('fowl_runs', run.id, run.name)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Sales Records (Latest 100)</h3>
              <Button size="sm" onClick={() => navigate('/sales')}>
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 50).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.sold_at), 'MMM d, h:mm a')}</TableCell>
                    <TableCell><OwnerBadge owner={sale.owner} size="sm" /></TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell className="font-semibold text-success">${Number(sale.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sale.ecocash_owner && ` (${sale.ecocash_owner === 'miss_munyanyi' ? 'M' : 'Z'})`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditSaleDialog sale={sale} onSuccess={fetchAllData} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              {deleting === sale.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Sale?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this sale record. Stock will NOT be restored. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete('sales', sale.id, `Sale #${sale.id.slice(0, 8)}`)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Expense Records (Latest 100)</h3>
              <div className="flex items-center gap-2">
                {selectedExpenses.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={bulkDeleting}>
                        {bulkDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete {selectedExpenses.size} selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedExpenses.size} Expense(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the selected expense records. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={handleBulkDeleteExpenses}
                        >
                          Delete All Selected
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button size="sm" onClick={() => navigate('/expenses')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={expenses.slice(0, 50).length > 0 && selectedExpenses.size === expenses.slice(0, 50).length}
                      onChange={toggleAllExpenses}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.slice(0, 50).map((expense) => (
                  <TableRow key={expense.id} className={selectedExpenses.has(expense.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedExpenses.has(expense.id)}
                        onChange={() => toggleExpenseSelection(expense.id)}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell><OwnerBadge owner={expense.owner} size="sm" /></TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
                    <TableCell className="font-semibold text-destructive">-${Number(expense.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditExpenseDialog expense={expense} onSuccess={fetchAllData} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              {deleting === expense.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this expense record. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete('expenses', expense.id, expense.description)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* New Admin Feature Tabs */}
        <TabsContent value="audit-logs">
          <AuditLogsTab />
        </TabsContent>

        <TabsContent value="settings">
          <SystemConfigTab />
        </TabsContent>

        <TabsContent value="export">
          <DataExportTab />
        </TabsContent>

        <TabsContent value="stock-take">
          <StockReconciliationTab />
        </TabsContent>

        <TabsContent value="comparison">
          <OwnerComparisonTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
