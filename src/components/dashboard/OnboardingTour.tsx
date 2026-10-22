"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";

const steps = [
  ["Command Center", "Your fleet, savings, and portfolio risk start here."],
  ["Chartering", "Review recommendations and manage approval decisions."],
  ["Live Map", "Track active routes and vessel positions in one view."],
  ["Risk & Alerts", "Monitor operational signals that need attention."],
] as const;
const storageKey = "voyageai-onboarding-complete";

export function OnboardingTour() {
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const open = () => setStep(0);
    if (pathname === "/dashboard" && !window.localStorage.getItem(storageKey)) open();
    window.addEventListener("voyageai:replay-tour", open);
    return () => window.removeEventListener("voyageai:replay-tour", open);
  }, [pathname]);

  function close() {
    window.localStorage.setItem(storageKey, "true");
    setStep(null);
  }

  if (step === null || pathname !== "/dashboard") return null;
  const [title, description] = steps[step];
  const finalStep = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/45 px-4 pb-24 md:items-center md:pb-0" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <GlassPanel className="w-full max-w-md p-6" glow="cyan">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-cyan-glow">Getting started · {step + 1}/{steps.length}</div>
        <h2 id="tour-title" className="mt-3 text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-ink-muted">{description}</p>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={close} className="text-xs font-semibold text-ink-muted hover:text-ink-primary">Skip tour</button>
          <button onClick={() => finalStep ? close() : setStep(step + 1)} className="rounded-xl bg-cyan-glow px-4 py-2.5 text-xs font-bold text-void">{finalStep ? "Finish" : "Next"}</button>
        </div>
      </GlassPanel>
    </div>
  );
}
