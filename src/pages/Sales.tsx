import { useEffect, useState } from 'react';
import { Plus, ShoppingCart, Printer } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sale, Batch, FridgeStock, OwnerType, ChickenSource, PaymentMethod, OWNER_DISPLAY_NAMES, CHICKEN_PRICES, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReceiptDialog } from '@/components/ReceiptDialog';
import { EditSaleDialog } from '@/components/edit-dialogs/EditSaleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fridgeStock, setFridgeStock] = useState<FridgeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    owner: '' as OwnerType | '',
    source: '' as ChickenSource | '',
    batch_id: '',
    fridge_stock_id: '',
    quantity: '',
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash' as PaymentMethod,
    ecocash_owner: '' as OwnerType | '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
    fetchBatches();
    fetchFridgeStock();
  }, []);

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*, batches(*)')
      .order('sold_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
    } else {
      setSales(data as Sale[]);
    }
    setLoading(false);
  };

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'active');
    
    if (data) {
      setBatches(data as Batch[]);
    }
  };

  const fetchFridgeStock = async () => {
    const { data } = await supabase
      .from('fridge_stock')
      .select('*, fridges(*)')
      .gt('quantity', 0);
    
    if (data) {
      setFridgeStock(data as FridgeStock[]);
    }
  };

  // Validation helpers
  const validateCustomerName = (name: string): boolean => {
    if (!name) return true; // Optional field
    // Allow letters, spaces, hyphens, apostrophes, and common international characters
    return /^[\p{L}\s'-]+$/u.test(name) && name.length <= 100;
  };

  const validateCustomerPhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    // Allow digits, spaces, hyphens, parentheses, and plus sign
    return /^[\d\s\-()+ ]+$/.test(phone) && phone.length <= 20;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner || !formData.source || !formData.quantity || !formData.payment_method) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    // Validate customer name format
    if (formData.customer_name && !validateCustomerName(formData.customer_name)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Customer Name',
        description: 'Please use only letters, spaces, hyphens, and apostrophes (max 100 characters).',
      });
      return;
    }

    // Validate customer phone format
    if (formData.customer_phone && !validateCustomerPhone(formData.customer_phone)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Phone Number',
        description: 'Please use only digits, spaces, hyphens, parentheses, and plus sign (max 20 characters).',
      });
      return;
    }

    // Validate EcoCash owner selection
    if (formData.payment_method === 'mobile_money' && !formData.ecocash_owner) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select whose EcoCash number was used.',
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    const unitPrice = formData.source === 'fowl_run' ? CHICKEN_PRICES.alive : CHICKEN_PRICES.slaughtered;
    const totalAmount = quantity * unitPrice;

    // Validate stock availability
    if (formData.source === 'fowl_run' && formData.batch_id) {
      const batch = batches.find(b => b.id === formData.batch_id);
      if (batch && batch.current_quantity < quantity) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Only ${batch.current_quantity} chickens available in this batch.`,
        });
        return;
      }
    }

    if (formData.source === 'fridge' && formData.fridge_stock_id) {
      const stock = fridgeStock.find(f => f.id === formData.fridge_stock_id);
      if (stock && stock.quantity < quantity) {
        toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Only ${stock.quantity} chickens available in fridge.`,
        });
        return;
      }
    }

    // Create sale - cast to any to handle type mismatch with new ecocash_owner column
    const saleData = {
      owner: formData.owner,
      source: formData.source,
      batch_id: formData.source === 'fowl_run' ? formData.batch_id : null,
      fridge_stock_id: formData.source === 'fridge' ? formData.fridge_stock_id : null,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      customer_name: formData.customer_name || null,
      customer_phone: formData.customer_phone || null,
      payment_method: formData.payment_method,
      ecocash_owner: formData.payment_method === 'mobile_money' ? formData.ecocash_owner : null,
      recorded_by: user?.id,
    };
    
    const { error: saleError } = await supabase.from('sales').insert(saleData as any);

    if (saleError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record sale. Please try again.',
      });
      return;
    }

    // Update stock
    if (formData.source === 'fowl_run' && formData.batch_id) {
      const batch = batches.find(b => b.id === formData.batch_id);
      if (batch) {
        await supabase
          .from('batches')
          .update({ current_quantity: batch.current_quantity - quantity })
          .eq('id', formData.batch_id);
      }
    } else if (formData.source === 'fridge' && formData.fridge_stock_id) {
      const stock = fridgeStock.find(f => f.id === formData.fridge_stock_id);
      if (stock) {
        await supabase
          .from('fridge_stock')
          .update({ quantity: stock.quantity - quantity })
          .eq('id', formData.fridge_stock_id);
      }
    }

    toast({
      title: 'Sale Recorded',
      description: `Sold ${quantity} chickens for $${totalAmount.toFixed(2)} (${PAYMENT_METHOD_LABELS[formData.payment_method]})`,
    });
    
    setDialogOpen(false);
    setFormData({
      owner: '',
      source: '',
      batch_id: '',
      fridge_stock_id: '',
      quantity: '',
      customer_name: '',
      customer_phone: '',
      payment_method: 'cash',
      ecocash_owner: '',
    });
    fetchFridgeStock();
  };

  const handleDelete = async (id: string) => {
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
        description: `Sale record has been deleted. Stock was NOT restored.`,
      });
      fetchSales();
    }
  };

  const filteredBatches = batches.filter(b => !formData.owner || b.owner === formData.owner);
  const filteredFridgeStock = fridgeStock.filter(f => !formData.owner || f.owner === formData.owner);

  const todayTotal = sales
    .filter(s => new Date(s.sold_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  return (
    <MainLayout>
      <PageHeader
        title="Sales"
        description={`Today's total: $${todayTotal.toFixed(2)}`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Owner *</Label>
                  <Select
                    value={formData.owner}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      owner: value as OwnerType,
                      batch_id: '',
                      fridge_stock_id: '',
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miss_munyanyi">{OWNER_DISPLAY_NAMES.miss_munyanyi}</SelectItem>
                      <SelectItem value="mai_zindove">{OWNER_DISPLAY_NAMES.mai_zindove}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Source *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      source: value as ChickenSource,
                      batch_id: '',
                      fridge_stock_id: '',
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fowl_run">Live Chicken ($7)</SelectItem>
                      <SelectItem value="fridge">Slaughtered ($6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.source === 'fowl_run' && (
                  <div className="space-y-2">
                    <Label>Batch *</Label>
                    <Select
                      value={formData.batch_id}
                      onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batch_name} ({batch.current_quantity} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.source === 'fridge' && (
                  <div className="space-y-2">
                    <Label>Fridge Stock *</Label>
                    <Select
                      value={formData.fridge_stock_id}
                      onValueChange={(value) => setFormData({ ...formData, fridge_stock_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fridge stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFridgeStock.map((stock) => (
                          <SelectItem key={stock.id} value={stock.id}>
                            {stock.quantity} available
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                  {formData.quantity && formData.source && (
                    <p className="text-sm text-muted-foreground">
                      Total: ${(parseInt(formData.quantity || '0') * (formData.source === 'fowl_run' ? 7 : 6)).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      payment_method: value as PaymentMethod,
                      ecocash_owner: '',
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">EcoCash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit (On Account)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.payment_method === 'mobile_money' && (
                  <div className="space-y-2">
                    <Label>EcoCash Owner *</Label>
                    <Select
                      value={formData.ecocash_owner}
                      onValueChange={(value) => setFormData({ ...formData, ecocash_owner: value as OwnerType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Whose EcoCash number?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="miss_munyanyi">{OWNER_DISPLAY_NAMES.miss_munyanyi}'s Number</SelectItem>
                        <SelectItem value="mai_zindove">{OWNER_DISPLAY_NAMES.mai_zindove}'s Number</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select which owner's EcoCash number received the payment
                    </p>
                  </div>
                )}

                {formData.payment_method === 'credit' && (
                  <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                    ⚠️ Credit sale - Customer owes payment. Make sure to record customer details.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name {formData.payment_method === 'credit' && '*'}</Label>
                    <Input
                      placeholder={formData.payment_method === 'credit' ? 'Required for credit' : 'Optional'}
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone {formData.payment_method === 'credit' && '*'}</Label>
                    <Input
                      placeholder={formData.payment_method === 'credit' ? 'Required for credit' : 'Optional'}
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    Record Sale
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Receipt Dialog */}
      <ReceiptDialog 
        sale={receiptSale} 
        open={!!receiptSale} 
        onOpenChange={(open) => !open && setReceiptSale(null)} 
      />

      {/* Sales Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sales Yet</h3>
                  <p className="text-muted-foreground">
                    Record your first sale to get started.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {format(new Date(sale.sold_at), 'MMM d, yyyy')}
                    <span className="text-muted-foreground text-xs block">
                      {format(new Date(sale.sold_at), 'h:mm a')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <OwnerBadge owner={sale.owner} size="sm" />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      sale.source === 'fowl_run' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-info/10 text-info border-info/20'
                    )}>
                      {sale.source === 'fowl_run' ? 'Live' : 'Slaughtered'}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell className="font-semibold text-success">
                    ${Number(sale.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      sale.payment_method === 'cash' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                      sale.payment_method === 'mobile_money' && 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                      sale.payment_method === 'bank' && 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                      sale.payment_method === 'credit' && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    )}>
                      {PAYMENT_METHOD_LABELS[sale.payment_method]}
                      {sale.payment_method === 'mobile_money' && sale.ecocash_owner && (
                        <span className="ml-1 text-xs">
                          ({sale.ecocash_owner === 'miss_munyanyi' ? 'M' : 'Z'})
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sale.customer_name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setReceiptSale(sale)}
                        title="Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <EditSaleDialog sale={sale} onSuccess={fetchSales} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Sale Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this sale record. Stock will NOT be restored automatically. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(sale.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
