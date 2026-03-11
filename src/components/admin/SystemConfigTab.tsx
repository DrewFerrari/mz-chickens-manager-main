import { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, GripVertical, Loader2, AlertTriangle, Eraser } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConfigItem {
  id: string;
  config_type: string;
  config_value: string;
  display_order: number;
  is_active: boolean;
}

export function SystemConfigTab() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newFeedType, setNewFeedType] = useState('');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['batches', 'sales', 'expenses', 'storage', 'logs']);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('display_order', { ascending: true });

    if (data && !error) {
      setConfigs(data as ConfigItem[]);
    }
    setLoading(false);
  };

  const addConfig = async (configType: string, value: string) => {
    if (!value.trim()) return;

    const maxOrder = configs
      .filter(c => c.config_type === configType)
      .reduce((max, c) => Math.max(max, c.display_order), 0);

    const { error } = await supabase.from('system_config').insert({
      config_type: configType,
      config_value: value.trim(),
      display_order: maxOrder + 1,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message.includes('duplicate') 
          ? 'This value already exists' 
          : error.message,
      });
    } else {
      toast({ title: 'Added', description: `${value} has been added.` });
      fetchConfigs();
      if (configType === 'expense_category') setNewExpenseCategory('');
      if (configType === 'feed_type') setNewFeedType('');
    }
  };

  const deleteConfig = async (id: string, value: string) => {
    const { error } = await supabase.from('system_config').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Deleted', description: `${value} has been removed.` });
      fetchConfigs();
    }
  };

  const handleFactoryReset = async () => {
    if (resetConfirmation !== 'ERASE') {
      toast({
        variant: 'destructive',
        title: 'Validation Failed',
        description: 'Please type "ERASE" to confirm the reset.',
      });
      return;
    }

    setIsResetting(true);
    
    // Define table mapping for each category
    const categoryToTables: Record<string, string[]> = {
      'batches': ['batches'],
      'sales': ['sales', 'cash_records'],
      'expenses': ['expenses', 'feed_purchases'],
      'storage': ['fridges', 'fridge_stock', 'fowl_runs', 'slaughter_records', 'natural_deaths'],
      'logs': ['activity_logs']
    };

    // Build the list of tables to clear based on selected categories
    const tablesToClear = selectedCategories.flatMap(cat => categoryToTables[cat] || []);

    if (tablesToClear.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Selection Empty',
        description: 'Please select at least one category to erase.',
      });
      setIsResetting(false);
      return;
    }

    try {
      for (const table of tablesToClear) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything in targeted table
        
        if (error) throw error;
      }

      toast({
        title: 'Reset Complete',
        description: `Successfully erased data from ${selectedCategories.length} categories.`,
      });
      setResetConfirmation('');
      fetchConfigs();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message || 'An error occurred during factory reset.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const expenseCategories = configs.filter(c => c.config_type === 'expense_category');
  const feedTypes = configs.filter(c => c.config_type === 'feed_type');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">System Configuration</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Categories</CardTitle>
            <CardDescription>Manage dropdown options for expense recording</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New category..."
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addConfig('expense_category', newExpenseCategory)}
              />
              <Button 
                size="icon" 
                onClick={() => addConfig('expense_category', newExpenseCategory)}
                disabled={!newExpenseCategory.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {expenseCategories.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span>{item.config_value}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove "{item.config_value}" from expense categories?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => deleteConfig(item.id, item.config_value)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feed Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feed Types</CardTitle>
            <CardDescription>Manage dropdown options for feed purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New feed type..."
                value={newFeedType}
                onChange={(e) => setNewFeedType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addConfig('feed_type', newFeedType)}
              />
              <Button 
                size="icon" 
                onClick={() => addConfig('feed_type', newFeedType)}
                disabled={!newFeedType.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {feedTypes.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <span>{item.config_value}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feed Type?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove "{item.config_value}" from feed types?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => deleteConfig(item.id, item.config_value)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/20 bg-destructive/5 mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanent actions that cannot be undone. System records will be wiped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border border-destructive/20 rounded-xl bg-background/50">
            <div className="space-y-1">
              <h4 className="font-semibold text-destructive flex items-center gap-2">
                <Eraser className="w-4 h-4" />
                Factory Reset
              </h4>
              <p className="text-sm text-muted-foreground">
                Delete all batches, sales, expenses, and storage records.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4 pt-2">
                    <p>
                      Select the data categories you wish to permanently erase. This action cannot be undone.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                      <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-background/50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-primary"
                          checked={selectedCategories.includes('batches')}
                          onChange={() => toggleCategory('batches')}
                        />
                        <span className="text-sm font-medium">Batches</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-background/50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-primary"
                          checked={selectedCategories.includes('sales')}
                          onChange={() => toggleCategory('sales')}
                        />
                        <span className="text-sm font-medium">Sales & Cash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-background/50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-primary"
                          checked={selectedCategories.includes('expenses')}
                          onChange={() => toggleCategory('expenses')}
                        />
                        <span className="text-sm font-medium">Expenses & Feed</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-background/50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-primary"
                          checked={selectedCategories.includes('storage')}
                          onChange={() => toggleCategory('storage')}
                        />
                        <span className="text-sm font-medium">Storage & Production</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-background/50 rounded transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-primary"
                          checked={selectedCategories.includes('logs')}
                          onChange={() => toggleCategory('logs')}
                        />
                        <span className="text-sm font-medium">Activity Logs</span>
                      </label>
                    </div>

                    <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive font-semibold">
                        Type "ERASE" below to confirm:
                      </p>
                      <Input
                        className="mt-2 border-destructive bg-background"
                        placeholder="Type ERASE..."
                        value={resetConfirmation}
                        onChange={(e) => setResetConfirmation(e.target.value)}
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setResetConfirmation('');
                    setSelectedCategories(['batches', 'sales', 'expenses', 'storage', 'logs']);
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleFactoryReset}
                    disabled={resetConfirmation !== 'ERASE' || selectedCategories.length === 0 || isResetting}
                  >
                    {isResetting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eraser className="w-4 h-4 mr-2" />
                    )}
                    Erase Selected Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
