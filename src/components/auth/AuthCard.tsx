"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ShipWheel } from "lucide-react";
import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { roles, useSession, type UserRole } from "@/lib/session-context";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { login } = useSession();
  const [role, setRole] = useState<UserRole>("Chartering Manager");
  const [name, setName] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login(role, name.trim() || role);
    router.push("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-60" />
      <GlassPanel className="relative z-10 w-full max-w-md p-6 sm:p-8" glow="cyan">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
            <ShipWheel size={21} />
          </div>
          <div>
            <div className="font-bold tracking-tight">VOYAGE<span className="text-cyan-glow">AI</span> PRO</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">Maritime intelligence</div>
          </div>
        </div>
        <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create a demo profile"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {mode === "login" ? "Choose a role to enter the interactive frontend demo." : "Set up a local profile to explore the role-aware interface."}
        </p>
        <div className="mt-4 rounded-lg border border-amber-signal/30 bg-amber-signal/10 p-3 text-xs text-ink-muted">
          Frontend simulation only. No credentials are validated or stored securely.
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block text-xs font-semibold text-ink-muted">
              Display name
              <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-1.5" placeholder="Alex Morgan" />
            </label>
          )}
          <label className="block text-xs font-semibold text-ink-muted">
            Log in as
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="input-field mt-1.5">
              {roles.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow py-3 text-sm font-bold text-void hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-glow focus:ring-offset-2 focus:ring-offset-void">
            {mode === "login" ? "Enter dashboard" : "Create demo profile"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          {mode === "login" ? "Need a profile?" : "Already have a profile?"}{" "}
          <Link href={mode === "login" ? "/signup" : "/login"} className="font-semibold text-cyan-glow hover:underline">
            {mode === "login" ? "Sign up" : "Log in"}
          </Link>
        </p>
      </GlassPanel>
    </main>
  );
}
