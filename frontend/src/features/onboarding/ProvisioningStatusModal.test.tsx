import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProvisioningStatusModal } from "./ProvisioningStatusModal";
import * as onboardingApi from "../../api/onboarding";

describe("ProvisioningStatusModal Component", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ProvisioningStatusModal isOpen={false} onClose={mockOnClose} cinemaSlug="westgate" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders orchestration steps while provisioning is in progress", () => {
    render(
      <ProvisioningStatusModal
        isOpen={true}
        onClose={mockOnClose}
        cinemaSlug="westgate"
        initialStatus={{
          cinema_slug: "westgate",
          status: "PROVISIONING",
          progress_percent: 40,
          current_step: "MIGRATING_SCHEMA",
          created_at: new Date().toISOString(),
        }}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Provisioning Theater Infrastructure.../i)).toBeInTheDocument();
    expect(screen.getAllByText(/westgate\.africinemas\.com/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Tenant Record & Subdomain Scoping/i)).toBeInTheDocument();
    expect(screen.getByText(/PostgreSQL Schema Creation & DDL/i)).toBeInTheDocument();
  });

  it("polls and transitions to READY state with launch button", async () => {
    vi.spyOn(onboardingApi, "getProvisioningStatus").mockResolvedValue({
      cinema_slug: "westgate",
      status: "READY",
      progress_percent: 100,
      current_step: "COMPLETE",
      domain_url: "http://westgate.localhost:8000",
      created_at: new Date().toISOString(),
    });

    render(
      <ProvisioningStatusModal
        isOpen={true}
        onClose={mockOnClose}
        cinemaSlug="westgate"
        initialStatus={{
          cinema_slug: "westgate",
          status: "PROVISIONING",
          progress_percent: 50,
          current_step: "MIGRATING_SCHEMA",
          created_at: new Date().toISOString(),
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Cinema Tenant Provisioned!/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Launch Cinema Dashboard/i })).toBeInTheDocument();
    });
  });
});
