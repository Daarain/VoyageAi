import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Badge, riskTone } from "@/components/ui/Badge";
import { CountUp } from "@/components/ui/CountUp";
import { GlassPanel } from "@/components/ui/GlassPanel";

describe("shared UI", () => {
  it("renders GlassPanel content and glow class", () => {
    const { container } = render(<GlassPanel glow="cyan">Panel content</GlassPanel>);
    expect(screen.getByText("Panel content")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("shadow-glow-cyan");
  });

  it("maps risk levels to badge tones", () => {
    expect(riskTone("Low")).toBe("teal");
    expect(riskTone("Medium")).toBe("amber");
    expect(riskTone("Critical")).toBe("rose");
    render(<Badge tone={riskTone("High")}>High</Badge>);
    expect(screen.getByText("High")).toHaveClass("text-rose-signal");
  });

  it("animates CountUp to the requested value", () => {
    vi.useFakeTimers();
    let frame = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frame += 1;
      return window.setTimeout(() => callback(frame === 1 ? 0 : 1000), 0);
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
    render(<CountUp value={42} duration={1000} />);
    act(() => vi.runAllTimers());
    expect(screen.getByText("42")).toBeInTheDocument();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
