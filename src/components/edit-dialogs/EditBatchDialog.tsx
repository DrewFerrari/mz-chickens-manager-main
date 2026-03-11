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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Batch, OwnerType, BatchStatus, OWNER_DISPLAY_NAMES, FowlRun } from '@/lib/types';

interface EditBatchDialogProps {
  batch: Batch;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditBatchDialog({ batch, onSuccess, trigger }: EditBatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fowlRuns, setFowlRuns] = useState<FowlRun[]>([]);
  const [formData, setFormData] = useState({
    batch_name: batch.batch_name,
    owner: batch.owner,
    fowl_run_id: batch.fowl_run_id || 'none',
    date_introduced: batch.date_introduced.split('T')[0],
    starting_quantity: batch.starting_quantity.toString(),
    current_quantity: batch.current_quantity.toString(),
    cost_per_chick: batch.cost_per_chick.toString(),
    status: batch.status,
    notes: batch.notes || '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFowlRuns();
      setFormData({
        batch_name: batch.batch_name,
        owner: batch.owner,
        fowl_run_id: batch.fowl_run_id || 'none',
        date_introduced: batch.date_introduced.split('T')[0],
        starting_quantity: batch.starting_quantity.toString(),
        current_quantity: batch.current_quantity.toString(),
        cost_per_chick: batch.cost_per_chick.toString(),
        status: batch.status,
        notes: batch.notes || '',
      });
    }
  }, [open, batch]);

  const fetchFowlRuns = async () => {
    const { data } = await supabase
      .from('fowl_runs')
      .select('*')
      .eq('is_active', true);
    if (data) setFowlRuns(data as FowlRun[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('batches')
      .update({
        batch_name: formData.batch_name,
        owner: formData.owner as OwnerType,
        fowl_run_id: formData.fowl_run_id === 'none' ? null : formData.fowl_run_id,
        date_introduced: formData.date_introduced,
        starting_quantity: parseInt(formData.starting_quantity),
        current_quantity: parseInt(formData.current_quantity),
        cost_per_chick: parseFloat(formData.cost_per_chick),
        status: formData.status as BatchStatus,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating batch',
        description: error.message,
      });
    } else {
      toast({
        title: 'Batch updated',
        description: `${formData.batch_name} has been updated successfully.`,
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
          <DialogTitle>Edit Batch: {batch.batch_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="batch_name">Batch Name *</Label>
            <Input
              id="batch_name"
              required
              value={formData.batch_name}
              onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as BatchStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fowl Run</Label>
            <Select
              value={formData.fowl_run_id}
              onValueChange={(value) => setFormData({ ...formData, fowl_run_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fowl run" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Outside</SelectItem>
                {fowlRuns
                  .filter(fr => fr.owner === formData.owner)
                  .map((run) => (
                    <SelectItem key={run.id} value={run.id}>
                      {run.name} ({run.capacity} cap)
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_introduced">Date Introduced *</Label>
              <Input
                id="date_introduced"
                type="date"
                required
                value={formData.date_introduced}
                onChange={(e) => setFormData({ ...formData, date_introduced: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_per_chick">Cost per Chick ($) *</Label>
              <Input
                id="cost_per_chick"
                type="number"
                step="0.01"
                required
                value={formData.cost_per_chick}
                onChange={(e) => setFormData({ ...formData, cost_per_chick: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starting_quantity">Starting Qty *</Label>
              <Input
                id="starting_quantity"
                type="number"
                required
                value={formData.starting_quantity}
                onChange={(e) => setFormData({ ...formData, starting_quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_quantity">Current Qty *</Label>
              <Input
                id="current_quantity"
                type="number"
                required
                value={formData.current_quantity}
                onChange={(e) => setFormData({ ...formData, current_quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
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
