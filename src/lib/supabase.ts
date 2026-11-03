import { createClient } from "@supabase/supabase-js";

export type UserRole =
  | "Chartering Manager"
  | "Port Owner"
  | "Organization Admin"
  | "System Administrator";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  company: string | null;
  updated_at: string;
  email?: string | null;
  is_active: boolean;
  last_sign_in_at?: string | null;
  created_at: string;
  request_count?: number;
}

export interface DatabaseCharteringRequest {
  id: string;
  user_id: string;
  cargo_type: string;
  cargo_quantity_mt: number;
  origin_port: string;
  destination_ports: string[];
  selected_port: string | null;
  number_of_voyages: number;
  laycan_start: string;
  laycan_end: string | null;
  contract_duration_months: number | null;
  status: "Draft" | "Processing" | "Recommended" | "Approved" | "Rejected";
  override_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseRecommendation {
  id: string;
  request_id: string;
  user_id: string;
  model_version: string;
  vessel_class: string | null;
  recommended_contract: string | null;
  expected_cost_p50: number | null;
  stress_cost_p90: number | null;
  estimated_savings_usd: number | null;
  risk_level: string | null;
  confidence_pct: number | null;
  raw_output: Record<string, unknown> | null;
  created_at: string;
}

export interface DatabaseAuditLogEntry {
  id: string;
  request_id: string | null;
  user_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  model_version: string | null;
  confidence_pct: number | null;
  input_snapshot: Record<string, unknown> | null;
  output_summary: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
}

export type AuditEntry = DatabaseAuditLogEntry;
export type CharteringRequest = DatabaseCharteringRequest;
export type Recommendation = DatabaseRecommendation;


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const SUPABASE_ENABLED = Boolean(supabaseUrl && supabaseAnonKey);

const clientUrl = supabaseUrl || "http://localhost:54321";
const clientKey = supabaseAnonKey || "disabled-anon-key";
export const supabase = createClient(clientUrl, clientKey);
