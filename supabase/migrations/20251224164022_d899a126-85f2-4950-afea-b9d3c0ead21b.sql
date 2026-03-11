-- System configuration table for dropdown options
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL,
  config_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_type, config_value)
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config
CREATE POLICY "Authenticated users can view system config"
  ON public.system_config FOR SELECT TO authenticated USING (true);

-- Only admins can manage config
CREATE POLICY "Admins can manage system config"
  ON public.system_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default expense categories
INSERT INTO public.system_config (config_type, config_value, display_order) VALUES
  ('expense_category', 'Vaccination', 1),
  ('expense_category', 'Medication', 2),
  ('expense_category', 'Transportation', 3),
  ('expense_category', 'Utilities', 4),
  ('expense_category', 'Labor', 5),
  ('expense_category', 'Equipment', 6),
  ('expense_category', 'Maintenance', 7),
  ('expense_category', 'Other', 99);

-- Seed default feed types
INSERT INTO public.system_config (config_type, config_value, display_order) VALUES
  ('feed_type', 'Starter Feed', 1),
  ('feed_type', 'Grower Feed', 2),
  ('feed_type', 'Finisher Feed', 3),
  ('feed_type', 'Layer Feed', 4),
  ('feed_type', 'Other', 99);

-- Stock adjustments table for reconciliation
CREATE TABLE public.stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('batch', 'fridge')),
  reference_id UUID NOT NULL,
  previous_quantity INTEGER NOT NULL,
  actual_quantity INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  reason TEXT,
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view adjustments
CREATE POLICY "Authenticated users can view stock adjustments"
  ON public.stock_adjustments FOR SELECT TO authenticated USING (true);

-- Only admins can create adjustments
CREATE POLICY "Admins can create stock adjustments"
  ON public.stock_adjustments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on system_config
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();