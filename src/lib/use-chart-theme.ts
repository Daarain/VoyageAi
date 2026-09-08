"use client";

import { useTheme } from "next-themes";

// Recharts requires literal color strings (not CSS classes), so charts that
// live outside the always-dark globe instrument panel need their own
// theme-aware color set. Charts inside the globe hero stay hardcoded dark
// intentionally (see CommandCenter.tsx) and don't use this hook.
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return isDark
    ? {
        grid: "#112943",
        axisText: "#7B818C",
        tooltipBg: "#0C1B30",
        tooltipBorder: "#2E394D",
        tooltipLabel: "#98A0AA",
      }
    : {
        grid: "#E2E8F0",
        axisText: "#64748B",
        tooltipBg: "#FFFFFF",
        tooltipBorder: "#E2E8F0",
        tooltipLabel: "#475569",
      };
}
