"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <GlassPanel className="w-full max-w-md p-8 text-center" glow="rose">
        <TriangleAlert size={28} className="mx-auto text-rose-signal" />
        <h1 className="mt-4 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted">The dashboard could not complete that request.</p>
        <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-bold text-void"><RefreshCw size={16} /> Try again</button>
      </GlassPanel>
    </main>
  );
}