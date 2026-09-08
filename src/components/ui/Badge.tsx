import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type BadgeTone = "cyan" | "teal" | "amber" | "rose" | "muted";

const toneStyles: Record<BadgeTone, string> = {
  cyan: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
  teal: "bg-teal-deep/15 text-teal-soft border-teal-deep/40",
  amber: "bg-amber-signal/10 text-amber-signal border-amber-signal/30",
  rose: "bg-rose-signal/10 text-rose-signal border-rose-signal/30",
  muted: "bg-panel-raised text-ink-muted border-glass-border",
};

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function riskTone(level: string): BadgeTone {
  switch (level) {
    case "Low":
      return "teal";
    case "Medium":
      return "amber";
    case "High":
    case "Critical":
      return "rose";
    default:
      return "muted";
  }
}
