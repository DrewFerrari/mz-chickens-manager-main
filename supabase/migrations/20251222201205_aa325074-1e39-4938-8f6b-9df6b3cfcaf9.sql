-- MZ CHICKENS - Poultry Management System Database Schema

-- Create ENUM types
CREATE TYPE public.owner_type AS ENUM ('miss_munyanyi', 'mai_zindove');
CREATE TYPE public.user_role AS ENUM ('admin', 'seller');
CREATE TYPE public.chicken_source AS ENUM ('fowl_run', 'fridge');
CREATE TYPE public.batch_status AS ENUM ('active', 'sold_out', 'closed');
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank', 'mobile_money');

-- Profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'seller',
  assigned_owner owner_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Fowl Runs table
CREATE TABLE public.fowl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner owner_type NOT NULL,
  description TEXT,
  capacity INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fowl_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fowl runs" ON public.fowl_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage fowl runs" ON public.fowl_runs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fridges table
CREATE TABLE public.fridges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner owner_type NOT NULL,
  capacity INTEGER DEFAULT 100,
  temperature DECIMAL(4,1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fridges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fridges" ON public.fridges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage fridges" ON public.fridges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL,
  owner owner_type NOT NULL,
  fowl_run_id UUID REFERENCES public.fowl_runs(id) ON DELETE SET NULL,
  date_introduced DATE NOT NULL DEFAULT CURRENT_DATE,
  starting_quantity INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL,
  cost_per_chick DECIMAL(10,2) DEFAULT 0,
  status batch_status DEFAULT 'active',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view batches" ON public.batches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert batches" ON public.batches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update batches" ON public.batches
  FOR UPDATE TO authenticated USING (true);

-- Function to calculate batch age in weeks
CREATE OR REPLACE FUNCTION public.get_batch_weeks(batch_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT EXTRACT(WEEK FROM age(CURRENT_DATE, date_introduced))::INTEGER
  FROM public.batches WHERE id = batch_id
$$;

-- Natural Deaths table
CREATE TABLE public.natural_deaths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  fowl_run_id UUID REFERENCES public.fowl_runs(id) ON DELETE SET NULL,
  owner owner_type NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.natural_deaths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deaths" ON public.natural_deaths
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can record deaths" ON public.natural_deaths
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Slaughter Records table
CREATE TABLE public.slaughter_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE NOT NULL,
  fowl_run_id UUID REFERENCES public.fowl_runs(id) ON DELETE SET NULL,
  fridge_id UUID REFERENCES public.fridges(id) ON DELETE SET NULL NOT NULL,
  owner owner_type NOT NULL,
  quantity INTEGER NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  slaughtered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.slaughter_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view slaughter records" ON public.slaughter_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create slaughter records" ON public.slaughter_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Fridge Stock table (tracks current stock in fridges)
CREATE TABLE public.fridge_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fridge_id UUID REFERENCES public.fridges(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  owner owner_type NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  slaughtered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fridge_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view fridge stock" ON public.fridge_stock
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage fridge stock" ON public.fridge_stock
  FOR ALL TO authenticated USING (true);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner owner_type NOT NULL,
  source chicken_source NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  fridge_stock_id UUID REFERENCES public.fridge_stock(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method DEFAULT 'cash',
  customer_name TEXT,
  customer_phone TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales" ON public.sales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Feed Purchases table
CREATE TABLE public.feed_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner owner_type NOT NULL,
  feed_type TEXT NOT NULL,
  bags INTEGER NOT NULL,
  cost_per_bag DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  supplier TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view feed purchases" ON public.feed_purchases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create feed purchases" ON public.feed_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Expenses table (general expenses)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner owner_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses" ON public.expenses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Cash Records table
CREATE TABLE public.cash_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner owner_type NOT NULL,
  transaction_type TEXT NOT NULL, -- 'sale', 'expense', 'feed_purchase', 'adjustment'
  reference_id UUID, -- references the sale, expense, etc.
  amount DECIMAL(10,2) NOT NULL, -- positive for income, negative for expense
  running_balance DECIMAL(10,2) NOT NULL,
  description TEXT,
  recorded_by UUID REFERENCES auth.users(id) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cash records" ON public.cash_records
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create cash records" ON public.cash_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = recorded_by);

-- Activity Log table (audit trail)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create activity logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fowl_runs_updated_at
  BEFORE UPDATE ON public.fowl_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fridges_updated_at
  BEFORE UPDATE ON public.fridges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  -- Assign default seller role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'seller');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();