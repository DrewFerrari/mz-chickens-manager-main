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
import { FowlRun, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

interface EditFowlRunDialogProps {
  fowlRun: FowlRun;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditFowlRunDialog({ fowlRun, onSuccess, trigger }: EditFowlRunDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: fowlRun.name,
    owner: fowlRun.owner,
    capacity: fowlRun.capacity.toString(),
    is_active: fowlRun.is_active,
    description: fowlRun.description || '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        name: fowlRun.name,
        owner: fowlRun.owner,
        capacity: fowlRun.capacity.toString(),
        is_active: fowlRun.is_active,
        description: fowlRun.description || '',
      });
    }
  }, [open, fowlRun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('fowl_runs')
      .update({
        name: formData.name,
        owner: formData.owner as OwnerType,
        capacity: parseInt(formData.capacity),
        is_active: formData.is_active,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fowlRun.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating fowl run',
        description: error.message,
      });
    } else {
      toast({
        title: 'Fowl run updated',
        description: `${formData.name} has been updated successfully.`,
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
          <DialogTitle>Edit Fowl Run: {fowlRun.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="is_active">Fowl run is active</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Location or other details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
