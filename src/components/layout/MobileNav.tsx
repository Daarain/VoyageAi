"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";

const primaryItems = navItems.filter((item) =>
  ["/dashboard", "/dashboard/live-map", "/dashboard/chartering", "/dashboard/risk", "/dashboard/reports"].includes(item.href)
);

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener("change", updateMotion);
    return () => mediaQuery.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close more navigation"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            id="mobile-more-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="All dashboard pages"
            className={cn(
              "absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-glass-border bg-panel p-4 pb-24 shadow-2xl",
              !reducedMotion && "animate-in slide-in-from-bottom duration-200"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">All dashboard pages</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-2 text-ink-muted hover:bg-panel-raised hover:text-ink-primary focus:outline-none focus:ring-2 focus:ring-cyan-glow"
                aria-label="Close more navigation"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2" aria-label="All dashboard pages">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-glow",
                      active
                        ? "border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow"
                        : "border-glass-border text-ink-muted hover:bg-panel-raised hover:text-ink-primary"
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-glass-border bg-void/95 py-2 backdrop-blur-xl md:hidden" aria-label="Primary dashboard navigation">
        {primaryItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-12 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-glow",
                active ? "text-cyan-glow" : "text-ink-dim"
              )}
            >
              <Icon size={19} strokeWidth={2} />
              {item.href === "/dashboard" ? "Center" : item.href === "/dashboard/live-map" ? "Map" : item.href === "/dashboard/chartering" ? "Charter" : item.href === "/dashboard/risk" ? "Risk" : "Reports"}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={cn(
            "flex min-w-12 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-cyan-glow",
            moreOpen ? "text-cyan-glow" : "text-ink-dim"
          )}
          aria-label={moreOpen ? "Close more navigation" : "Open more navigation"}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-navigation"
        >
          {moreOpen ? <X size={19} /> : <Menu size={19} />}
          More
        </button>
      </nav>
    </>
  );
}
