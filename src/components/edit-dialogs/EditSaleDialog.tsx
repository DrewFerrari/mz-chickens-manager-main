import { useState, useEffect } from 'react';
import { Edit, Loader2, AlertCircle } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sale, OwnerType, PaymentMethod, OWNER_DISPLAY_NAMES, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { format } from 'date-fns';

interface EditSaleDialogProps {
  sale: Sale;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditSaleDialog({ sale, onSuccess, trigger }: EditSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: sale.quantity.toString(),
    unit_price: sale.unit_price.toString(),
    payment_method: sale.payment_method,
    ecocash_owner: sale.ecocash_owner || '',
    customer_name: sale.customer_name || '',
    customer_phone: sale.customer_phone || '',
    paid_at: (sale as any).paid_at ? new Date((sale as any).paid_at).toISOString().split('T')[0] : '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        quantity: sale.quantity.toString(),
        unit_price: sale.unit_price.toString(),
        payment_method: sale.payment_method,
        ecocash_owner: sale.ecocash_owner || '',
        customer_name: sale.customer_name || '',
        customer_phone: sale.customer_phone || '',
        paid_at: (sale as any).paid_at ? new Date((sale as any).paid_at).toISOString().split('T')[0] : '',
      });
    }
  }, [open, sale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const quantity = parseInt(formData.quantity);
    const unitPrice = parseFloat(formData.unit_price);
    const totalAmount = quantity * unitPrice;

    const { error } = await supabase
      .from('sales')
      .update({
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        payment_method: formData.payment_method,
        ecocash_owner: formData.payment_method === 'mobile_money' ? (formData.ecocash_owner as OwnerType) : null,
        customer_name: formData.customer_name || null,
        customer_phone: formData.customer_phone || null,
        paid_at: formData.payment_method === 'credit' && formData.paid_at ? new Date(formData.paid_at).toISOString() : (sale as any).paid_at,
      } as any)
      .eq('id', sale.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating sale',
        description: error.message,
      });
    } else {
      toast({
        title: 'Sale updated',
        description: `Sale record has been updated successfully.`,
      });
      setOpen(false);
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sale Record</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(sale.sold_at), 'PPP p')}
          </p>
        </DialogHeader>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg flex items-start gap-2 text-amber-800 dark:text-amber-200 text-sm mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Careful: Changing quantity will not automatically revert stock in batches or fridges. Use with caution.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_quantity">Quantity *</Label>
              <Input
                id="sale_quantity"
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($) *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                required
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              />
            </div>
          </div>

          <p className="text-sm font-semibold text-success">
            New Total: ${(parseInt(formData.quantity || '0') * parseFloat(formData.unit_price || '0')).toFixed(2)}
          </p>

          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value as PaymentMethod })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
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
                  <SelectItem value="miss_munyanyi">{OWNER_DISPLAY_NAMES.miss_munyanyi}</SelectItem>
                  <SelectItem value="mai_zindove">{OWNER_DISPLAY_NAMES.mai_zindove}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.payment_method === 'credit' && (
            <div className="space-y-2">
              <Label htmlFor="paid_at">Payment Date (if settled)</Label>
              <Input
                id="paid_at"
                type="date"
                value={formData.paid_at}
                onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Customer Phone</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
