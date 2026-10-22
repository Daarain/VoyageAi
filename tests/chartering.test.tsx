import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharteringHub } from "@/components/dashboard/CharteringHub";
import { SessionProvider } from "@/lib/session-context";
import { ToastProvider } from "@/lib/toast-context";
import type { CharteringRequest } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: React.PropsWithChildren<{ href: string }>) => <a {...props}>{children}</a>,
}));

const request: CharteringRequest = {
  id: "REQ-TEST",
  cargoType: "Coal",
  cargoQuantityMt: 50_000,
  originPortId: "newcastle",
  destinationPortId: "paradip",
  numberOfVoyages: 1,
  deliveryWindowStart: "2026-06-01",
  deliveryWindowEnd: "2026-06-30",
  contractDurationMonths: null,
  createdAt: "2026-05-01T00:00:00Z",
  status: "Recommended",
  requestedBy: "Test User",
};

function renderHub() {
  render(
    <SessionProvider>
      <ToastProvider>
        <CharteringHub requests={[request]} />
      </ToastProvider>
    </SessionProvider>
  );
}

describe("chartering actions", () => {
  it("shows approval actions only for Port Owner and updates approval state", async () => {
    localStorage.setItem("voyageai-demo-session", JSON.stringify({ name: "Port Owner", email: "owner@example.com", role: "Port Owner" }));
    renderHub();
    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("requires confirmation before rejecting a request", () => {
    localStorage.setItem("voyageai-demo-session", JSON.stringify({ name: "Port Owner", email: "owner@example.com", role: "Port Owner" }));
    renderHub();
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm reject/i }));
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});