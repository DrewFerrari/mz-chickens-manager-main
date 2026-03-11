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
import { FeedPurchase, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

const FEED_TYPES = ['Starter Feed', 'Grower Feed', 'Finisher Feed', 'Layer Feed', 'Other'];

interface EditFeedDialogProps {
  purchase: FeedPurchase;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function EditFeedDialog({ purchase, onSuccess, trigger }: EditFeedDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    owner: purchase.owner,
    feed_type: purchase.feed_type,
    bags: purchase.bags.toString(),
    cost_per_bag: purchase.cost_per_bag.toString(),
    supplier: purchase.supplier || '',
    purchased_at: purchase.purchased_at.split('T')[0],
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormData({
        owner: purchase.owner,
        feed_type: purchase.feed_type,
        bags: purchase.bags.toString(),
        cost_per_bag: purchase.cost_per_bag.toString(),
        supplier: purchase.supplier || '',
        purchased_at: purchase.purchased_at.split('T')[0],
      });
    }
  }, [open, purchase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const bags = parseInt(formData.bags);
    const costPerBag = parseFloat(formData.cost_per_bag);
    const totalCost = bags * costPerBag;

    const { error } = await supabase
      .from('feed_purchases')
      .update({
        owner: formData.owner as OwnerType,
        feed_type: formData.feed_type,
        bags,
        cost_per_bag: costPerBag,
        total_cost: totalCost,
        supplier: formData.supplier || null,
        purchased_at: new Date(formData.purchased_at).toISOString(),
      })
      .eq('id', purchase.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating purchase',
        description: error.message,
      });
    } else {
      toast({
        title: 'Purchase updated',
        description: `Feed purchase has been updated successfully.`,
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
          <DialogTitle>Edit Feed Purchase</DialogTitle>
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
            <Label>Feed Type *</Label>
            <Select
              value={formData.feed_type}
              onValueChange={(value) => setFormData({ ...formData, feed_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feed type" />
              </SelectTrigger>
              <SelectContent>
                {FEED_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feed_bags">Bags *</Label>
              <Input
                id="feed_bags"
                type="number"
                required
                value={formData.bags}
                onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_per_bag">Cost/Bag ($) *</Label>
              <Input
                id="cost_per_bag"
                type="number"
                step="0.01"
                required
                value={formData.cost_per_bag}
                onChange={(e) => setFormData({ ...formData, cost_per_bag: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feed_supplier">Supplier</Label>
            <Input
              id="feed_supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchased_at">Purchase Date *</Label>
            <Input
              id="purchased_at"
              type="date"
              required
              value={formData.purchased_at}
              onChange={(e) => setFormData({ ...formData, purchased_at: e.target.value })}
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
