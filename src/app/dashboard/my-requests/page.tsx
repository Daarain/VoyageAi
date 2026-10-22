"use client";
// src/app/dashboard/my-requests/page.tsx
// Shows the logged-in user's chartering request history from Supabase.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { supabase, type CharteringRequest, type Recommendation } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";

type RequestWithRec = CharteringRequest & {
  recommendations: Pick<Recommendation, "vessel_class" | "recommended_contract" | "confidence_pct" | "created_at">[];
};

const STATUS_TONE: Record<string, "cyan" | "amber" | "green" | "rose" | "default"> = {
  Draft:       "default",
  Processing:  "amber",
  Recommended: "cyan",
  Approved:    "green",
  Rejected:    "rose",
};

const STATUS_ICON = {
  Draft:       <FileText size={14} />,
  Processing:  <Loader2  size={14} className="animate-spin" />,
  Recommended: <Clock    size={14} />,
  Approved:    <CheckCircle2 size={14} />,
  Rejected:    <XCircle  size={14} />,
};

export default function MyRequestsPage() {
  const { user } = useSession();
  const [requests, setRequests] = useState<RequestWithRec[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chartering_requests")
      .select("*, recommendations(vessel_class,recommended_contract,confidence_pct,created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRequests((data as RequestWithRec[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="mx-auto max-w-[1000px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">My Requests</h1>
        <p className="mt-1 text-sm text-ink-muted">
          All your chartering requests and AI recommendations
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-ink-muted">
          <Loader2 size={22} className="animate-spin mr-3" /> Loading your requests…
        </div>
      ) : requests.length === 0 ? (
        <GlassPanel className="py-20 text-center">
          <FileText size={36} className="mx-auto mb-3 text-ink-dim" />
          <p className="text-sm text-ink-muted">No requests yet.</p>
          <p className="mt-1 text-xs text-ink-dim">
            Submit a chartering request from the dashboard to see it here.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const rec = req.recommendations?.[0];
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassPanel className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: request details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {req.cargo_type} — {req.cargo_quantity_mt.toLocaleString()} MT
                        </span>
                        <Badge tone={STATUS_TONE[req.status] ?? "default"}>
                          <span className="flex items-center gap-1">
                            {STATUS_ICON[req.status as keyof typeof STATUS_ICON]}
                            {req.status}
                          </span>
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                        <span>
                          {req.origin_port} → {req.selected_port ?? req.destination_ports.join(", ")}
                        </span>
                        <span>Laycan: {req.laycan_start}</span>
                        <span>{req.number_of_voyages} voyage{req.number_of_voyages > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Right: AI recommendation summary */}
                    {rec && (
                      <div className="shrink-0 rounded-lg border border-cyan-glow/20 bg-cyan-glow/5 px-4 py-2.5 text-right">
                        <div className="text-xs text-ink-dim">AI Recommendation</div>
                        <div className="mt-0.5 font-semibold text-cyan-glow">{rec.recommended_contract}</div>
                        <div className="text-xs text-ink-muted">
                          {rec.vessel_class} · {rec.confidence_pct?.toFixed(0)}% confidence
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 border-t border-glass-border/50 pt-2.5 text-[11px] text-ink-dim">
                    Submitted {new Date(req.created_at).toLocaleString()} ·{" "}
                    ID: <code className="font-mono">{req.id.slice(0, 8)}…</code>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
