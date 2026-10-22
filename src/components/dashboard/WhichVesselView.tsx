"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Anchor, ArrowRight, CheckCircle2, ChevronRight, Clock3, Ship, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/toast-context";
import type { FreightForecast, MarketInsights, VesselClassOption, VoyageRoute } from "@/lib/types";

const vesselImageMap: Record<string, string> = {
  Handysize: "/images/vessels/handysize.jpg",
  Supramax: "/images/vessels/supramax.jpg",
  Panamax: "/images/vessels/panamax.jpg",
  Capesize: "/images/vessels/capesize.jpg",
};

export function getVesselImage(vesselClass: string): string {
  return vesselImageMap[vesselClass] ?? "/images/vessels/panamax.jpg";
}

interface RequestSnapshot {
  cargoType: string;
  quantity: number;
  origin: string;
  destination: string;
}

const requestStorageKey = "voyageai-vessel-request";

export function WhichVesselView({ options, route, forecast, market }: { options: VesselClassOption[]; route: VoyageRoute; forecast: FreightForecast; market: MarketInsights }) {
  const [request, setRequest] = useState<RequestSnapshot | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [overrideNote, setOverrideNote] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  useEffect(() => {
    const saved = window.sessionStorage.getItem(requestStorageKey);
    if (!saved) return;
    try {
      setRequest(JSON.parse(saved) as RequestSnapshot);
    } catch {
      window.sessionStorage.removeItem(requestStorageKey);
    }
  }, []);

  const rankedOptions = useMemo(
    () => [...options].sort((left, right) => {
      const order = ["Handysize", "Supramax", "Panamax", "Capesize"];
      return order.indexOf(left.vesselClass) - order.indexOf(right.vesselClass);
    }),
    [options]
  );
  const recommended = useMemo(
    () => options.reduce((best, option) => option.cargoFitPct > best.cargoFitPct ? option : best, options[0]),
    [options]
  );
  const selected = options.find((option) => option.vesselClass === selectedClass) ?? recommended;
  const isOverride = Boolean(selected && recommended && selected.vesselClass !== recommended.vesselClass);

  function choose(option: VesselClassOption) {
    setSelectedClass(option.vesselClass);
    setOverrideNote("");
    setOverrideOpen(option.vesselClass !== recommended.vesselClass);
  }

  function confirmSelection() {
    if (isOverride && !overrideNote.trim()) return;
    showToast(isOverride ? "Manual vessel selection confirmed for this demo." : `${selected.vesselClass} selected.`);
    window.sessionStorage.setItem("voyageai-selected-vessel", JSON.stringify({ vesselClass: selected.vesselClass, overrideNote: overrideNote.trim() }));
    setOverrideOpen(false);
    router.push("/dashboard/recommendation");
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-glow"><Ship size={13} /> Which Vessel?</div>
          <h1 className="text-2xl font-bold tracking-tight">Vessel recommendation</h1>
          <p className="mt-1 text-sm text-ink-muted">Compare vessel classes for this cargo and route.</p>
        </div>
        <Link href="/dashboard/request" className="flex items-center gap-1.5 rounded-lg border border-glass-border px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-panel-raised">Edit request <ChevronRight size={14} /></Link>
      </div>

      {request && (
        <GlassPanel className="mb-5 p-3.5 sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Summary label="Cargo Quantity" value={`${request.quantity.toLocaleString()} MT`} />
            <Summary label="Origin Port" value={request.origin} />
            <Summary label="Destination Port" value={request.destination} />
            <Summary label="Cargo Type" value={request.cargoType} />
          </div>
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="vessel-options-heading">
          <div className="mb-3">
            <h2 id="vessel-options-heading" className="text-sm font-bold">Recommended vessel options</h2>
            <p className="mt-1 text-xs text-ink-dim">Ranked by cargo compatibility, port fit, and freight estimate.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {rankedOptions.map((option) => {
              const isSelected = option.vesselClass === selected.vesselClass;
              const isRecommended = option.vesselClass === recommended.vesselClass;
              return <VesselOptionCard key={option.vesselClass} option={option} selected={isSelected} recommended={isRecommended} onSelect={() => choose(option)} />;
            })}
          </div>
          <RouteSnapshot route={route} forecast={forecast} market={market} />
        </section>

        {selected && (
          <aside aria-labelledby="selected-vessel-heading">
            <GlassPanel className="p-5 xl:sticky xl:top-5" glow={isOverride ? "none" : "teal"}>
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">Selected vessel</div><h2 id="selected-vessel-heading" className="mt-1 text-2xl font-bold">{selected.vesselClass}</h2></div>
                <Badge tone={isOverride ? "amber" : "teal"}>{isOverride ? "Manual Selection" : "Best Match"}</Badge>
              </div>
              <Image
                src={getVesselImage(selected.vesselClass)}
                alt={`${selected.vesselClass} bulk carrier vessel at sea`}
                width={640}
                height={240}
                className="mt-5 h-36 w-full rounded-xl object-cover object-center shadow-lg"
              />
              <div className="mt-1 text-sm font-semibold text-teal-soft">{selected.suitabilityStatus}</div>
              <div className="mt-5 space-y-2.5">
                <DetailRow label="Deadweight (DWT)" value={selected.dwtRange} />
                <DetailRow label="Cargo Fit" value={`${selected.cargoFitPct}%`} />
                <DetailRow label="Draft" value={selected.draftRange} />
                <DetailRow label="Port Compatibility" value={selected.portCompatibility ? "Fully Compatible" : "Not Compatible"} positive={selected.portCompatibility} />
                <DetailRow label="Est. Freight Rate" value={`$${selected.estimatedFreightUsdPerMt.toFixed(2)}/MT`} />
                <DetailRow label="Idle Risk" value={selected.idleRisk} positive={selected.idleRisk === "Low"} />
                <DetailRow label="Availability" value={selected.availability} positive={selected.availability === "Available"} />
              </div>
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-panel-raised/60 p-3 text-xs leading-relaxed text-ink-muted"><Anchor size={15} className="mt-0.5 shrink-0 text-cyan-glow" />{selected.reasoning}</div>
              <div className="mt-5 border-t border-glass-border pt-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">Why this vessel?</div>
                <ul className="mt-3 space-y-2 text-xs text-ink-muted">{selected.reasons.map((reason) => <li key={reason} className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-soft" />{reason}</li>)}</ul>
              </div>
              {overrideOpen && <div className="mt-5 border-t border-glass-border pt-4"><label htmlFor="vessel-override" className="text-xs font-semibold text-ink-primary">Why select {selected.vesselClass.toUpperCase()} instead of {recommended.vesselClass.toUpperCase()}?</label><textarea id="vessel-override" value={overrideNote} onChange={(event) => setOverrideNote(event.target.value)} rows={3} className="input-field mt-2 resize-none" placeholder="Add a justification for this demo selection" /><button type="button" onClick={confirmSelection} disabled={!overrideNote.trim()} className="mt-2 w-full rounded-lg bg-cyan-glow px-3 py-2.5 text-xs font-bold text-void disabled:opacity-40">Confirm Selection</button></div>}
              {!overrideOpen && <button type="button" onClick={confirmSelection} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-glow px-4 py-2.5 text-xs font-bold text-void">Select This Vessel <ArrowRight size={14} /></button>}
              {overrideOpen && <Link href="/dashboard/recommendation" className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-glow hover:underline">Keep recommended vessel <ArrowRight size={14} /></Link>}
            </GlassPanel>
          </aside>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) { return <div><div className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</div><div className="mt-1 truncate font-semibold text-ink-primary">{value}</div></div>; }

function VesselOptionCard({ option, selected, recommended, onSelect }: { option: VesselClassOption; selected: boolean; recommended: boolean; onSelect: () => void }) {
  return (
    <GlassPanel
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
      aria-label={`Select ${option.vesselClass} vessel class`}
      className={`h-full cursor-pointer p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-glow ${
        selected ? "border-cyan-glow bg-cyan-glow/10 shadow-glow-cyan" : "hover:border-cyan-glow/40 hover:bg-panel-raised/50"
      }`}
      glow={selected ? "cyan" : "none"}
    >
      <div className="flex min-h-14 items-start justify-between gap-2">
        <div>
          <div className="text-base font-bold uppercase tracking-wide">{option.vesselClass}</div>
          <div className="mt-1 text-[11px] text-ink-dim">{option.capacityRange}</div>
        </div>
        {recommended && <Badge tone="teal">Best Match</Badge>}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg">
        <Image
          src={getVesselImage(option.vesselClass)}
          alt={`${option.vesselClass} bulk carrier vessel`}
          width={640}
          height={240}
          className="h-28 w-full object-cover object-center transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="mt-4 space-y-2.5">
        <DetailRow label="Cargo Fit" value={`${option.cargoFitPct}%`} />
        <DetailRow
          label="Port Compatibility"
          value={option.portCompatibility ? "Compatible" : "Not suitable"}
          positive={option.portCompatibility}
        />
        <DetailRow label="Est. Freight" value={`$${option.estimatedFreightUsdPerMt.toFixed(2)}/MT`} />
        <DetailRow label="Idle Risk" value={option.idleRisk} positive={option.idleRisk === "Low"} />
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
        {option.portCompatibility ? (
          <CheckCircle2 size={14} className="text-teal-soft" />
        ) : (
          <XCircle size={14} className="text-rose-signal" />
        )}
        {option.suitabilityStatus}
      </div>
    </GlassPanel>
  );
}

function DetailRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) { return <div className="flex min-w-0 items-center justify-between gap-3 text-xs"><span className="min-w-0 text-ink-dim">{label}</span><span className={`min-w-0 text-right font-mono font-medium break-words ${positive === undefined ? "text-ink-primary" : positive ? "text-teal-soft" : "text-rose-signal"}`}>{value}</span></div>; }

function RouteSnapshot({ route, forecast, market }: { route: VoyageRoute; forecast: FreightForecast; market: MarketInsights }) {
  const TrendIcon = market.freightTrendDirection === "down" ? TrendingDown : TrendingUp;
  return <GlassPanel className="mt-5 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Route &amp; Market Snapshot</h2><p className="mt-1 text-xs text-ink-dim">Context for this vessel-class decision</p></div><Anchor size={17} className="text-cyan-glow" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><SnapshotMetric label="Route Distance" value={`${route.distanceNm.toLocaleString()} NM`} /><SnapshotMetric label="Est. Voyage Time" value={`${route.estTimeDays} days`} icon={Clock3} /><SnapshotMetric label="Freight Forecast" value={`$${forecast.currentRateUsdPerMt.toFixed(1)}/MT`} /><SnapshotMetric label="Market Trend" value={`${market.freightTrendDirection === "down" ? "↓" : "↑"} ${market.freightTrendPct}%`} icon={TrendIcon} /></div></GlassPanel>;
}

function SnapshotMetric({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Clock3 }) { return <div className="rounded-lg bg-panel-raised/60 p-3"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-ink-dim">{Icon && <Icon size={12} className="text-cyan-glow" />}{label}</div><div className="mt-2 font-mono text-sm font-bold text-ink-primary">{value}</div></div>; }
