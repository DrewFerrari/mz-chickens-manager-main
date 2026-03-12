import { useState, useEffect } from 'react';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
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
import { Batch, OwnerType, OWNER_DISPLAY_NAMES, FowlRun } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface TransferBatchDialogProps {
  batch: Batch;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function TransferBatchDialog({ batch, onSuccess, trigger }: TransferBatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fowlRuns, setFowlRuns] = useState<FowlRun[]>([]);
  const [targetBatches, setTargetBatches] = useState<Batch[]>([]);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    targetOwner: (batch.owner === 'miss_munyanyi' ? 'mai_zindove' : 'miss_munyanyi') as OwnerType,
    targetFowlRunId: 'none',
    targetBatchId: 'new',
    quantity: '',
    notes: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchFowlRuns(formData.targetOwner);
      fetchTargetBatches(formData.targetOwner);
      setFormData(prev => ({
        ...prev,
        quantity: '',
        notes: '',
        targetBatchId: 'new',
        targetFowlRunId: 'none'
      }));
    }
  }, [open, formData.targetOwner]);

  const fetchFowlRuns = async (owner: OwnerType) => {
    const { data } = await supabase
      .from('fowl_runs')
      .select('*')
      .eq('owner', owner)
      .eq('is_active', true);
    if (data) setFowlRuns(data as FowlRun[]);
  };

  const fetchTargetBatches = async (owner: OwnerType) => {
    const { data } = await supabase
      .from('batches')
      .select('*')
      .eq('owner', owner)
      .eq('status', 'active');
    if (data) setTargetBatches(data as Batch[]);
  };

  const handleOwnerChange = (owner: OwnerType) => {
    setFormData({ ...formData, targetOwner: owner, targetFowlRunId: 'none', targetBatchId: 'new' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const transferQty = parseInt(formData.quantity);
    if (isNaN(transferQty) || transferQty <= 0) {
      toast({ variant: 'destructive', title: 'Invalid quantity', description: 'Please enter a valid transfer quantity.' });
      return;
    }
    
    if (transferQty > batch.current_quantity) {
      toast({ variant: 'destructive', title: 'Invalid quantity', description: `Cannot transfer more than available (${batch.current_quantity}).` });
      return;
    }

    setLoading(true);

    try {
      let destBatchId = formData.targetBatchId;

      // 1. If 'new', create a new batch for the destination owner first
      if (formData.targetBatchId === 'new') {
        const batchName = `Transfer from ${batch.batch_name} - ${new Date().toISOString().split('T')[0]}`;
        const { data: newBatch, error: createError } = await supabase.from('batches').insert({
          batch_name: batchName,
          owner: formData.targetOwner,
          fowl_run_id: formData.targetFowlRunId === 'none' ? null : formData.targetFowlRunId,
          starting_quantity: transferQty,
          current_quantity: transferQty,
          cost_per_chick: batch.cost_per_chick,
          notes: `Transferred from ${OWNER_DISPLAY_NAMES[batch.owner]}'s batch: ${batch.batch_name}. ${formData.notes}`,
          created_by: user?.id,
          status: 'active'
        }).select().single();

        if (createError) throw createError;
        destBatchId = newBatch.id;
      } else {
        // Find existing target batch
        const targetBatch = targetBatches.find(b => b.id === formData.targetBatchId);
        if (!targetBatch) throw new Error("Target batch not found.");

        // Increase existing batch quantity
        const { error: updateDestError } = await supabase.from('batches').update({
          current_quantity: targetBatch.current_quantity + transferQty,
          // optionally update starting quantity to keep math logical if they were transferred in from external source?
          // starting_quantity: targetBatch.starting_quantity + transferQty
        }).eq('id', formData.targetBatchId);

        if (updateDestError) throw updateDestError;
      }

      // 2. Reduce current owner's batch quantity
      const { error: updateSourceError } = await supabase.from('batches').update({
        current_quantity: batch.current_quantity - transferQty,
        status: (batch.current_quantity - transferQty) === 0 ? 'closed' : batch.status
      }).eq('id', batch.id);

      if (updateSourceError) throw updateSourceError;

      // 3. Log stock adjustment (negative for source)
      await supabase.from('stock_adjustments').insert({
        owner: batch.owner,
        reference_id: batch.id,
        adjustment_type: 'transfer_out',
        previous_quantity: batch.current_quantity,
        actual_quantity: batch.current_quantity - transferQty,
        difference: -transferQty,
        reason: `Transferred to ${OWNER_DISPLAY_NAMES[formData.targetOwner]}. ${formData.notes}`,
        recorded_by: user?.id || 'system'
      });

      // 4. Log stock adjustment (positive for destination) IF it wasn't a new batch
      // (a new batch inherently has its starting count)
      if (formData.targetBatchId !== 'new') {
        const targetBatch = targetBatches.find(b => b.id === formData.targetBatchId)!;
        await supabase.from('stock_adjustments').insert({
          owner: formData.targetOwner,
          reference_id: formData.targetBatchId,
          adjustment_type: 'transfer_in',
          previous_quantity: targetBatch.current_quantity,
          actual_quantity: targetBatch.current_quantity + transferQty,
          difference: transferQty,
          reason: `Transferred from ${OWNER_DISPLAY_NAMES[batch.owner]}'s batch ${batch.batch_name}. ${formData.notes}`,
          recorded_by: user?.id || 'system'
        });
      }

      toast({
        title: 'Transfer Successful',
        description: `Successfully transferred ${transferQty} chickens to ${OWNER_DISPLAY_NAMES[formData.targetOwner]}.`,
      });
      
      setOpen(false);
      onSuccess();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transfer Chickens</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          Transferring from <span className="font-semibold">{batch.batch_name}</span> ({batch.current_quantity} available)
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Destination Owner *</Label>
            <Select value={formData.targetOwner} onValueChange={handleOwnerChange}>
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
            <Label>Destination Fowl Run</Label>
            <Select
              value={formData.targetFowlRunId}
              onValueChange={(value) => setFormData({ ...formData, targetFowlRunId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fowl run (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Outside</SelectItem>
                {fowlRuns.map((run) => (
                  <SelectItem key={run.id} value={run.id}>
                    {run.name} ({run.capacity} cap)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Destination Batch *</Label>
            <Select
              value={formData.targetBatchId}
              onValueChange={(value) => setFormData({ ...formData, targetBatchId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">-- Create New Batch --</SelectItem>
                {targetBatches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batch_name} ({b.current_quantity} current)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity to Transfer *</Label>
            <Input
              type="number"
              min="1"
              max={batch.current_quantity}
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Transfer Notes (Optional)</Label>
            <Textarea
              placeholder="Reason for transfer..."
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
              Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
