"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function RootError({
  error,
  reset,
}: {
  error: (Error & { digest?: string }) | unknown;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Root Error:", error);
  }, [error]);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "A client application event or navigation error occurred.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-void px-4 text-ink-primary">
      <GlassPanel className="w-full max-w-md p-8 text-center" glow="rose">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-signal/15 text-rose-signal">
          <TriangleAlert size={26} />
        </div>
        <h1 className="mt-4 text-xl font-bold">Unexpected Operation State</h1>
        <p className="mt-2 text-xs text-ink-muted leading-relaxed">
          {errorMessage}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-xs font-bold text-void hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={14} /> Reload Interface
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-glass-border px-4 py-2.5 text-xs font-semibold text-ink-primary hover:bg-panel-raised transition-colors"
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>
      </GlassPanel>
    </main>
  );
}
