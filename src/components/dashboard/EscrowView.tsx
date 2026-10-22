"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Ship,
  Anchor,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Download,
  Building,
  KeyRound,
  Check,
  RotateCcw,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useWorkflow } from "@/lib/workflow-context";
import { formatUsd } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import Link from "next/link";

export function EscrowView() {
  const {
    activeScenario,
    escrowContract,
    isFixtureLocked,
    advanceMilestone,
    lockFixture,
    resetWorkflow,
  } = useWorkflow();
  const showToast = useToast();

  const escrow = escrowContract || activeScenario.escrow;

  const [otpInput, setOtpInput] = useState<string>("123456");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [showOtpModal, setShowOtpModal] = useState<boolean>(!isFixtureLocked && !escrow.twoFactorVerified);
  const [activeTab, setActiveTab] = useState<"milestones" | "ledger" | "contract">("milestones");

  async function handleVerify2FA() {
    if (!otpInput || otpInput.length < 6) {
      showToast("Please enter a valid 6-digit 2FA token (Demo: 123456)");
      return;
    }

    setIsVerifyingOtp(true);
    await lockFixture(otpInput);
    setIsVerifyingOtp(false);
    setShowOtpModal(false);
    showToast("2FA Fixture Cryptographically Locked in Escrow!");
  }

  function handleReleaseMilestone(milestoneId: number, title: string) {
    advanceMilestone(milestoneId);
    showToast(`Milestone [${title}] verified & funds released.`);
  }

  const completedMilestones = escrow.milestones.filter((m) => m.status === "Completed");
  const releasedAmount = completedMilestones.reduce((acc, m) => acc + m.payoutAmountUsd, 0);
  const releasedCount = completedMilestones.length;
  const isAllReleased = releasedCount === escrow.milestones.length;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-deep/30 px-2 py-0.5 text-xs font-bold tracking-wider text-teal-soft uppercase">
              Act V: Cryptographic 2FA Escrow &amp; Fixture Execution
            </span>
            <span className="text-xs text-ink-dim">•</span>
            <span className="font-mono text-xs text-cyan-glow">#{escrow.fixtureId}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-bright sm:text-3xl">
            Smart Escrow &amp; Automated Settlement
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Milestone-gated cryptographic funds release with working capital partner line for{" "}
            <strong className="text-ink-bright">{escrow.chartererName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isFixtureLocked && !escrow.twoFactorVerified ? (
            <button
              onClick={() => setShowOtpModal(true)}
              className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-xs font-bold text-void shadow-glow-cyan hover:opacity-90"
            >
              <KeyRound size={14} />
              <span>Authenticate 2FA Lock</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-teal-soft/40 bg-teal-deep/20 px-3.5 py-2 text-xs font-bold text-teal-soft">
              <ShieldCheck size={14} />
              <span>Fixture Locked via 2FA</span>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-void-border bg-void-surface px-4 py-2 text-xs font-semibold text-ink-muted hover:border-cyan-glow/40 hover:text-ink-bright"
          >
            <Download size={14} />
            <span>Escrow Certificate</span>
          </button>
        </div>
      </div>

      {/* Hero Fixture & Credit Line Status Banner */}
      <GlassPanel className="p-6" glow={isFixtureLocked || escrow.twoFactorVerified ? "teal" : "cyan"}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              Chartering Fixture
            </div>
            <div className="mt-1 text-lg font-bold text-ink-bright">{escrow.vesselName}</div>
            <div className="font-mono text-xs text-ink-muted">{escrow.shipOwner}</div>
            <div className="mt-2 text-xs text-ink-dim">
              Contract: <strong className="text-cyan-glow">{escrow.contractId}</strong>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              Escrow Value &amp; Credit Line
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-teal-soft">
              {formatUsd(escrow.totalValueUsd)}
            </div>
            <div className="text-xs text-ink-muted">
              Partner: {escrow.nbfcPartner} ({escrow.creditLineStatus})
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-void-border">
              <div
                className="h-full bg-teal-soft transition-all duration-500"
                style={{
                  width: `${(releasedAmount / escrow.totalValueUsd) * 100}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              Settlement Status
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="font-mono text-2xl font-bold text-ink-bright">
                {formatUsd(releasedAmount)}
              </div>
              <span className="text-xs text-ink-dim">/ {formatUsd(escrow.totalValueUsd)}</span>
            </div>
            <div className="text-xs text-teal-soft font-semibold">
              {releasedCount} of {escrow.milestones.length} Milestones Cleared
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
              Cryptographic Integrity
            </div>
            <div className="mt-1 font-mono text-xs text-cyan-glow break-all">
              {escrow.securityHash.slice(0, 24)}...
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
              <ShieldCheck size={13} className="text-teal-soft" />
              <span>SHA-256 Oracle Verified</span>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Tabs */}
      <div className="flex border-b border-void-border">
        <button
          onClick={() => setActiveTab("milestones")}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "milestones"
              ? "border-cyan-glow text-cyan-glow"
              : "border-transparent text-ink-muted hover:text-ink-bright"
          }`}
        >
          3-Milestone Automated Release ({releasedCount}/3)
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "ledger"
              ? "border-cyan-glow text-cyan-glow"
              : "border-transparent text-ink-muted hover:text-ink-bright"
          }`}
        >
          Cryptographic Ledger Audit Trail
        </button>
        <button
          onClick={() => setActiveTab("contract")}
          className={`border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "contract"
              ? "border-cyan-glow text-cyan-glow"
              : "border-transparent text-ink-muted hover:text-ink-bright"
          }`}
        >
          Digital Fixture Recap (BIMCO Gencon)
        </button>
      </div>

      {/* Milestone View */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          {escrow.milestones.map((m, idx) => {
            const isReleased = m.status === "Completed";
            const isActive = m.status === "Active";
            const isPending = m.status === "Pending";
            const canRelease = (isFixtureLocked || escrow.twoFactorVerified) && !isReleased;

            return (
              <GlassPanel
                key={m.id}
                className={`p-6 transition-all ${
                  isReleased
                    ? "border-teal-soft/40 bg-teal-deep/10"
                    : isActive
                    ? "border-cyan-glow ring-1 ring-cyan-glow/30"
                    : "opacity-75"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isReleased
                          ? "bg-teal-deep/40 text-teal-soft"
                          : isActive
                          ? "bg-cyan-glow/20 text-cyan-glow animate-pulse"
                          : "bg-void-surface text-ink-dim border border-void-border"
                      }`}
                    >
                      {isReleased ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink-dim">
                          MILESTONE {idx + 1} ({m.payoutPct}%)
                        </span>
                        <Badge tone={isReleased ? "teal" : isActive ? "cyan" : "muted"}>
                          {m.status}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold text-ink-bright">{m.title}</h3>
                      <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
                        {m.description}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-ink-dim">
                        <span>
                          <strong>Condition:</strong> {m.condition}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Oracle Verification:</strong> {m.verificationMethod}
                        </span>
                        {m.geofenceName && (
                          <>
                            <span>•</span>
                            <span>
                              <strong>Geofence:</strong> {m.geofenceName} ({m.geofenceRadiusNm}nm)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                    <div className="text-left lg:text-right">
                      <div className="font-mono text-2xl font-bold text-teal-soft">
                        {formatUsd(m.payoutAmountUsd)}
                      </div>
                      <div className="text-[11px] text-ink-dim">
                        {isReleased ? `Released at ${m.unlockedAt ? new Date(m.unlockedAt).toLocaleTimeString() : "Complete"}` : "Awaiting Verification"}
                      </div>
                    </div>

                    {isReleased ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-teal-deep/30 px-3 py-1.5 text-xs font-bold text-teal-soft">
                        <Check size={14} />
                        <span>Settled to Shipowner</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReleaseMilestone(m.id, m.title)}
                        disabled={!canRelease}
                        className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-xs font-bold text-void shadow-glow-cyan hover:opacity-90 disabled:opacity-40"
                      >
                        <ShieldCheck size={14} />
                        <span>Verify &amp; Release Funds</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </GlassPanel>
            );
          })}

          {isAllReleased && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-teal-soft/40 bg-teal-deep/20 p-6 text-center shadow-glow-teal"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-soft text-void mb-3">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-xl font-bold text-ink-bright">
                Voyage Cycle Fully Executed &amp; Settled!
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-xs text-ink-muted">
                100% of escrow funds (${escrow.totalValueUsd.toLocaleString()}) have been released to{" "}
                <strong>{escrow.shipOwner}</strong> with zero demurrage penalty. Backhaul ex-Paradip iron ore export leg activated.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  href="/dashboard/audit-log"
                  className="rounded-xl border border-void-border bg-void-surface px-4 py-2 text-xs font-bold text-ink-muted hover:text-ink-bright"
                >
                  View Cryptographic Audit Log
                </Link>
                <Link
                  href="/dashboard/request"
                  className="rounded-xl bg-cyan-glow px-4 py-2 text-xs font-bold text-void hover:opacity-90"
                >
                  Initiate New Procurement Request
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === "ledger" && (
        <GlassPanel className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-bright uppercase tracking-wider">
              Immutable Cryptographic Ledger
            </h3>
            <span className="font-mono text-xs text-teal-soft">Network: Hyperledger Besu TradeNet</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="rounded-xl border border-void-border bg-void p-4 space-y-1">
              <div className="text-ink-dim"># BLOCK 489,120 · FIXTURE_LOCK_EVENT</div>
              <div className="text-teal-soft font-bold">SHA-256: {escrow.securityHash}</div>
              <div className="text-ink-muted">Timestamp: {escrow.verifiedAt || "2026-03-01T08:14:00Z"}</div>
              <div className="text-ink-muted">Signers: {escrow.verifiedBy} &amp; {escrow.shipOwner} Operations</div>
            </div>

            {escrow.milestones.filter(m => m.status === "Completed").map((m, i) => (
              <div key={i} className="rounded-xl border border-teal-soft/30 bg-teal-deep/10 p-4 space-y-1">
                <div className="text-teal-soft font-bold"># BLOCK {489121 + i} · MILESTONE_RELEASE: M-{m.id}</div>
                <div className="text-ink-bright">Payout: {formatUsd(m.payoutAmountUsd)} ({m.payoutPct}%) → {escrow.shipOwner}</div>
                <div className="text-ink-muted">Oracle Verification: {m.verificationMethod}</div>
                <div className="text-ink-dim">Doc Hash: {m.sha256Hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Contract Tab */}
      {activeTab === "contract" && (
        <GlassPanel className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-bright uppercase tracking-wider">
              BIMCO Gencon Standard Charterparty Recap
            </h3>
            <span className="rounded bg-void-border px-2 py-0.5 font-mono text-[10px] text-ink-dim">
              Code: GENCON-94-AMENDED
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-void-border bg-void p-4 font-mono text-xs text-ink-muted space-y-3 leading-relaxed">
            <p><strong>1. PARTIES:</strong> {escrow.chartererName} (Charterer) &amp; {escrow.shipOwner} (Owner).</p>
            <p><strong>2. VESSEL:</strong> {escrow.vesselName} ({escrow.vesselClass}).</p>
            <p><strong>3. LOADING PORT:</strong> 1 Safe Berth {escrow.originPort}.</p>
            <p><strong>4. DISCHARGE PORT:</strong> 1 Safe Berth {escrow.dischargePort}.</p>
            <p><strong>5. CARGO:</strong> {escrow.quantityMt.toLocaleString()} MT 5% MOLOO {escrow.commodity} in bulk.</p>
            <p><strong>6. FREIGHT RATE:</strong> ${escrow.ratePerMtUsd.toFixed(2)} / MT ({escrow.contractType}).</p>
            <p><strong>7. NBFC SETTLEMENT:</strong> Funded via {escrow.nbfcPartner} ({escrow.creditLineStatus}).</p>
            <p><strong>8. SMART ESCROW CLAUSE:</strong> Freight settlement governed strictly by VoyageAI Pro 3-Milestone Cryptographic Oracle.</p>
          </div>
        </GlassPanel>
      )}

      {/* 2FA OTP Modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassPanel className="p-6" glow="cyan">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-glow/10 text-cyan-glow">
                    <KeyRound size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink-bright">2-Factor Fixture Authentication</h3>
                    <p className="text-xs text-ink-dim">Authorize cryptographic funds lock in escrow</p>
                  </div>
                </div>

                <div className="my-4 rounded-xl border border-void-border bg-void-surface/60 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-ink-dim">
                    <span>Fixture Ref:</span>
                    <span className="font-mono font-bold text-ink-bright">{escrow.fixtureId}</span>
                  </div>
                  <div className="flex justify-between text-ink-dim">
                    <span>Escrow Amount:</span>
                    <span className="font-mono font-bold text-teal-soft">{formatUsd(escrow.totalValueUsd)}</span>
                  </div>
                  <div className="flex justify-between text-ink-dim">
                    <span>Charterer:</span>
                    <span className="text-ink-bright">{escrow.chartererName}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-ink-muted">
                    Enter 6-Digit Authenticator / SMS Token:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-xl border border-void-border bg-void px-4 py-3 text-center font-mono text-2xl font-bold tracking-widest text-cyan-glow focus:border-cyan-glow focus:outline-none"
                  />
                  <p className="text-center text-[11px] text-ink-dim">
                    Demo Token Pre-Filled: <strong className="text-cyan-glow">123456</strong>
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="flex-1 rounded-xl border border-void-border bg-void-surface py-3 text-xs font-bold text-ink-muted hover:text-ink-bright"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify2FA}
                    disabled={isVerifyingOtp}
                    className="flex-1 rounded-xl bg-cyan-glow py-3 text-xs font-bold text-void shadow-glow-cyan hover:opacity-90 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? "Verifying Token..." : "Confirm & Lock Fixture"}
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
