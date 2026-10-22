import { createClient } from "@supabase/supabase-js";
import type { CharteringRequest, Recommendation, AuditLogEntry } from "./types";

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
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export type AuditEntry = AuditLogEntry;

export type { CharteringRequest, Recommendation } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const SUPABASE_ENABLED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
