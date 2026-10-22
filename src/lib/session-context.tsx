"use client";
// src/lib/session-context.tsx
// Replaces the old mock session with real Supabase Auth.
// Drop-in compatible: useSession() returns the same shape as before.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type Profile, type UserRole } from "./supabase";

// Keep the roles export so existing imports don't break
export const roles: UserRole[] = [
  "Chartering Manager",
  "Port Owner",
  "Organization Admin",
  "System Administrator",
];
export type { UserRole };

// Shape matches the old MockUser so every component works without changes
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  company: string | null;
}

interface SessionContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  // signup / login / logout stay the same names as before
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<string | null>;
  login:  (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, "full_name" | "company" | "role">>) => Promise<string | null>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function toAuthUser(supabaseUser: User, profile: Profile): AuthUser {
  return {
    id:        supabaseUser.id,
    name:      profile.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
    email:     supabaseUser.email ?? "",
    role:      profile.role,
    avatarUrl: profile.avatar_url,
    company:   profile.company,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile and build AuthUser
  const hydrate = useCallback(async (supabaseUser: User | null) => {
    if (!supabaseUser) { setUser(null); setLoading(false); return; }
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();
    if (error || !profile) { setUser(null); setLoading(false); return; }
    setUser(toAuthUser(supabaseUser, profile as Profile));
    setLoading(false);
  }, []);

  // On mount: restore session + subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      hydrate(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        hydrate(newSession?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, [hydrate]);

  // ── Auth actions ────────────────────────────────────────────────────
  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    return error?.message ?? null;
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (
    patch: Partial<Pick<Profile, "full_name" | "company" | "role">>
  ): Promise<string | null> => {
    if (!user) return "Not logged in";
    const { error } = await supabase
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return error.message;
    // refresh local state
    const { data } = await supabase.auth.getUser();
    if (data.user) await hydrate(data.user);
    return null;
  };

  return (
    <SessionContext.Provider value={{ user, session, loading, signup, login, logout, updateProfile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

// Convenience hook: redirect to /login if not authenticated
export function useRequireAuth() {
  const { user, loading } = useSession();
  return { user, loading, authenticated: !!user };
}
