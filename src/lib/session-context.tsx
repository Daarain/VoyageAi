"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const roles = [
  "Chartering Manager",
  "Port Owner",
  "Organization Admin",
  "System Administrator",
] as const;

export type UserRole = (typeof roles)[number];

export interface MockUser {
  name: string;
  email: string;
  role: UserRole;
}

interface SessionContextValue {
  user: MockUser | null;
  login: (role: UserRole, name?: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const storageKey = "voyageai-demo-session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as MockUser;
      if (roles.includes(parsed.role)) setUser(parsed);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  function login(role: UserRole, name: string = role) {
    const nextUser = { name, email: `${role.toLowerCase().replaceAll(" ", ".")}@voyageai.demo`, role };
    setUser(nextUser);
    window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(storageKey);
  }

  return <SessionContext.Provider value={{ user, login, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
