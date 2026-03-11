import { useEffect, useState } from 'react';
import { Scale, AlertTriangle, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { OwnerBadge } from '@/components/ui/owner-badge';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Batch, OwnerType } from '@/lib/types';

interface FridgeStock {
  id: string;
  fridge_id: string;
  quantity: number;
  owner: OwnerType;
  fridge?: { name: string };
}

interface AdjustmentDialog {
  type: 'batch' | 'fridge';
  id: string;
  name: string;
  currentQty: number;
  owner: OwnerType;
}

export function StockReconciliationTab() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [fridgeStocks, setFridgeStocks] = useState<FridgeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustDialog, setAdjustDialog] = useState<AdjustmentDialog | null>(null);
  const [actualQty, setActualQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [batchesRes, fridgeRes] = await Promise.all([
      supabase.from('batches').select('*').eq('status', 'active').order('batch_name'),
      supabase.from('fridge_stock').select('*, fridges(name)').gt('quantity', 0),
    ]);

    if (batchesRes.data) setBatches(batchesRes.data as Batch[]);
    if (fridgeRes.data) {
      setFridgeStocks(fridgeRes.data.map(fs => ({
        ...fs,
        fridge: fs.fridges as { name: string } | undefined
      })) as FridgeStock[]);
    }
    setLoading(false);
  };

  const openAdjustDialog = (type: 'batch' | 'fridge', id: string, name: string, currentQty: number, owner: OwnerType) => {
    setAdjustDialog({ type, id, name, currentQty, owner });
    setActualQty(String(currentQty));
    setReason('');
  };

  const handleAdjust = async () => {
    if (!adjustDialog || !user) return;

    const newQty = parseInt(actualQty, 10);
    if (isNaN(newQty) || newQty < 0) {
      toast({ variant: 'destructive', title: 'Invalid quantity' });
      return;
    }

    const difference = newQty - adjustDialog.currentQty;
    if (difference === 0) {
      toast({ title: 'No change', description: 'Quantity is the same.' });
      setAdjustDialog(null);
      return;
    }

    setSaving(true);

    try {
      // Log the adjustment
      const { error: logError } = await supabase.from('stock_adjustments').insert({
        owner: adjustDialog.owner,
        adjustment_type: adjustDialog.type,
        reference_id: adjustDialog.id,
        previous_quantity: adjustDialog.currentQty,
        actual_quantity: newQty,
        difference,
        reason: reason || null,
        recorded_by: user.id,
      });

      if (logError) throw logError;

      // Update the actual stock
      if (adjustDialog.type === 'batch') {
        const { error } = await supabase
          .from('batches')
          .update({ current_quantity: newQty })
          .eq('id', adjustDialog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fridge_stock')
          .update({ quantity: newQty })
          .eq('id', adjustDialog.id);
        if (error) throw error;
      }

      toast({
        title: 'Stock Adjusted',
        description: `${adjustDialog.name}: ${adjustDialog.currentQty} → ${newQty} (${difference > 0 ? '+' : ''}${difference})`,
      });

      setAdjustDialog(null);
      fetchData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust stock',
      });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const difference = adjustDialog ? parseInt(actualQty || '0', 10) - adjustDialog.currentQty : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Stock Reconciliation</h3>
      </div>

      <Card className="border-warning/30 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            How Stock Take Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Count your actual stock, then click "Adjust" to update the system. Any difference is logged as an Inventory Gain/Loss with your reason.
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Batches</CardTitle>
            <CardDescription>Birds currently in fowl runs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No active batches
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batch_name}</TableCell>
                      <TableCell><OwnerBadge owner={batch.owner} size="sm" /></TableCell>
                      <TableCell className="text-right font-mono">{batch.current_quantity}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustDialog('batch', batch.id, batch.batch_name, batch.current_quantity, batch.owner)}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Fridge Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fridge Stock</CardTitle>
            <CardDescription>Slaughtered birds in storage</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fridge</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">System Qty</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fridgeStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No fridge stock
                    </TableCell>
                  </TableRow>
                ) : (
                  fridgeStocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.fridge?.name || 'Unknown'}</TableCell>
                      <TableCell><OwnerBadge owner={stock.owner} size="sm" /></TableCell>
                      <TableCell className="text-right font-mono">{stock.quantity}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustDialog('fridge', stock.id, stock.fridge?.name || 'Fridge', stock.quantity, stock.owner)}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Adjustment Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock: {adjustDialog?.name}</DialogTitle>
            <DialogDescription>
              Enter the actual count from your stock take.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current System Quantity</span>
              <span className="font-mono font-semibold">{adjustDialog?.currentQty}</span>
            </div>

            <div>
              <label className="text-sm font-medium">Actual Count</label>
              <Input
                type="number"
                min="0"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                className="mt-1"
              />
            </div>

            {difference !== 0 && (
              <div className={`flex items-center justify-between p-3 rounded-lg ${difference > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <span className="text-sm font-medium">
                  {difference > 0 ? 'Inventory Gain' : 'Inventory Loss'}
                </span>
                <span className="font-mono font-bold">
                  {difference > 0 ? '+' : ''}{difference}
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="e.g., Physical count discrepancy, theft suspected, miscounted earlier..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjust} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
