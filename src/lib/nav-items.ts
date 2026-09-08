import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock,
  Compass,
  FileCheck2,
  Globe2,
  History,
  Lock,
  PlusCircle,
  Settings as SettingsIcon,
  Ship,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: { text: string; tone: "cyan" | "amber" };
}

export const dashboardNavItems: NavItem[] = [
  { href: "/dashboard/live-map", label: "Live Map", icon: Globe2, badge: { text: "AIS LIVE", tone: "cyan" } },
  { href: "/dashboard", label: "Command Center", icon: Compass },
  { href: "/dashboard/request", label: "New Request", icon: PlusCircle, badge: { text: "AI", tone: "cyan" } },
  { href: "/dashboard/recommendation", label: "Action Cockpit", icon: Sparkles, badge: { text: "Gemini", tone: "cyan" } },
  { href: "/dashboard/escrow", label: "2FA Escrow", icon: Lock, badge: { text: "3-Tier", tone: "cyan" } },
  { href: "/dashboard/chartering", label: "Chartering Hub", icon: ClipboardList, badge: { text: "3 Req", tone: "cyan" } },
  { href: "/dashboard/which-vessel", label: "Which Vessel?", icon: Ship },
  { href: "/dashboard/forecast", label: "Freight Forecast", icon: TrendingUp },
  { href: "/dashboard/vessels", label: "Vessel Intelligence", icon: Ship },
  { href: "/dashboard/ports", label: "Port Intelligence", icon: Anchor },
  { href: "/dashboard/risk", label: "Risk & Alerts", icon: AlertTriangle, badge: { text: "2 Alert", tone: "amber" } },
  { href: "/dashboard/contract-simulator", label: "Contract Simulator", icon: SlidersHorizontal },
  { href: "/dashboard/idle-time", label: "Idle-Time Optimizer", icon: Clock },
  { href: "/dashboard/reports", label: "Reports & Export", icon: ShieldCheck },
  { href: "/dashboard/audit-log", label: "Decision Audit Log", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export const sidebarCollapseIcon = ChevronLeft;

