import { useEffect, useState } from 'react';
import { Plus, Snowflake, Thermometer, MoreHorizontal, Edit, Trash2, Eraser } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Fridge, FridgeStock, OwnerType, OWNER_DISPLAY_NAMES } from '@/lib/types';

export default function Fridges() {
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [fridgeStock, setFridgeStock] = useState<FridgeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    owner: '' as OwnerType | '',
    capacity: '',
    temperature: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchFridges();
    fetchFridgeStock();
  }, []);

  const fetchFridges = async () => {
    const { data, error } = await supabase
      .from('fridges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fridges:', error);
    } else {
      setFridges(data as Fridge[]);
    }
    setLoading(false);
  };

  const fetchFridgeStock = async () => {
    const { data } = await supabase.from('fridge_stock').select('*');
    if (data) {
      setFridgeStock(data as FridgeStock[]);
    }
  };

  const handleClearAllStock = async () => {
    if (!confirm('Are you sure you want to erase ALL stock records? This action cannot be undone.')) {
      return;
    }

    const { error } = await supabase
      .from('fridge_stock')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear stock. Please try again.',
      });
    } else {
      toast({
        title: 'Stock Cleared',
        description: 'All fridge stock records have been erased.',
      });
      fetchFridgeStock();
    }
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

    const { error } = await supabase.from('fridges').insert({
      name: formData.name,
      owner: formData.owner,
      capacity: parseInt(formData.capacity) || 100,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create fridge. Please try again.',
      });
    } else {
      toast({
        title: 'Fridge Created',
        description: 'New fridge has been added successfully.',
      });
      setDialogOpen(false);
      setFormData({ name: '', owner: '', capacity: '', temperature: '' });
      fetchFridges();
    }
  };

  const getStockForFridge = (fridgeId: string) => {
    return fridgeStock
      .filter(s => s.fridge_id === fridgeId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Fridges"
        description="Manage slaughtered chicken storage"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-destructive hover:bg-destructive/10"
              onClick={handleClearAllStock}
            >
              <Eraser className="w-4 h-4 mr-2" />
              Clear All Stock
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  New Fridge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Fridge</DialogTitle>
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
                      placeholder="e.g., Fridge 1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacity</Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Temperature (°C)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="-5"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      />
                    </div>
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
          </div>
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
        ) : fridges.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Snowflake className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Fridges Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a fridge to store slaughtered chickens.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create First Fridge
            </Button>
          </div>
        ) : (
          fridges.map((fridge) => {
            const currentStock = getStockForFridge(fridge.id);
            const stockPercentage = (currentStock / fridge.capacity) * 100;
            
            return (
              <div
                key={fridge.id}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-info/10 text-info">
                      <Snowflake className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{fridge.name}</h3>
                      <OwnerBadge owner={fridge.owner} size="sm" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stock Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <span className="font-semibold">
                      {currentStock} / {fridge.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-info transition-all duration-500"
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {fridge.temperature && (
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Temperature:</span>
                    <span className="font-medium">{fridge.temperature}°C</span>
                  </div>
                )}

                <Badge 
                  variant="outline" 
                  className={fridge.is_active ? 'bg-success/10 text-success mt-4' : 'bg-muted mt-4'}
                >
                  {fridge.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </MainLayout>
  );
}
