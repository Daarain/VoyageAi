import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharteringHub } from "@/components/dashboard/CharteringHub";
import { useSession, type AuthUser } from "@/lib/session-context";
import { ToastProvider } from "@/lib/toast-context";
import type { CharteringRequest } from "@/lib/types";

vi.mock("@/lib/session-context", () => ({
  useSession: vi.fn(),
}));

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

const mockUseSession = vi.mocked(useSession);

function renderHub(user: AuthUser | null) {
  mockUseSession.mockReturnValue({
    user,
    session: null,
    loading: false,
    signup: async () => null,
    login: async () => null,
    logout: async () => {},
    updateProfile: async () => null,
  });

  render(
    <ToastProvider>
      <CharteringHub requests={[request]} />
    </ToastProvider>
  );
}

describe("chartering actions", () => {
  it("shows approval actions only for Port Owner and updates approval state", async () => {
    renderHub({
      id: "test-owner",
      name: "Port Owner",
      email: "owner@example.com",
      role: "Port Owner",
      avatarUrl: null,
      company: null,
    });
    const approveButton = await screen.findByRole("button", { name: /approve/i });
    fireEvent.click(approveButton);
    await waitFor(() => expect(screen.getByText("Approved")).toBeInTheDocument());
  });

  it("requires confirmation before rejecting a request", async () => {
    renderHub({
      id: "test-owner",
      name: "Port Owner",
      email: "owner@example.com",
      role: "Port Owner",
      avatarUrl: null,
      company: null,
    });
    fireEvent.click(await screen.findByRole("button", { name: /reject/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm reject/i }));
    await waitFor(() => expect(screen.getByText("Rejected")).toBeInTheDocument());
  });
});