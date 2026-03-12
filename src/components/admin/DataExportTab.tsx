import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Database } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ExportType = 'sales' | 'expenses' | 'batches' | 'feed_purchases' | 'natural_deaths' | 'slaughter_records' | 'fridge_stock' | 'cash_records' | 'stock_adjustments' | 'full_backup';

export function DataExportTab() {
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const { toast } = useToast();

  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'No records found to export.',
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: 'Export Complete',
      description: `${data.length} records exported to ${filename}.csv`,
    });
  };

  const handleExport = async (type: ExportType) => {
    setExporting(type);

    try {
      if (type === 'full_backup') {
        // Export all tables
        const tables = ['sales', 'expenses', 'batches', 'feed_purchases', 'natural_deaths', 'fridge_stock', 'slaughter_records', 'cash_records', 'stock_adjustments'];
        for (const table of tables) {
          const { data } = await supabase.from(table as 'sales').select('*');
          if (data && data.length > 0) {
            exportToCSV(data as Record<string, unknown>[], table);
          }
        }
        toast({
          title: 'Full Backup Complete',
          description: 'All tables have been exported.',
        });
      } else {
        let orderColumn = 'created_at';
        if (type === 'sales') orderColumn = 'sold_at';
        if (type === 'feed_purchases') orderColumn = 'purchased_at';
        if (type === 'natural_deaths' || type === 'cash_records' || type === 'stock_adjustments') orderColumn = 'recorded_at';
        if (type === 'slaughter_records') orderColumn = 'slaughtered_at';
        if (type === 'fridge_stock') orderColumn = 'updated_at';

        const { data, error } = await supabase.from(type).select('*').order(orderColumn, { ascending: false });
        if (error) throw error;
        exportToCSV((data || []) as Record<string, unknown>[], type);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    setExporting(null);
  };

  const exportOptions = [
    { type: 'sales' as ExportType, title: 'Sales Report', description: 'All sales transactions', icon: FileSpreadsheet },
    { type: 'expenses' as ExportType, title: 'Expenses Report', description: 'All expense records', icon: FileSpreadsheet },
    { type: 'batches' as ExportType, title: 'Batches Report', description: 'All batch information', icon: FileSpreadsheet },
    { type: 'feed_purchases' as ExportType, title: 'Feed Purchases', description: 'All feed purchase records', icon: FileSpreadsheet },
    { type: 'natural_deaths' as ExportType, title: 'Mortality Report', description: 'All death records', icon: FileSpreadsheet },
    { type: 'slaughter_records' as ExportType, title: 'Slaughter Records', description: 'All slaughter records', icon: FileSpreadsheet },
    { type: 'fridge_stock' as ExportType, title: 'Fridge Stock Report', description: 'Current fridge stock', icon: FileSpreadsheet },
    { type: 'cash_records' as ExportType, title: 'Cash Records', description: 'All cash transactions', icon: FileSpreadsheet },
    { type: 'stock_adjustments' as ExportType, title: 'Stock Adjustments', description: 'Stock adjustment logs', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Data Export</h3>
      </div>

      {/* Full Backup */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Full Database Backup
              </CardTitle>
              <CardDescription>Export all tables for complete backup</CardDescription>
            </div>
            <Button 
              onClick={() => handleExport('full_backup')}
              disabled={exporting !== null}
              className="gap-2"
            >
              {exporting === 'full_backup' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download All
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Individual Exports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportOptions.map((option) => (
          <Card key={option.type}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <option.icon className="w-4 h-4 text-muted-foreground" />
                {option.title}
              </CardTitle>
              <CardDescription className="text-sm">{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport(option.type)}
                disabled={exporting !== null}
                className="w-full gap-2"
              >
                {exporting === option.type ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
