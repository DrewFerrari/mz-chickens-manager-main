export type OwnerType = 'miss_munyanyi' | 'mai_zindove';
export type UserRole = 'admin' | 'seller';
export type ChickenSource = 'fowl_run' | 'fridge';
export type BatchStatus = 'active' | 'sold_out' | 'closed';
export type PaymentMethod = 'cash' | 'bank' | 'mobile_money' | 'credit';

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_owner: OwnerType | null;
  created_at: string;
}

export interface FowlRun {
  id: string;
  name: string;
  owner: OwnerType;
  description: string | null;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fridge {
  id: string;
  name: string;
  owner: OwnerType;
  capacity: number;
  temperature: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  batch_name: string;
  owner: OwnerType;
  fowl_run_id: string | null;
  date_introduced: string;
  starting_quantity: number;
  current_quantity: number;
  cost_per_chick: number;
  status: BatchStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  fowl_runs?: FowlRun;
}

export interface NaturalDeath {
  id: string;
  batch_id: string;
  fowl_run_id: string | null;
  owner: OwnerType;
  quantity: number;
  reason: string | null;
  recorded_by: string;
  recorded_at: string;
  batches?: Batch;
}

export interface SlaughterRecord {
  id: string;
  batch_id: string;
  fowl_run_id: string | null;
  fridge_id: string;
  owner: OwnerType;
  quantity: number;
  recorded_by: string;
  slaughtered_at: string;
  batches?: Batch;
  fridges?: Fridge;
}

export interface FridgeStock {
  id: string;
  fridge_id: string;
  batch_id: string | null;
  owner: OwnerType;
  quantity: number;
  slaughtered_at: string;
  updated_at: string;
  fridges?: Fridge;
}

export interface Sale {
  id: string;
  owner: OwnerType;
  source: ChickenSource;
  batch_id: string | null;
  fridge_stock_id: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: PaymentMethod;
  ecocash_owner: OwnerType | null;
  customer_name: string | null;
  customer_phone: string | null;
  recorded_by: string;
  sold_at: string;
  batches?: Batch;
}

export interface FeedPurchase {
  id: string;
  owner: OwnerType;
  feed_type: string;
  bags: number;
  cost_per_bag: number;
  total_cost: number;
  supplier: string | null;
  recorded_by: string;
  purchased_at: string;
}

export interface Expense {
  id: string;
  owner: OwnerType;
  category: string;
  description: string;
  amount: number;
  recorded_by: string;
  expense_date: string;
  created_at: string;
}

export interface CashRecord {
  id: string;
  owner: OwnerType;
  transaction_type: string;
  reference_id: string | null;
  amount: number;
  running_balance: number;
  description: string | null;
  recorded_by: string;
  recorded_at: string;
}

export interface DashboardStats {
  totalLiveChickens: number;
  totalFridgeStock: number;
  todaySales: number;
  todayExpenses: number;
  cashAtHand: number;
  totalDeaths: number;
  activeBatches: number;
}

export interface OwnerStats {
  owner: OwnerType;
  liveChickens: number;
  fridgeStock: number;
  todaySales: number;
  todayExpenses: number;
  cashAtHand: number;
  deaths: number;
}

export const CHICKEN_PRICES = {
  alive: 7,
  slaughtered: 6,
} as const;

export const OWNER_DISPLAY_NAMES: Record<OwnerType, string> = {
  miss_munyanyi: 'Miss Munyanyi',
  mai_zindove: 'Mai Zindove',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank: 'Bank Transfer',
  mobile_money: 'EcoCash',
  credit: 'Credit',
};
