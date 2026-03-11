import { useEffect, useState } from 'react';
import { Plus, Axe, ArrowRight, Edit, Trash2 } from 'lucide-react';
import { EditSlaughterDialog } from '@/components/edit-dialogs/EditSlaughterDialog';
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
import { SlaughterRecord, Batch, Fridge, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { format } from 'date-fns';

export default function Slaughter() {
  const [records, setRecords] = useState<SlaughterRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    owner: '' as OwnerType | '',
    batch_id: '',
    fridge_id: '',
    quantity: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
    fetchBatches();
    fetchFridges();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('slaughter_records')
      .select('*, batches(*), fridges(*)')
      .order('slaughtered_at', { ascending: false });

    if (error) {
      console.error('Error fetching slaughter records:', error);
    } else {
      setRecords(data as SlaughterRecord[]);
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

  const fetchFridges = async () => {
    const { data } = await supabase
      .from('fridges')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      setFridges(data as Fridge[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner || !formData.batch_id || !formData.fridge_id || !formData.quantity) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    const batch = batches.find(b => b.id === formData.batch_id);

    if (batch && batch.current_quantity < quantity) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `Only ${batch.current_quantity} chickens available in this batch.`,
      });
      return;
    }

    // Record slaughter
    const { error: slaughterError } = await supabase.from('slaughter_records').insert({
      owner: formData.owner,
      batch_id: formData.batch_id,
      fowl_run_id: batch?.fowl_run_id || null,
      fridge_id: formData.fridge_id,
      quantity,
      recorded_by: user?.id,
    });

    if (slaughterError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record slaughter. Please try again.',
      });
      return;
    }

    // Update batch stock
    if (batch) {
      await supabase
        .from('batches')
        .update({ current_quantity: batch.current_quantity - quantity })
        .eq('id', formData.batch_id);
    }

    // Add to fridge stock
    await supabase.from('fridge_stock').insert({
      fridge_id: formData.fridge_id,
      batch_id: formData.batch_id,
      owner: formData.owner,
      quantity,
    });

    toast({
      title: 'Slaughter Recorded',
      description: `${quantity} chickens moved to fridge.`,
    });
    
    setDialogOpen(false);
    setFormData({ owner: '', batch_id: '', fridge_id: '', quantity: '' });
    fetchBatches();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('slaughter_records').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete record. Please try again.',
      });
    } else {
      toast({
        title: 'Record Deleted',
        description: `Slaughter record has been deleted. Stock was NOT restored.`,
      });
      fetchRecords();
    }
  };

  const filteredBatches = batches.filter(b => !formData.owner || b.owner === formData.owner);
  const filteredFridges = fridges.filter(f => !formData.owner || f.owner === formData.owner);

  return (
    <MainLayout>
      <PageHeader
        title="Slaughter Records"
        description="Move chickens from fowl run to fridge"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-warning text-warning-foreground hover:bg-warning/90">
                <Plus className="w-4 h-4 mr-2" />
                Record Slaughter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Slaughter</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="p-4 bg-warning/10 rounded-lg">
                  <p className="text-sm text-warning flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Chickens will be moved from fowl run to fridge
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Owner *</Label>
                  <Select
                    value={formData.owner}
                    onValueChange={(value) => setFormData({ 
                      ...formData, 
                      owner: value as OwnerType,
                      batch_id: '',
                      fridge_id: '',
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
                  <Label>Source Batch *</Label>
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

                <div className="space-y-2">
                  <Label>Destination Fridge *</Label>
                  <Select
                    value={formData.fridge_id}
                    onValueChange={(value) => setFormData({ ...formData, fridge_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fridge" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredFridges.map((fridge) => (
                        <SelectItem key={fridge.id} value={fridge.id}>
                          {fridge.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Number of chickens to slaughter"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-warning text-warning-foreground hover:bg-warning/90">
                    Record Slaughter
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
              <TableHead>From Batch</TableHead>
              <TableHead>To Fridge</TableHead>
               <TableHead>Quantity</TableHead>
               <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Axe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Slaughter Records</h3>
                  <p className="text-muted-foreground">
                    Record your first slaughter to move chickens to fridge.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(new Date(record.slaughtered_at), 'MMM d, yyyy')}
                    <span className="text-muted-foreground text-xs block">
                      {format(new Date(record.slaughtered_at), 'h:mm a')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <OwnerBadge owner={record.owner} size="sm" />
                  </TableCell>
                  <TableCell>{record.batches?.batch_name || '-'}</TableCell>
                  <TableCell>{record.fridges?.name || '-'}</TableCell>
                   <TableCell className="font-semibold">{record.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditSlaughterDialog record={record} onSuccess={fetchRecords} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Slaughter Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this slaughter record. Stock will NOT be restored automatically. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(record.id)}
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
