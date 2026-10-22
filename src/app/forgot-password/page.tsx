"use client";
import { useState } from "react";
import Link from "next/link";
import { ShipWheel } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <GlassPanel className="w-full max-w-md p-6 sm:p-8" glow="cyan">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-glow/15 text-cyan-glow">
            <ShipWheel size={21} />
          </div>
          <span className="font-bold">VOYAGE<span className="text-cyan-glow">AI</span> PRO</span>
        </div>
        <h1 className="text-xl font-bold">Reset your password</h1>
        {sent ? (
          <p className="mt-4 text-sm text-ink-muted">
            Check your email — we sent a reset link to <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-semibold text-ink-muted">
              Email address
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1.5" placeholder="you@company.com" />
            </label>
            {error && <p className="text-xs text-rose-signal">{error}</p>}
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-glow py-3 text-sm font-bold text-void hover:opacity-90 disabled:opacity-50">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/login" className="text-cyan-glow hover:underline">Back to login</Link>
        </p>
      </GlassPanel>
    </main>
  );
}
