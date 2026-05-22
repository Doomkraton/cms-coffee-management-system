// ─────────────────────────── Auth / User ─────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface UserWithBrewCount extends User {
  brew_count: number;
}

export interface UserUpdate {
  name?: string;
  email?: string;
}

export interface OwnPasswordChange {
  current_password: string;
  new_password: string;
}

export interface AdminPasswordChange {
  new_password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface InstanceStatus {
  has_users: boolean;
  registration_open: boolean;
}

// ─────────────────────────── Beans ───────────────────────────────────────────

export interface Bean {
  id: number;
  name: string;
  roaster: string | null;
  origin: string | null;
  roast_date: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  quantity_grams: number;
  quantity_purchased_grams: number | null;
  rating: number | null;
  notes: string | null;
  is_available: boolean;
  created_at: string;
}

export interface BeanCreate {
  name: string;
  roaster?: string;
  origin?: string;
  roast_date?: string;
  purchase_date?: string;
  purchase_cost?: number;
  quantity_grams?: number;
  quantity_purchased_grams?: number;
  rating?: number;
  notes?: string;
  is_available?: boolean;
}

export type BeanUpdate = Partial<BeanCreate>;

// ─────────────────────────── Grinders ────────────────────────────────────────

export interface GrinderSettingsProfile {
  id: number;
  grinder_id: number;
  name: string;
  setting: string;
  description: string | null;
  created_at: string;
}

export interface Grinder {
  id: number;
  name: string;
  model: string | null;
  manufacturer: string | null;
  notes: string | null;
  created_at: string;
  settings_profiles: GrinderSettingsProfile[];
}

export interface GrinderCreate {
  name: string;
  model?: string;
  manufacturer?: string;
  notes?: string;
}

export type GrinderUpdate = Partial<GrinderCreate>;

// ─────────────────────────── Brew Methods ────────────────────────────────────

export interface BrewMethod {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
}

export interface BrewMethodCreate {
  name: string;
  category?: string;
  description?: string;
}

export type BrewMethodUpdate = Partial<BrewMethodCreate>;

// ─────────────────────────── Brew Logs ───────────────────────────────────────

export interface BrewLog {
  id: number;
  user_id: number;
  bean_id: number;
  method_id: number;
  grinder_id: number | null;
  water_temperature: number | null;
  grind_size: string | null;
  grinder_setting: string | null;
  brew_time: number | null;
  water_amount: number | null;
  coffee_amount: number | null;
  rating: number | null;
  notes: string | null;
  brew_date: string;
  created_at: string;
  user: User;
  bean: Bean;
  method: BrewMethod;
  grinder: Grinder | null;
}

export interface BrewLogCreate {
  bean_id: number;
  method_id: number;
  grinder_id?: number;
  water_temperature?: number;
  grind_size?: string;
  grinder_setting?: string;
  brew_time?: number;
  water_amount?: number;
  coffee_amount?: number;
  rating?: number;
  notes?: string;
  brew_date?: string;
}

export type BrewLogUpdate = Partial<BrewLogCreate>;

// ─────────────────────────── Invite Codes ────────────────────────────────────

export interface InviteCode {
  id: number;
  code: string;
  created_at: string;
  expires_at: string;
  used_by: number | null;
  used_by_user: User | null;
}

// ─────────────────────────── Analytics ───────────────────────────────────────

export interface BrewStats {
  total_brews: number;
  avg_rating: number | null;
  total_coffee_grams: number;
  top_bean: string | null;
  top_method: string | null;
  total_spent: number | null;
  avg_cost_per_brew: number | null;
  costed_brews: number;
}

// ─────────────────────────── Instance Settings ───────────────────────────────

export interface InstanceSettings {
  show_costs: boolean;
  currency: string;
}

export interface InstanceSettingsUpdate {
  show_costs?: boolean;
  currency?: string;
}
