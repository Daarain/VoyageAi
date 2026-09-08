import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "cyan" | "teal" | "rose";
}

const glowMap = {
  none: "",
  cyan: "shadow-glow-cyan",
  teal: "shadow-glow-teal",
  rose: "shadow-glow-rose",
};

export function GlassPanel({ className, glow = "none", children, ...props }: GlassPanelProps) {
  return (
    <div className={cn("glass-panel rounded-2xl", glowMap[glow], className)} {...props}>
      {children}
    </div>
  );
}
