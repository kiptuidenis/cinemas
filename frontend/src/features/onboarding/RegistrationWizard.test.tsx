import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationWizard } from "./RegistrationWizard";
import * as onboardingApi from "../../api/onboarding";

describe("RegistrationWizard Component", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <RegistrationWizard isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Step 1 form fields when open", () => {
    render(<RegistrationWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Cinema Business Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Custom Subdomain URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kenyan City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mall \/ Physical Location/i)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<RegistrationWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const closeBtn = screen.getByRole("button", { name: /Close modal/i });
    await user.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("checks subdomain availability on user input", async () => {
    vi.spyOn(onboardingApi, "checkSubdomainAvailability").mockResolvedValue({
      subdomain: "westgate",
      is_available: true,
      status: "AVAILABLE",
    });

    const user = userEvent.setup();
    render(<RegistrationWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const slugInput = screen.getByLabelText(/Custom Subdomain URL/i);
    await user.clear(slugInput);
    await user.type(slugInput, "westgate");

    await waitFor(() => {
      expect(
        screen.getByText(/Subdomain westgate.africinemas.com is available!/i)
      ).toBeInTheDocument();
    });
  });

  it("progresses from Step 1 to Step 2 when input is valid and subdomain is available", async () => {
    vi.spyOn(onboardingApi, "checkSubdomainAvailability").mockResolvedValue({
      subdomain: "sarit",
      is_available: true,
      status: "AVAILABLE",
    });

    const user = userEvent.setup();
    render(<RegistrationWizard isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/Cinema Business Name/i);
    await user.type(nameInput, "Sarit Cinema");

    const slugInput = screen.getByLabelText(/Custom Subdomain URL/i);
    await user.clear(slugInput);
    await user.type(slugInput, "sarit");

    const addressInput = screen.getByLabelText(/Mall \/ Physical Location/i);
    await user.type(addressInput, "Sarit Centre, Karuna Road");

    await waitFor(() => {
      expect(
        screen.getByText(/Subdomain sarit.africinemas.com is available!/i)
      ).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    await user.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText(/Select Brand Color Preset/i)).toBeInTheDocument();
      expect(screen.getByText("African Ruby")).toBeInTheDocument();
      expect(screen.getByText("Savannah Gold")).toBeInTheDocument();
    });
  });
});
