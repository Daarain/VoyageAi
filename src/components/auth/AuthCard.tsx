"use client";
// src/components/auth/AuthCard.tsx
// Real Supabase Auth — replaces the mock role-picker.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShipWheel } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { roles, useSession, type UserRole } from "@/lib/session-context";

export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { login, signup } = useSession();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [fullName, setFullName]   = useState("");
  const [role, setRole]           = useState<UserRole>("Chartering Manager");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let err: string | null = null;
    if (mode === "signup") {
      err = await signup(email.trim(), password, fullName.trim() || email.split("@")[0], role);
      if (!err) {
        // Supabase sends a confirmation email; inform user
        setLoading(false);
        router.push("/login?confirm=1");
        return;
      }
    } else {
      err = await login(email.trim(), password);
      if (!err) {
        router.push("/dashboard");
        return;
      }
    }

    setError(err);
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade opacity-60" />
      <GlassPanel className="relative z-10 w-full max-w-md p-6 sm:p-8" glow="cyan">

        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
            <ShipWheel size={21} />
          </div>
          <div>
            <div className="font-bold tracking-tight">
              VOYAGE<span className="text-cyan-glow">AI</span> PRO
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">
              Maritime intelligence
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {mode === "login"
            ? "Sign in to access your maritime intelligence dashboard."
            : "Register to start submitting chartering requests."}
        </p>

        {/* Confirm email notice (redirected from signup) */}
        {typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("confirm") && (
          <div className="mt-4 rounded-lg border border-teal-deep/30 bg-teal-deep/10 p-3 text-xs text-teal-soft">
            Account created! Check your email to confirm before logging in.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-rose-signal/30 bg-rose-signal/10 p-3 text-xs text-rose-signal">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {/* Full name — signup only */}
          {mode === "signup" && (
            <label className="block text-xs font-semibold text-ink-muted">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field mt-1.5"
                placeholder="Alex Morgan"
              />
            </label>
          )}

          {/* Email */}
          <label className="block text-xs font-semibold text-ink-muted">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1.5"
              placeholder="you@company.com"
            />
          </label>

          {/* Password */}
          <label className="block text-xs font-semibold text-ink-muted">
            Password
            <div className="relative mt-1.5">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pr-10"
                placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink-primary"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {/* Role picker — signup only */}
          {mode === "signup" && (
            <label className="block text-xs font-semibold text-ink-muted">
              Your role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="input-field mt-1.5"
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          )}

          {/* Forgot password */}
          {mode === "login" && (
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-cyan-glow">
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow py-3 text-sm font-bold text-void hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-glow focus:ring-offset-2 focus:ring-offset-void disabled:opacity-50"
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={mode === "login" ? "/signup" : "/login"}
            className="font-semibold text-cyan-glow hover:underline"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </Link>
        </p>
      </GlassPanel>
    </main>
  );
}
