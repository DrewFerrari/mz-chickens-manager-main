import { useEffect, useState } from 'react';
import { Plus, Warehouse, Bird, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditFowlRunDialog } from '@/components/edit-dialogs/EditFowlRunDialog';
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
import { useToast } from '@/hooks/use-toast';
import { FowlRun, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

export default function FowlRuns() {
  const [fowlRuns, setFowlRuns] = useState<FowlRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    owner: '' as OwnerType | '',
    description: '',
    capacity: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchFowlRuns();
  }, []);

  const fetchFowlRuns = async () => {
    const { data, error } = await supabase
      .from('fowl_runs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fowl runs:', error);
    } else {
      setFowlRuns(data as FowlRun[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.owner || !formData.name) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const { error } = await supabase.from('fowl_runs').insert({
      name: formData.name,
      owner: formData.owner,
      description: formData.description || null,
      capacity: parseInt(formData.capacity) || 500,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create fowl run. Please try again.',
      });
    } else {
      toast({
        title: 'Fowl Run Created',
        description: 'New fowl run has been added successfully.',
      });
      setDialogOpen(false);
      setFormData({ name: '', owner: '', description: '', capacity: '' });
      fetchFowlRuns();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('fowl_runs').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete fowl run. Please try again.',
      });
    } else {
      toast({
        title: 'Fowl Run Deleted',
        description: `"${name}" has been deleted.`,
      });
      fetchFowlRuns();
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Fowl Runs"
        description="Manage chicken housing locations"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Fowl Run
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Fowl Run</DialogTitle>
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
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., Run A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    placeholder="500"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Optional description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary">
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-2/3 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))
        ) : fowlRuns.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Warehouse className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Fowl Runs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first fowl run to organize chicken housing.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create First Run
            </Button>
          </div>
        ) : (
          fowlRuns.map((run) => (
            <div
              key={run.id}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{run.name}</h3>
                    <OwnerBadge owner={run.owner} size="sm" />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <EditFowlRunDialog 
                        fowlRun={run} 
                        onSuccess={fetchFowlRuns} 
                        trigger={
                          <button className="flex w-full items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                        } 
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(run.id, run.name)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Capacity</span>
                <span className="font-medium">{run.capacity} chickens</span>
              </div>

              {run.description && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                  {run.description}
                </p>
              )}

              <Badge 
                variant="outline" 
                className={run.is_active ? 'bg-success/10 text-success mt-4' : 'bg-muted mt-4'}
              >
                {run.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}
