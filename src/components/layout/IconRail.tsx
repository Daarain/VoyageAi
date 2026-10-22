"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Globe2,
  Ship,
  TrendingUp,
  FileText,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const railItems = [
  { href: "/dashboard", icon: Globe2, label: "Live Map" },
  { href: "/dashboard/vessels", icon: Ship, label: "Vessel Intelligence" },
  { href: "/dashboard/forecast", icon: TrendingUp, label: "Freight Forecast" },
  { href: "/dashboard/reports", icon: FileText, label: "Reports" },
  { href: "/dashboard/risk", icon: AlertTriangle, label: "Risk Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function IconRail() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col items-center gap-2 border-r border-glass-border bg-void-soft/80 py-5 backdrop-blur-xl md:flex">
      <Link
        href="/dashboard"
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-panel-raised"
      >
        <LayoutGrid size={17} className="text-cyan-glow" />
      </Link>
      {railItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              active ? "bg-cyan-glow/10 text-cyan-glow" : "text-ink-dim hover:bg-panel-raised hover:text-ink-muted"
            )}
          >
            <Icon size={17} strokeWidth={2} />
            {active && (
              <span className="absolute left-0 h-5 w-0.5 rounded-r bg-cyan-glow" />
            )}
          </Link>
        );
      })}
    </aside>
  );
}
