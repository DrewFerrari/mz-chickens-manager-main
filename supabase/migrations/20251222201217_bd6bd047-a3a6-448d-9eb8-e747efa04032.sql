-- Fix function search_path security warnings
CREATE OR REPLACE FUNCTION public.get_batch_weeks(batch_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXTRACT(WEEK FROM age(CURRENT_DATE, date_introduced))::INTEGER
  FROM public.batches WHERE id = batch_id
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;