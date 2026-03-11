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
import { SlaughterRecord, Batch, Fridge, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

interface EditSlaughterDialogProps {
  record: SlaughterRecord;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditSlaughterDialog({ record, onSuccess, trigger }: EditSlaughterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [formData, setFormData] = useState({
    owner: record.owner,
    batch_id: record.batch_id,
    fridge_id: record.fridge_id,
    quantity: record.quantity.toString(),
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBatches();
      fetchFridges();
      setFormData({
        owner: record.owner,
        batch_id: record.batch_id,
        fridge_id: record.fridge_id,
        quantity: record.quantity.toString(),
      });
    }
  }, [open, record]);

  const fetchBatches = async () => {
    const { data } = await supabase.from('batches').select('*');
    if (data) setBatches(data as Batch[]);
  };

  const fetchFridges = async () => {
    const { data } = await supabase.from('fridges').select('*');
    if (data) setFridges(data as Fridge[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('slaughter_records')
      .update({
        owner: formData.owner as OwnerType,
        batch_id: formData.batch_id,
        fridge_id: formData.fridge_id,
        quantity: parseInt(formData.quantity),
      })
      .eq('id', record.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating record',
        description: error.message,
      });
    } else {
      toast({
        title: 'Record updated',
        description: `Slaughter record has been updated successfully.`,
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
          <DialogTitle>Edit Slaughter Record</DialogTitle>
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
                      {batch.batch_name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fridge *</Label>
            <Select
              value={formData.fridge_id}
              onValueChange={(value) => setFormData({ ...formData, fridge_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fridge" />
              </SelectTrigger>
              <SelectContent>
                {fridges
                  .filter(f => f.owner === formData.owner)
                  .map((fridge) => (
                    <SelectItem key={fridge.id} value={fridge.id}>
                      {fridge.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slaughter_quantity">Quantity *</Label>
            <Input
              id="slaughter_quantity"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
