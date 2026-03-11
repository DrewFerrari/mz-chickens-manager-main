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
import { NaturalDeath, Batch, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

interface EditDeathDialogProps {
  death: NaturalDeath;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditDeathDialog({ death, onSuccess, trigger }: EditDeathDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    owner: death.owner,
    batch_id: death.batch_id,
    quantity: death.quantity.toString(),
    reason: death.reason || '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBatches();
      setFormData({
        owner: death.owner,
        batch_id: death.batch_id,
        quantity: death.quantity.toString(),
        reason: death.reason || '',
      });
    }
  }, [open, death]);

  const fetchBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'active');
    if (data) setBatches(data as Batch[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('natural_deaths')
      .update({
        owner: formData.owner as OwnerType,
        batch_id: formData.batch_id,
        quantity: parseInt(formData.quantity),
        reason: formData.reason || null,
      })
      .eq('id', death.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating record',
        description: error.message,
      });
    } else {
      toast({
        title: 'Record updated',
        description: `Death record has been updated successfully.`,
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
          <DialogTitle>Edit Death Record</DialogTitle>
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
            <Label>Batch *</Label>
            <Select
              value={formData.batch_id}
              onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches
                  .filter(b => b.owner === formData.owner)
                  .map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_name} ({batch.current_quantity} available)
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="death_quantity">Quantity *</Label>
            <Input
              id="death_quantity"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="death_reason">Reason</Label>
            <Textarea
              id="death_reason"
              placeholder="Reason for death..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
