import { useEffect, useState } from 'react';
import { Plus, Package, Edit, Trash2 } from 'lucide-react';
import { EditFeedDialog } from '@/components/edit-dialogs/EditFeedDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { Button } from '@/components/ui/button';
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
import { FeedPurchase, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { format } from 'date-fns';

const FEED_TYPES = ['Starter Feed', 'Grower Feed', 'Finisher Feed', 'Layer Feed', 'Other'];

export default function Feed() {
  const [purchases, setPurchases] = useState<FeedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    owner: '' as OwnerType | '',
    feed_type: '',
    bags: '',
    cost_per_bag: '',
    supplier: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('feed_purchases')
      .select('*')
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching feed purchases:', error);
    } else {
      setPurchases(data as FeedPurchase[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner || !formData.feed_type || !formData.bags || !formData.cost_per_bag) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const bags = parseInt(formData.bags);
    const costPerBag = parseFloat(formData.cost_per_bag);
    const totalCost = bags * costPerBag;

    const { error } = await supabase.from('feed_purchases').insert({
      owner: formData.owner,
      feed_type: formData.feed_type,
      bags,
      cost_per_bag: costPerBag,
      total_cost: totalCost,
      supplier: formData.supplier || null,
      recorded_by: user?.id,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record purchase. Please try again.',
      });
    } else {
      toast({
        title: 'Purchase Recorded',
        description: `${bags} bags of ${formData.feed_type} for $${totalCost.toFixed(2)}`,
      });
      setDialogOpen(false);
      setFormData({ owner: '', feed_type: '', bags: '', cost_per_bag: '', supplier: '' });
      fetchPurchases();
    }
  };

  const handleDelete = async (id: string, feedType: string) => {
    const { error } = await supabase.from('feed_purchases').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete purchase. Please try again.',
      });
    } else {
      toast({
        title: 'Purchase Deleted',
        description: `Purchase of ${feedType} has been deleted.`,
      });
      fetchPurchases();
    }
  };

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.total_cost), 0);

  return (
    <MainLayout>
      <PageHeader
        title="Feed Purchases"
        description={`Total spent: $${totalSpent.toFixed(2)}`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Record Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Feed Purchase</DialogTitle>
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
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Bags *</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="10"
                      value={formData.bags}
                      onChange={(e) => setFormData({ ...formData, bags: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Bag ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="25.00"
                      value={formData.cost_per_bag}
                      onChange={(e) => setFormData({ ...formData, cost_per_bag: e.target.value })}
                    />
                  </div>
                </div>

                {formData.bags && formData.cost_per_bag && (
                  <p className="text-sm font-medium text-primary">
                    Total: ${(parseInt(formData.bags || '0') * parseFloat(formData.cost_per_bag || '0')).toFixed(2)}
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    placeholder="Optional supplier name"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    Record Purchase
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Feed Type</TableHead>
              <TableHead>Bags</TableHead>
              <TableHead>Cost/Bag</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Purchases Yet</h3>
                  <p className="text-muted-foreground">
                    Record your first feed purchase.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {format(new Date(purchase.purchased_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <OwnerBadge owner={purchase.owner} size="sm" />
                  </TableCell>
                  <TableCell>{purchase.feed_type}</TableCell>
                  <TableCell>{purchase.bags}</TableCell>
                  <TableCell>${Number(purchase.cost_per_bag).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-destructive">
                    -${Number(purchase.total_cost).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {purchase.supplier || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditFeedDialog purchase={purchase} onSuccess={fetchPurchases} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Feed Purchase?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this feed purchase record. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(purchase.id, purchase.feed_type)}
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
