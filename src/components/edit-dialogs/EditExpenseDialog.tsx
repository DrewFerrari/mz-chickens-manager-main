import { useState, useEffect } from 'react';
import { Edit, Loader2 } from 'lucide-react';
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
import { Expense, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

interface EditExpenseDialogProps {
  expense: Expense;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditExpenseDialog({ expense, onSuccess, trigger }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    owner: expense.owner,
    category: expense.category,
    description: expense.description,
    amount: expense.amount.toString(),
    expense_date: expense.expense_date.split('T')[0],
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        owner: expense.owner,
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString(),
        expense_date: expense.expense_date.split('T')[0],
      });
    }
  }, [open, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('expenses')
      .update({
        owner: formData.owner as OwnerType,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: new Date(formData.expense_date).toISOString(),
      })
      .eq('id', expense.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating expense',
        description: error.message,
      });
    } else {
      toast({
        title: 'Expense updated',
        description: `Expense record has been updated successfully.`,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Owner *</Label>
            <Select
              value={formData.owner}
              onValueChange={(value) => setFormData({ ...formData, owner: value as OwnerType })}
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
            <Label htmlFor="expense_category">Category *</Label>
            <Input
              id="expense_category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_description">Description *</Label>
            <Input
              id="expense_description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_amount">Amount *</Label>
              <Input
                id="expense_amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense_date">Date *</Label>
              <Input
                id="expense_date"
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
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
