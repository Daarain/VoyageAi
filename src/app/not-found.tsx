import Link from "next/link";
import { ArrowLeft, Anchor } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <GlassPanel className="w-full max-w-md p-8 text-center" glow="cyan">
        <Anchor size={32} className="mx-auto text-cyan-glow" />
        <div className="mt-5 text-5xl font-bold text-cyan-glow">404</div>
        <h1 className="mt-3 text-xl font-bold">This route is off the chart</h1>
        <p className="mt-2 text-sm text-ink-muted">The page you requested could not be found.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-bold text-void">
          <ArrowLeft size={16} /> Return home
        </Link>
      </GlassPanel>
    </main>
  );
}
