"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LiveDot } from "@/components/ui/LiveDot";
import { navItems } from "@/lib/nav-items";
import { ChevronLeft } from "lucide-react";
import { useSession } from "@/lib/session-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  const isAdmin =
    user?.role === "Organization Admin" || user?.role === "System Administrator";

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-glass-border bg-void-soft/95 backdrop-blur-xl md:flex">
      <div className="flex items-center justify-between border-b border-glass-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-glow/15 text-sm font-bold text-cyan-glow">
            V
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-teal-soft" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none tracking-tight">
              VOYAGE<span className="text-cyan-glow">AI</span> PRO
            </div>
            <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-dim">
              Maritime Intelligence
            </div>
          </div>
        </div>
        <button className="text-ink-dim hover:text-ink-primary" aria-label="Collapse sidebar">
          <ChevronLeft size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow"
                  : "border border-transparent text-ink-muted hover:bg-panel-raised hover:text-ink-primary"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    item.badge.tone === "cyan"  && "bg-teal-deep/25 text-teal-soft",
                    item.badge.tone === "amber" && "bg-amber-signal/20 text-amber-signal",
                    item.badge.tone === "rose"  && "bg-rose-signal/20 text-rose-signal"
                  )}
                >
                  {item.badge.text}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info strip at bottom */}
      <div className="border-t border-glass-border px-4 py-3 space-y-1">
        {user && (
          <div className="text-[11px] text-ink-muted truncate font-medium">
            {user.name}
            <span className="ml-1.5 text-ink-dim">· {user.role}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[11px] text-ink-dim">
          <LiveDot color="teal" /> System operational
        </div>
      </div>
    </aside>
  );
}
