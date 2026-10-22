import {
  LayoutDashboard, TrendingUp, ShipWheel, Anchor,
  AlertTriangle, Clock, Map, FileText, Settings,
  BarChart3, Shield, ClipboardList, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href:   string;
  label:  string;
  icon:   LucideIcon;
  badge?: { text: string; tone: "cyan" | "amber" | "rose" | "green" | "default" };
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  { href: "/dashboard",                   label: "Command Centre",   icon: LayoutDashboard },
  { href: "/dashboard/forecast",          label: "Forecast",         icon: TrendingUp      },
  { href: "/dashboard/recommendation",    label: "Recommendation",   icon: ShipWheel       },
  { href: "/dashboard/chartering",        label: "Chartering Hub",   icon: Anchor          },
  { href: "/dashboard/risk",              label: "Risk Alerts",      icon: AlertTriangle   },
  { href: "/dashboard/idle-time",         label: "Idle Time",        icon: Clock           },
  { href: "/dashboard/live-map",          label: "Live Map",         icon: Map,
    badge: { text: "AIS", tone: "cyan" } },
  { href: "/dashboard/ports",             label: "Port Intel",       icon: BarChart3       },
  { href: "/dashboard/my-requests",       label: "My Requests",      icon: ClipboardList   },
  { href: "/dashboard/audit-log",         label: "Audit Log",        icon: FileText        },
  { href: "/dashboard/reports",           label: "Reports",          icon: FileText        },
  { href: "/dashboard/settings",          label: "Settings",         icon: Settings        },
  { href: "/dashboard/admin",             label: "Admin Panel",      icon: Shield,
    badge: { text: "Admin", tone: "amber" }, adminOnly: true },
];
