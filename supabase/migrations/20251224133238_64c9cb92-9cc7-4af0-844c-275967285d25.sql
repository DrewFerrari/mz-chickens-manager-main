-- Add paid_at column to sales table for tracking when credit sales are settled
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Index for unpaid credit sales queries
CREATE INDEX IF NOT EXISTS idx_sales_unpaid_credit ON public.sales (payment_method, paid_at) WHERE payment_method = 'credit' AND paid_at IS NULL;