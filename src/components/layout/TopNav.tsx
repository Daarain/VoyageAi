"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Settings, UserCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveDot } from "@/components/ui/LiveDot";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useSession } from "@/lib/session-context";
import { getCharteringRequests, getIdleTimeEntries, getRiskAlerts } from "@/lib/data-source";

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  href: string;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Command Center",
  "/dashboard/live-map": "Live Map",
  "/dashboard/chartering": "Chartering",
  "/dashboard/forecast": "Freight Forecast",
  "/dashboard/vessels": "Vessel Intelligence",
  "/dashboard/ports": "Port Intelligence",
  "/dashboard/risk": "Risk & Alerts",
  "/dashboard/contract-simulator": "Contract Simulator",
  "/dashboard/idle-time": "Idle-Time Optimizer",
  "/dashboard/reports": "Reports & Export",
  "/dashboard/audit-log": "Decision Audit Log",
  "/dashboard/settings": "Settings",
  "/dashboard/request": "New Chartering Request",
  "/dashboard/recommendation": "AI Recommendation",
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const title = (pathname && pageTitles[pathname]) ?? "VoyageAI Pro";

  useEffect(() => {
    Promise.all([getRiskAlerts(), getCharteringRequests(), getIdleTimeEntries()]).then(([alerts, requests, idleEntries]) => {
      const next = [
        ...alerts.filter((alert) => !alert.acknowledged).map((alert) => ({ id: `risk-${alert.id}`, title: alert.title, detail: alert.level, href: "/dashboard/risk" })),
        ...requests.filter((request) => request.status === "Recommended").map((request) => ({ id: `request-${request.id}`, title: "Chartering approval pending", detail: request.cargoType, href: "/dashboard/chartering" })),
        ...idleEntries.filter((entry) => entry.expectedIdleDays > 3).map((entry) => ({ id: `idle-${entry.vesselId}`, title: "Idle vessel warning", detail: entry.vesselName, href: "/dashboard/idle-time" })),
      ];
      setNotifications(next);
    });
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-glass-border bg-void/80 px-6 backdrop-blur-xl">
      <div className="hidden items-center gap-2 md:flex">
        <span className="text-sm font-semibold text-ink-primary">{title}</span>
      </div>

      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <span className="text-lg font-bold tracking-tight">
          VOYAGE<span className="text-cyan-glow">AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-teal-deep/30 bg-teal-deep/10 px-3 py-1.5 sm:flex">
          <LiveDot color="teal" />
          <span className="text-xs font-medium text-teal-soft">Live Market</span>
        </div>
        <div className="relative">
          <button onClick={() => setNotificationsOpen((open) => !open)} aria-label={`Open notifications${notifications.length ? ` (${notifications.length} unread)` : ""}`} aria-expanded={notificationsOpen} className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink-primary">
            <Bell size={18} />
            {notifications.length > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-rose-signal px-1 text-center text-[9px] font-bold text-white">{notifications.length}</span>}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-glass-border bg-panel p-3 shadow-xl" role="dialog" aria-label="Notifications">
              <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold">Notifications</h2><span className="text-[10px] text-ink-dim">{notifications.length} unread</span></div>
              {notifications.length === 0 ? <p className="px-2 py-4 text-sm text-ink-muted">You are all caught up.</p> : <div className="space-y-1">{notifications.map((notification) => <Link key={notification.id} href={notification.href} onClick={() => setNotificationsOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-panel-raised"><div className="text-xs font-semibold">{notification.title}</div><div className="mt-0.5 text-[11px] text-ink-muted">{notification.detail}</div></Link>)}</div>}
            </div>
          )}
        </div>
        <ThemeToggle />
        <Link href="/dashboard/settings" aria-label="Open settings" className="hidden rounded-lg p-2 text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink-primary sm:block">
          <Settings size={18} />
        </Link>
        <div className="relative">
          <button onClick={() => setProfileOpen((open) => !open)} aria-label="Open profile menu" aria-expanded={profileOpen} className="flex items-center gap-1 rounded-lg p-1 text-ink-muted transition-colors hover:bg-panel-raised hover:text-ink-primary">
          <UserCircle2 size={26} />
          <ChevronRight size={14} className="hidden sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-glass-border bg-panel p-3 shadow-xl" role="menu">
              <div className="border-b border-glass-border px-2 pb-3">
                <div className="text-sm font-semibold text-ink-primary">{user?.name ?? "Guest demo user"}</div>
                <div className="mt-1 text-xs text-ink-muted">{user?.role ?? "No role selected"}</div>
              </div>
              <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="mt-2 block rounded-lg px-2 py-2 text-sm text-ink-muted hover:bg-panel-raised hover:text-ink-primary" role="menuitem">Account settings</Link>
              <button onClick={handleLogout} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-rose-signal hover:bg-rose-signal/10" role="menuitem">Log out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
