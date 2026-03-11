import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, Phone, User, Loader2, Edit, Trash2 } from 'lucide-react';
import { EditSaleDialog } from '@/components/edit-dialogs/EditSaleDialog';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sale, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { format } from 'date-fns';

export default function CreditSales() {
  const [creditSales, setCreditSales] = useState<Sale[]>([]);
  const [paidSales, setPaidSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerType | 'all'>('all');
  const [showPaid, setShowPaid] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchCreditSales();
  }, [ownerFilter]);

  const fetchCreditSales = async () => {
    setLoading(true);
    
    // Fetch unpaid credit sales
    let unpaidQuery = supabase
      .from('sales')
      .select('*, batches(*)')
      .eq('payment_method', 'credit')
      .is('paid_at', null)
      .order('sold_at', { ascending: false });
    
    if (ownerFilter !== 'all') {
      unpaidQuery = unpaidQuery.eq('owner', ownerFilter);
    }

    // Fetch paid credit sales (last 50)
    let paidQuery = supabase
      .from('sales')
      .select('*, batches(*)')
      .eq('payment_method', 'credit')
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(50);

    if (ownerFilter !== 'all') {
      paidQuery = paidQuery.eq('owner', ownerFilter);
    }

    const [unpaidRes, paidRes] = await Promise.all([unpaidQuery, paidQuery]);

    if (unpaidRes.data) setCreditSales(unpaidRes.data as Sale[]);
    if (paidRes.data) setPaidSales(paidRes.data as Sale[]);
    
    setLoading(false);
  };

  const settleDebt = async (sale: Sale) => {
    setSettling(sale.id);
    
    const { error } = await supabase
      .from('sales')
      .update({ paid_at: new Date().toISOString() } as any)
      .eq('id', sale.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to settle debt. Please try again.',
      });
    } else {
      toast({
        title: 'Debt Settled',
        description: `${sale.customer_name || 'Customer'} has paid $${Number(sale.total_amount).toFixed(2)}`,
      });
      fetchCreditSales();
    }
    
    setSettling(null);
  };

  const handleDelete = async (id: string, customer: string) => {
    if (!confirm(`Are you sure you want to delete this credit sale for "${customer}"?`)) {
      return;
    }

    const { error } = await supabase.from('sales').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete sale. Please try again.',
      });
    } else {
      toast({
        title: 'Sale Deleted',
        description: `Credit sale record has been deleted.`,
      });
      fetchCreditSales();
    }
  };

  const totalOutstanding = creditSales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  return (
    <MainLayout>
      <PageHeader
        title="Credit Sales"
        description={`Outstanding: $${totalOutstanding.toFixed(2)} from ${creditSales.length} customers`}
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
          </div>
        }
      />

      {/* Outstanding Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Outstanding Debts</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{creditSales.length}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">Total Owed</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">${totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
          <p className="text-sm text-success font-medium">Settled This Month</p>
          <p className="text-2xl font-bold text-success">{paidSales.length}</p>
        </div>
      </div>

      {/* Tabs for unpaid/paid */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={!showPaid ? 'default' : 'outline'}
          onClick={() => setShowPaid(false)}
        >
          Unpaid ({creditSales.length})
        </Button>
        <Button
          variant={showPaid ? 'default' : 'outline'}
          onClick={() => setShowPaid(true)}
        >
          Settled ({paidSales.length})
        </Button>
      </div>

      {/* Credit Sales Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Amount</TableHead>
              {showPaid && <TableHead>Paid On</TableHead>}
              {!showPaid && <TableHead className="w-48">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={showPaid ? 6 : 6}>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : (showPaid ? paidSales : creditSales).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {showPaid ? 'No Settled Debts' : 'No Outstanding Debts'}
                  </h3>
                  <p className="text-muted-foreground">
                    {showPaid ? 'Settled debts will appear here.' : 'All credit sales have been paid!'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              (showPaid ? paidSales : creditSales).map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <p className="font-medium">{format(new Date(sale.sold_at), 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(sale.sold_at), 'h:mm a')}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{sale.customer_name || 'Unknown'}</p>
                        {sale.customer_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {sale.customer_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><OwnerBadge owner={sale.owner} size="sm" /></TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell className="font-bold text-amber-600">${Number(sale.total_amount).toFixed(2)}</TableCell>
                  {showPaid ? (
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {format(new Date((sale as any).paid_at), 'MMM d')}
                      </Badge>
                    </TableCell>
                  ) : (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="bg-success hover:bg-success/90">
                              {settling === sale.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Settle
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Settle Debt?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Mark {sale.customer_name || 'this customer'}'s debt of ${Number(sale.total_amount).toFixed(2)} as paid?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-success text-success-foreground hover:bg-success/90"
                                onClick={() => settleDebt(sale)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Confirm Payment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <EditSaleDialog sale={sale} onSuccess={fetchCreditSales} />
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(sale.id, sale.customer_name || 'Unknown')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
