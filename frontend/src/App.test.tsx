import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("Africinemas B2B Cinema Operator Onboarding Platform", () => {
  it("renders brand header and B2B operator navigation links cleanly", () => {
    render(<App />);
    expect(screen.getAllByText(/Afri/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/inemas/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Auditoriums")).toBeInTheDocument();
    expect(screen.getByText("Escrow Rails")).toBeInTheDocument();
    expect(screen.getByText("Developer Docs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Operator Log In/i })).toBeInTheDocument();
  });

  it("renders the hero headline and Onboard Your Cinema action buttons", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /The Operating System for.*Modern Cinemas/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Onboard Your Cinema/i }).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Explore Capabilities/i)).toBeInTheDocument();
  });

  it("renders the B2B Operator live screen and box office console mockups", () => {
    render(<App />);
    // Front Mockup (Operator Screen Console)
    expect(screen.getByText("Rupa's Cinemas Eldoret")).toBeInTheDocument();
    expect(screen.getByText("4 Screens Live")).toBeInTheDocument();
    expect(screen.getByText("Screen 1 (IMAX Laser)")).toBeInTheDocument();
    expect(screen.getByText("94.8% Capacity")).toBeInTheDocument();
    expect(screen.getByText("Adjust Seating Tiers")).toBeInTheDocument();
    expect(screen.getByText("Showtime Scheduler")).toBeInTheDocument();

    // Back Mockup (Executive Box Office Console)
    expect(screen.getByText(/Anga Diamond Plaza — Console/i)).toBeInTheDocument();
    expect(screen.getByText("KES 486,200.00")).toBeInTheDocument();
    expect(screen.getByText("1,892 Seats Sold")).toBeInTheDocument();
    expect(screen.getByText("KES 437,580")).toBeInTheDocument();
    expect(screen.getByText("0 Double-Bookings")).toBeInTheDocument();
  });

  it("renders Features 1 section cards for high-yield operations", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Engineered for High-Yield/i })).toBeInTheDocument();
    expect(screen.getByText("Dynamic Seating & Multi-Auditorium Engine")).toBeInTheDocument();
    expect(screen.getByText("Automated M-Pesa Escrow & Split Settlements")).toBeInTheDocument();
  });

  it("renders Platform Advantages section with 2x2 operator grid", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Platform/i })).toBeInTheDocument();
    expect(screen.getByText("5-Minute Tenant Provisioning")).toBeInTheDocument();
    expect(screen.getByText("Zero Double-Booking Guarantee")).toBeInTheDocument();
    expect(screen.getByText("Direct M-Pesa & Card Rails")).toBeInTheDocument();
    expect(screen.getByText("Multiplex & Arthouse Scale")).toBeInTheDocument();
  });

  it("renders Ecosystem Partners, Promo Banner, STK Checkouts and Seat Locking sections", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Ecosystem Partners/i })).toBeInTheDocument();
    expect(screen.getByText("SAFARICOM M-PESA")).toBeInTheDocument();
    expect(screen.getByText("INTASEND")).toBeInTheDocument();
    expect(screen.getByText("BARCO")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Manage Multi-Screen Operations from Anywhere/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Frictionless M-Pesa Checkouts & 0.5s QR Admission/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Distributed Concurrency & High-Traffic Seat Protection/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Ready to Modernize Your Cinema's Box Office\?/i })
    ).toBeInTheDocument();
  });

  it("opens the split-screen auth page in signup mode when Onboard Your Cinema is clicked", () => {
    render(<App />);

    const onboardBtns = screen.getAllByRole("button", { name: /Onboard Your Cinema/i });
    fireEvent.click(onboardBtns[0]);

    expect(screen.getByRole("heading", { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByText(/30-day free cinema trial/i)).toBeInTheDocument();
    expect(document.querySelector("video")).toHaveAttribute("src", "/videos/signup-video.mp4");
    expect(screen.getByRole("button", { name: /^Create account$/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign up with Google/i)).toBeInTheDocument();
  });

  it("opens the split-screen auth page in login mode and can navigate back to website", () => {
    render(<App />);

    const loginBtn = screen.getByRole("button", { name: /Operator Log In/i });
    fireEvent.click(loginBtn);

    expect(screen.getByRole("heading", { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /Back to website/i });
    fireEvent.click(backBtn);
    expect(
      screen.getByRole("heading", { name: /The Operating System for.*Modern Cinemas/i })
    ).toBeInTheDocument();
  });
});
