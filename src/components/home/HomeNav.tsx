"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Menu, X, ShipWheel } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard/forecast", label: "Freight Forecast" },
  { href: "/dashboard/vessels", label: "Vessel Intelligence" },
  { href: "/dashboard/ports", label: "Port Intelligence" },
  { href: "/dashboard/risk", label: "Risk Analytics" },
  { href: "/about", label: "About Us" },
];

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onHeroExit = () => setExiting(true);
    window.addEventListener("voyageai:hero-exit", onHeroExit);
    return () => window.removeEventListener("voyageai:hero-exit", onHeroExit);
  }, []);

  return (
    <motion.header
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: exiting ? 0 : 1, y: exiting ? -4 : 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "landing-entrance fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-void/70 py-2.5 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent py-4"
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-glow/15 text-cyan-glow">
            <ShipWheel size={17} />
          </div>
          <div>
            <div className="text-base font-bold leading-none tracking-tight text-white">
              VOYAGE<span className="text-cyan-glow">AI</span> PRO
            </div>
            <div className="hidden text-[9px] font-medium uppercase tracking-[0.18em] text-white/50 sm:block">
              Maritime Intelligence Platform
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle className="text-white/70 hover:bg-white/10 hover:text-white" />
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/80 hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg bg-cyan-glow px-4 py-2 text-sm font-bold text-void shadow-glow-cyan transition-transform hover:scale-[1.03]"
          >
            Launch Dashboard →
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg p-2 text-white lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-void/95 px-4 py-4 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3">
              <Link
                href="/login"
                className="flex-1 rounded-lg border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-white"
              >
                Login
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 rounded-lg bg-cyan-glow px-4 py-2.5 text-center text-sm font-bold text-void"
              >
                Launch Dashboard →
              </Link>
            </div>
          </nav>
        </div>
      )}
    </motion.header>
  );
}
