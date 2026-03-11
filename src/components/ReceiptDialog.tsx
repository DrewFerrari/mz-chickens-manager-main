import { useState } from 'react';
import { Printer, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sale, OWNER_DISPLAY_NAMES, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { format } from 'date-fns';

interface ReceiptDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to safely escape HTML entities
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export function ReceiptDialog({ sale, open, onOpenChange }: ReceiptDialogProps) {
  const { toast } = useToast();
  const [printing, setPrinting] = useState(false);

  if (!sale) return null;

  const receiptNumber = `MZ-${sale.id.slice(0, 8).toUpperCase()}`;

  // Build receipt HTML programmatically from data (avoids innerHTML extraction)
  const buildReceiptHtml = (): string => {
    const saleDate = new Date(sale.sold_at);
    const formattedDate = format(saleDate, 'MMM d, yyyy');
    const formattedTime = format(saleDate, 'h:mm a');
    const ownerName = OWNER_DISPLAY_NAMES[sale.owner];
    const itemType = sale.source === 'fowl_run' ? 'Live Chicken' : 'Slaughtered';
    const unitPrice = Number(sale.unit_price).toFixed(2);
    const totalAmount = Number(sale.total_amount).toFixed(2);
    const paymentMethod = PAYMENT_METHOD_LABELS[sale.payment_method];

    // Safely escape customer data
    const customerName = sale.customer_name ? escapeHtml(sale.customer_name) : '';
    const customerPhone = sale.customer_phone ? escapeHtml(sale.customer_phone) : '';

    let customerSection = '';
    if (customerName || customerPhone) {
      customerSection = `
        <div style="border-bottom: 1px dashed #999; padding-bottom: 12px; margin-bottom: 12px;">
          <p style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">CUSTOMER:</p>
          ${customerName ? `<p style="font-size: 12px; margin: 0;">${customerName}</p>` : ''}
          ${customerPhone ? `<p style="font-size: 12px; margin: 0;">${customerPhone}</p>` : ''}
        </div>
      `;
    }

    const creditNotice = sale.payment_method === 'credit' 
      ? '<p style="font-size: 12px; text-align: center; margin-top: 8px; font-weight: bold;">*** CREDIT SALE - PAYMENT PENDING ***</p>'
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${escapeHtml(receiptNumber)}</title>
          <style>
            body {
              font-family: monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              color: black;
              background: white;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div style="text-align: center; border-bottom: 1px dashed #999; padding-bottom: 12px; margin-bottom: 12px;">
            <h1 style="font-size: 18px; font-weight: bold; margin: 0;">MZ CHICKENS</h1>
            <p style="font-size: 12px; margin: 4px 0;">Fresh Quality Chickens</p>
            <p style="font-size: 12px; margin: 0;">${escapeHtml(ownerName)}</p>
          </div>

          <!-- Receipt Info -->
          <div style="border-bottom: 1px dashed #999; padding-bottom: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Receipt #:</span>
              <span>${escapeHtml(receiptNumber)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Date:</span>
              <span>${escapeHtml(formattedDate)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>Time:</span>
              <span>${escapeHtml(formattedTime)}</span>
            </div>
          </div>

          ${customerSection}

          <!-- Items -->
          <div style="border-bottom: 1px dashed #999; padding-bottom: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 8px;">
              <span>ITEM</span>
              <span>AMOUNT</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span>${escapeHtml(itemType)} x${sale.quantity}</span>
              <span></span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="padding-left: 8px;">@ $${unitPrice} each</span>
              <span>$${totalAmount}</span>
            </div>
          </div>

          <!-- Total -->
          <div style="border-bottom: 1px dashed #999; padding-bottom: 12px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>TOTAL:</span>
              <span>$${totalAmount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
              <span>Payment:</span>
              <span>${escapeHtml(paymentMethod)}</span>
            </div>
            ${creditNotice}
          </div>

          <!-- Footer -->
          <div style="text-align: center; font-size: 12px;">
            <p style="font-weight: bold; margin: 0;">Thank you for your purchase!</p>
            <p style="margin: 4px 0;">Quality chickens, every time.</p>
            <p style="margin-top: 8px; color: #666;">--- MZ Chickens ---</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    setPrinting(true);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: 'Print Error',
        description: 'Could not open print window. Please allow popups.',
      });
      setPrinting(false);
      return;
    }

    // Build receipt content programmatically instead of using innerHTML
    const receiptHtml = buildReceiptHtml();
    
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setPrinting(false);
    }, 250);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `🧾 *MZ CHICKENS RECEIPT*\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `Receipt #: ${receiptNumber}\n` +
      `Date: ${new Date(sale.sold_at).toLocaleDateString()}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `${sale.source === 'fowl_run' ? 'Live Chicken' : 'Slaughtered'} x${sale.quantity}\n` +
      `@ $${Number(sale.unit_price).toFixed(2)} each\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `*TOTAL: $${Number(sale.total_amount).toFixed(2)}*\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `Thank you for your purchase!\n` +
      `Quality chickens, every time. 🐔`
    );

    // Sanitize phone number - only keep digits
    const sanitizedPhone = sale.customer_phone?.replace(/\D/g, '') || '';
    
    const whatsappUrl = sanitizedPhone 
      ? `https://wa.me/${sanitizedPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  // Preview component for the dialog (using React's safe JSX rendering)
  const ReceiptPreview = () => (
    <div className="bg-white text-black p-6 w-[300px] font-mono text-sm">
      {/* Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <h1 className="text-lg font-bold">MZ CHICKENS</h1>
        <p className="text-xs">Fresh Quality Chickens</p>
        <p className="text-xs mt-1">{OWNER_DISPLAY_NAMES[sale.owner]}</p>
      </div>

      {/* Receipt Info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="flex justify-between text-xs">
          <span>Receipt #:</span>
          <span>{receiptNumber}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Date:</span>
          <span>{format(new Date(sale.sold_at), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Time:</span>
          <span>{format(new Date(sale.sold_at), 'h:mm a')}</span>
        </div>
      </div>

      {/* Customer Info */}
      {(sale.customer_name || sale.customer_phone) && (
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <p className="text-xs font-bold mb-1">CUSTOMER:</p>
          {sale.customer_name && <p className="text-xs">{sale.customer_name}</p>}
          {sale.customer_phone && <p className="text-xs">{sale.customer_phone}</p>}
        </div>
      )}

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span>ITEM</span>
          <span>AMOUNT</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>{sale.source === 'fowl_run' ? 'Live Chicken' : 'Slaughtered'} x{sale.quantity}</span>
          <span></span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="pl-2">@ ${Number(sale.unit_price).toFixed(2)} each</span>
          <span>${Number(sale.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="flex justify-between font-bold">
          <span>TOTAL:</span>
          <span>${Number(sale.total_amount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Payment:</span>
          <span>{PAYMENT_METHOD_LABELS[sale.payment_method]}</span>
        </div>
        {sale.payment_method === 'credit' && (
          <p className="text-xs text-center mt-2 font-bold">
            *** CREDIT SALE - PAYMENT PENDING ***
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs">
        <p className="font-bold">Thank you for your purchase!</p>
        <p className="mt-1">Quality chickens, every time.</p>
        <p className="mt-2 text-gray-500">--- MZ Chickens ---</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Sale Receipt
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="flex justify-center bg-muted/50 rounded-lg p-4 overflow-auto max-h-[400px]">
          <ReceiptPreview />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handlePrint} disabled={printing} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            {printing ? 'Printing...' : 'Print Receipt'}
          </Button>
          <Button onClick={handleWhatsApp} variant="outline" className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30">
            <MessageCircle className="w-4 h-4 mr-2" />
            Send via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
