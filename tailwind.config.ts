import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "rgb(var(--color-void) / <alpha-value>)",
          soft: "rgb(var(--color-void-soft) / <alpha-value>)",
        },
        panel: {
          DEFAULT: "rgb(var(--color-panel) / <alpha-value>)",
          raised: "rgb(var(--color-panel-raised) / <alpha-value>)",
          hover: "rgb(var(--color-panel-hover) / <alpha-value>)",
        },
        glass: {
          border: "rgb(var(--color-glass-border) / <alpha-value>)",
          borderLight: "rgb(var(--color-glass-border-light) / <alpha-value>)",
        },
        cyan: {
          glow: "rgb(var(--color-cyan-glow) / <alpha-value>)",
          deep: "rgb(var(--color-cyan-deep) / <alpha-value>)",
        },
        teal: {
          deep: "rgb(var(--color-teal-deep) / <alpha-value>)",
          soft: "rgb(var(--color-teal-soft) / <alpha-value>)",
        },
        amber: {
          signal: "rgb(var(--color-amber-signal) / <alpha-value>)",
        },
        rose: {
          signal: "rgb(var(--color-rose-signal) / <alpha-value>)",
        },
        ink: {
          primary: "rgb(var(--color-ink-primary) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          dim: "rgb(var(--color-ink-dim) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glass-light": "0 8px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glow-cyan": "0 0 24px rgba(34,211,238,0.25)",
        "glow-teal": "0 0 20px rgba(45,212,191,0.2)",
        "glow-rose": "0 0 20px rgba(244,63,94,0.25)",
      },
      animation: {
        "pulse-slow": "pulse-slow 2.4s ease-in-out infinite",
        "spin-slow": "spin 60s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.85)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
