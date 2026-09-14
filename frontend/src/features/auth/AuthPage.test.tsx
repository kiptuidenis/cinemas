import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthPage } from "./AuthPage";
import * as onboardingApi from "../../api/onboarding";

describe("AuthPage Split-Screen Authentication Architecture", () => {
  const mockBackToHome = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders split-screen architecture with form on left and 3D cinema row on right", () => {
    render(
      <AuthPage initialMode="signup" onBackToHome={mockBackToHome} onSuccess={mockOnSuccess} />
    );

    // Left Side Brand & Form Elements
    expect(screen.getByRole("heading", { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByText(/Start your 30-day free cinema trial/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cinema \/ Company Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Custom Subdomain/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Work Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Create account$/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign up with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/© Africinemas 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/help@africinemas.com/i)).toBeInTheDocument();

    // Right Side Video Showcase
    const videoEl = document.querySelector("video");
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute("src", "/videos/signup-video.mp4");
  });

  it("allows toggling between Sign Up and Sign In modes smoothly", () => {
    render(
      <AuthPage initialMode="signup" onBackToHome={mockBackToHome} onSuccess={mockOnSuccess} />
    );

    // Switch to Sign In
    const loginLink = screen.getByRole("button", { name: /^Log in$/i });
    fireEvent.click(loginLink);

    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email or Subdomain/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Remember for 30 days/i)).toBeInTheDocument();

    // Switch back to Sign Up
    const signupLink = screen.getByRole("button", { name: /^Sign up$/i });
    fireEvent.click(signupLink);

    expect(screen.getByRole("heading", { name: /Create an account/i })).toBeInTheDocument();
  });

  it("checks subdomain availability on user input", async () => {
    vi.spyOn(onboardingApi, "checkSubdomainAvailability").mockResolvedValue({
      subdomain: "westgate",
      is_available: true,
      status: "AVAILABLE",
    });

    const user = userEvent.setup();
    render(
      <AuthPage initialMode="signup" onBackToHome={mockBackToHome} onSuccess={mockOnSuccess} />
    );

    const slugInput = screen.getByLabelText(/Custom Subdomain/i);
    await user.clear(slugInput);
    await user.type(slugInput, "westgate");

    await waitFor(() => {
      expect(screen.getByText(/westgate.africinemas.com is available!/i)).toBeInTheDocument();
    });
  });

  it("calls onBackToHome when Back to website button is clicked", () => {
    render(
      <AuthPage initialMode="signup" onBackToHome={mockBackToHome} onSuccess={mockOnSuccess} />
    );

    const backBtn = screen.getByRole("button", { name: /Back to website/i });
    fireEvent.click(backBtn);
    expect(mockBackToHome).toHaveBeenCalledTimes(1);
  });
});
