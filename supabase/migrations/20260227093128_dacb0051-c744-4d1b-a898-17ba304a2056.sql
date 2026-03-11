
-- Allow admins to delete batches
CREATE POLICY "Admins can delete batches" ON public.batches
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to delete sales
CREATE POLICY "Admins can delete sales" ON public.sales
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to delete expenses
CREATE POLICY "Admins can delete expenses" ON public.expenses
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to delete feed purchases
CREATE POLICY "Admins can delete feed_purchases" ON public.feed_purchases
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to delete natural deaths
CREATE POLICY "Admins can delete natural_deaths" ON public.natural_deaths
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to delete slaughter records
CREATE POLICY "Admins can delete slaughter_records" ON public.slaughter_records
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));
