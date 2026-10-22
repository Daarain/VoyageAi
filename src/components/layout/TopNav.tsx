"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, User, ChevronDown, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LiveDot } from "@/components/ui/LiveDot";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session-context";
import { supabase, type Notification } from "@/lib/supabase";

export function TopNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useSession();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs,      setNotifs]      = useState<Notification[]>([]);

  // Page title from pathname
  const pageTitle = pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ")
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Dashboard";

  // Load notifications from Supabase
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setNotifs(data as Notification[]); });
  }, [user?.id]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  async function markAllRead() {
    if (!user?.id) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-glass-border bg-void/90 px-4 backdrop-blur-xl sm:px-6 md:pl-4">
      {/* Page title */}
      <h2 className="text-sm font-semibold capitalize text-ink-primary md:text-base">
        {pageTitle}
      </h2>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-panel-raised"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-glow text-[9px] font-bold text-void">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-glass-border bg-panel p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-cyan-glow hover:underline">
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <p className="py-4 text-center text-xs text-ink-dim">No notifications yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {notifs.map((n) => (
                    <div key={n.id}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-xs",
                        n.read ? "text-ink-muted" : "border border-cyan-glow/20 bg-cyan-glow/5 text-ink-primary"
                      )}
                    >
                      <div className="font-medium">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-ink-dim">{n.body}</div>}
                      <div className="mt-1 text-[10px] text-ink-dim">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-panel-raised"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-glow/20 text-xs font-bold text-cyan-glow">
              {user?.name?.[0]?.toUpperCase() ?? <User size={13} />}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold leading-none">{user?.name ?? "Guest"}</div>
              <div className="mt-0.5 text-[10px] text-ink-dim">{user?.role ?? "Demo"}</div>
            </div>
            <ChevronDown size={13} className="text-ink-dim" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-glass-border bg-panel p-2 shadow-xl">
              <div className="mb-2 border-b border-glass-border pb-2 px-2">
                <div className="text-sm font-semibold">{user?.name ?? "Guest"}</div>
                <div className="text-xs text-ink-dim">{user?.email}</div>
                <div className="mt-1">
                  <span className="rounded-md bg-cyan-glow/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-glow">
                    {user?.role}
                  </span>
                </div>
              </div>
              <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted hover:bg-panel-raised hover:text-ink-primary">
                <User size={13} /> Account settings
              </Link>
              {(user?.role === "Organization Admin" || user?.role === "System Administrator") && (
                <Link href="/dashboard/admin" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted hover:bg-panel-raised hover:text-ink-primary">
                  <LiveDot color="amber" className="ml-0.5" /> Admin Panel
                </Link>
              )}
              <button onClick={handleLogout}
                className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm text-rose-signal hover:bg-rose-signal/10">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
