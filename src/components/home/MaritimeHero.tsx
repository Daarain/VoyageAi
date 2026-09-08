"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Globe2, CircleDot } from "lucide-react";
import { HeroVideo } from "./HeroVideo";
import { FreightTicker } from "./FreightTicker";
import { heroStats } from "@/lib/home-data";

const rise = (delay: number, skip: boolean) => ({
  initial: skip ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay: skip ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function MaritimeHero() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  function exploreIntelligence(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setExiting(true);
    window.dispatchEvent(new Event("voyageai:hero-exit"));
    window.setTimeout(() => router.push("/dashboard/request"), reduceMotion ? 0 : 1050);
  }

  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-void">
      {/* Video background */}
      <HeroVideo />

      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        <span className="port-light port-light-one" />
        <span className="port-light port-light-two" />
        <span className="port-light port-light-three" />
      </div>

      {/* Readability gradient — left darker for text, right stays rich per spec */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

      {/* Content */}
      <motion.div
        animate={exiting ? { opacity: 0, scale: 1.025, y: -8 } : { opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="landing-entrance relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-center px-4 pb-32 pt-20 sm:px-6 lg:px-10 lg:pb-24"
      >
        <motion.div {...rise(0, !!reduceMotion)} className="max-w-xl">
          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="landing-entrance mb-4 flex items-center gap-2"
          >
            <CircleDot size={12} className="text-cyan-glow" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-glow">
              AI-Powered Freight Intelligence
            </span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="landing-entrance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]"
          >
            Forecast Freight.
            <br />
            <span className="text-cyan-glow">Charter Smarter.</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="landing-entrance mt-5 max-w-md text-sm leading-relaxed text-white/80 sm:text-base"
          >
            AI-driven insights to predict freight rates, optimize vessel chartering, and reduce
            logistics costs for bulk cargo shipments to India&apos;s East Coast.
          </motion.p>

          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="landing-entrance mt-7 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/dashboard/request"
              onClick={exploreIntelligence}
              className="group flex items-center gap-2 rounded-xl bg-cyan-glow px-6 py-3 text-sm font-bold text-void shadow-glow-cyan transition-transform hover:scale-[1.02]"
            >
              Explore Intelligence
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
            >
              <Globe2 size={16} className="text-cyan-glow" />
              3D Global Live Map
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats strip */}
        <motion.div {...rise(0.75, !!reduceMotion)} className="landing-entrance mt-8 max-w-md sm:mt-10">
          <div className="grid grid-cols-4 divide-x divide-white/10 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl">
            {heroStats.map((stat) => (
              <div key={stat.label} className="px-2.5 py-3.5 text-center sm:px-4">
                <div className="font-mono text-lg font-bold text-white sm:text-xl">
                  {stat.value}
                </div>
                <div className="mt-1 whitespace-pre-line text-[9px] leading-tight text-white/60 sm:text-[10px]">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>

      <FreightTicker delay={0.9} />
      <motion.div
        aria-hidden="true"
        animate={exiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
        className="pointer-events-none fixed inset-0 z-[60] bg-black/25"
      />
    </section>
  );
}
