import { forwardRef } from 'react';
import { Sale, OWNER_DISPLAY_NAMES, PAYMENT_METHOD_LABELS } from '@/lib/types';
import { format } from 'date-fns';

interface SaleReceiptProps {
  sale: Sale;
  receiptNumber: string;
}

export const SaleReceipt = forwardRef<HTMLDivElement, SaleReceiptProps>(
  ({ sale, receiptNumber }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-6 w-[300px] font-mono text-sm"
        style={{ fontFamily: 'monospace' }}
      >
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
            {sale.customer_name && (
              <p className="text-xs">{sale.customer_name}</p>
            )}
            {sale.customer_phone && (
              <p className="text-xs">{sale.customer_phone}</p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span>ITEM</span>
            <span>AMOUNT</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>
              {sale.source === 'fowl_run' ? 'Live Chicken' : 'Slaughtered'} x{sale.quantity}
            </span>
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
  }
);

SaleReceipt.displayName = 'SaleReceipt';
