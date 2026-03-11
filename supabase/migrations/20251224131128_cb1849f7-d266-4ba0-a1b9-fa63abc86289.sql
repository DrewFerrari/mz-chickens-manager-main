-- Add credit to payment_method enum
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'credit';

-- Add ecocash_owner column to sales table to track which owner's EcoCash number was used
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS ecocash_owner public.owner_type;