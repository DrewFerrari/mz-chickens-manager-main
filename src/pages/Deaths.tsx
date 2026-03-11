import { useEffect, useState } from 'react';
import { Plus, Skull, AlertTriangle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { NaturalDeath, Batch, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { format } from 'date-fns';

export default function Deaths() {
  const [deaths, setDeaths] = useState<NaturalDeath[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    owner: '' as OwnerType | '',
    batch_id: '',
    quantity: '',
    reason: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchDeaths();
    fetchBatches();
  }, []);

  const fetchDeaths = async () => {
    const { data, error } = await supabase
      .from('natural_deaths')
      .select('*, batches(*)')
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching deaths:', error);
    } else {
      setDeaths(data as NaturalDeath[]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner || !formData.batch_id || !formData.quantity) {
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
        description: `Cannot record more deaths than available chickens (${batch.current_quantity}).`,
      });
      return;
    }

    // Record death
    const { error: deathError } = await supabase.from('natural_deaths').insert({
      owner: formData.owner,
      batch_id: formData.batch_id,
      fowl_run_id: batch?.fowl_run_id || null,
      quantity,
      reason: formData.reason || null,
      recorded_by: user?.id,
    });

    if (deathError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record death. Please try again.',
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

    toast({
      title: 'Death Recorded',
      description: `${quantity} chicken death(s) recorded.`,
    });
    
    setDialogOpen(false);
    setFormData({ owner: '', batch_id: '', quantity: '', reason: '' });
    fetchDeaths();
    fetchBatches();
  };

  const filteredBatches = batches.filter(b => !formData.owner || b.owner === formData.owner);

  const totalDeaths = deaths.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <MainLayout>
      <PageHeader
        title="Natural Deaths"
        description={`Total recorded: ${totalDeaths} chickens`}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Plus className="w-4 h-4 mr-2" />
                Record Death
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Natural Death</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    This will reduce the current stock in the selected batch.
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
                  <Label>Batch *</Label>
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
                  <Label>Number of Deaths *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Optional reason for death..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive">
                    Record Death
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
              <TableHead>Batch</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
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
            ) : deaths.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Skull className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Deaths Recorded</h3>
                  <p className="text-muted-foreground">
                    Fortunately, no deaths have been recorded yet.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              deaths.map((death) => (
                <TableRow key={death.id}>
                  <TableCell className="font-medium">
                    {format(new Date(death.recorded_at), 'MMM d, yyyy')}
                    <span className="text-muted-foreground text-xs block">
                      {format(new Date(death.recorded_at), 'h:mm a')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <OwnerBadge owner={death.owner} size="sm" />
                  </TableCell>
                  <TableCell>
                    {death.batches?.batch_name || '-'}
                  </TableCell>
                  <TableCell className="font-semibold text-destructive">
                    {death.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {death.reason || '-'}
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
