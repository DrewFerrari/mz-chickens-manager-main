import { useEffect, useState } from 'react';
import { Plus, Bird, Calendar, Hash, MoreHorizontal, Edit, Trash2, ArrowLeftRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditBatchDialog } from '@/components/edit-dialogs/EditBatchDialog';
import { TransferBatchDialog } from '@/components/edit-dialogs/TransferBatchDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Batch, FowlRun, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fowlRuns, setFowlRuns] = useState<FowlRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    batch_name: '',
    owner: '' as OwnerType | '',
    fowl_run_id: '',
    starting_quantity: '',
    cost_per_chick: '',
    notes: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
    fetchFowlRuns();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('batches')
      .select('*, fowl_runs(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching batches:', error);
    } else {
      setBatches(data as Batch[]);
    }
    setLoading(false);
  };

  const fetchFowlRuns = async () => {
    const { data } = await supabase
      .from('fowl_runs')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      setFowlRuns(data as FowlRun[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner || !formData.batch_name || !formData.starting_quantity) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const { error } = await supabase.from('batches').insert({
      batch_name: formData.batch_name,
      owner: formData.owner,
      fowl_run_id: formData.fowl_run_id || null,
      starting_quantity: parseInt(formData.starting_quantity),
      current_quantity: parseInt(formData.starting_quantity),
      cost_per_chick: parseFloat(formData.cost_per_chick) || 0,
      notes: formData.notes || null,
      created_by: user?.id,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create batch. Please try again.',
      });
    } else {
      toast({
        title: 'Batch Created',
        description: 'New batch has been added successfully.',
      });
      setDialogOpen(false);
      setFormData({
        batch_name: '',
        owner: '',
        fowl_run_id: '',
        starting_quantity: '',
        cost_per_chick: '',
        notes: '',
      });
      fetchBatches();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('batches').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete batch. Please try again.',
      });
    } else {
      toast({
        title: 'Batch Deleted',
        description: `"${name}" has been deleted.`,
      });
      fetchBatches();
    }
  };

  const calculateWeeks = (dateIntroduced: string) => {
    const start = new Date(dateIntroduced);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'sold_out':
        return 'bg-muted text-muted-foreground border-muted';
      case 'closed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return '';
    }
  };

  const filteredFowlRuns = fowlRuns.filter(
    (fr) => !formData.owner || fr.owner === formData.owner
  );

  return (
    <MainLayout>
      <PageHeader
        title="Chicken Batches"
        description="Manage and track all chicken batches"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Owner *</Label>
                  <Select
                    value={formData.owner}
                    onValueChange={(value) => setFormData({ ...formData, owner: value as OwnerType, fowl_run_id: '' })}
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
                  <Label>Batch Name *</Label>
                  <Input
                    placeholder="e.g., Batch 2024-01"
                    value={formData.batch_name}
                    onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fowl Run</Label>
                  <Select
                    value={formData.fowl_run_id}
                    onValueChange={(value) => setFormData({ ...formData, fowl_run_id: value })}
                    disabled={!formData.owner}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fowl run (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredFowlRuns.map((fr) => (
                        <SelectItem key={fr.id} value={fr.id}>
                          {fr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Starting Quantity *</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={formData.starting_quantity}
                      onChange={(e) => setFormData({ ...formData, starting_quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost per Chick ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.50"
                      value={formData.cost_per_chick}
                      onChange={(e) => setFormData({ ...formData, cost_per_chick: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Optional notes about this batch..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    Create Batch
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Batches Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-2/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          ))
        ) : batches.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Bird className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Batches Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first batch to start tracking chickens.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create First Batch
            </Button>
          </div>
        ) : (
          batches.map((batch) => (
            <div
              key={batch.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{batch.batch_name}</h3>
                  <OwnerBadge owner={batch.owner} size="sm" className="mt-1" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <TransferBatchDialog
                        batch={batch}
                        onSuccess={fetchBatches}
                        trigger={
                          <button className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                            Transfer
                          </button>
                        }
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <EditBatchDialog 
                        batch={batch} 
                        onSuccess={fetchBatches} 
                        trigger={
                          <button className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                        } 
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(batch.id, batch.batch_name)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bird className="w-4 h-4" />
                    <span>Current Stock</span>
                  </div>
                  <span className="font-semibold text-lg">
                    {batch.current_quantity}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{batch.starting_quantity}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Age</span>
                  </div>
                  <span className="font-medium">
                    {calculateWeeks(batch.date_introduced)} weeks
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                  <Badge variant="outline" className={cn('capitalize', getStatusColor(batch.status))}>
                    {batch.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {batch.fowl_runs && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Fowl Run: <span className="font-medium text-foreground">{batch.fowl_runs.name}</span>
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
