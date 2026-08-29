import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TenantThemeProvider } from "./TenantThemeContext";
import { useTenant } from "./useTenant";

import { TenantBootstrapResponse } from "../types/tenant";

// Mock consumer component to test useTenant hook
function TestConsumer() {
  const { cinema, theme, payment, isLoading } = useTenant();

  if (isLoading) {
    return <div data-testid="loading-state">Loading tenant...</div>;
  }

  return (
    <div>
      <h1 data-testid="cinema-name">{cinema.name}</h1>
      <span data-testid="cinema-city">{cinema.city}</span>
      <span data-testid="primary-color">{theme.primary_color}</span>
      <span data-testid="gateway-mode">{payment.gateway_mode}</span>
      <span data-testid="mpesa-supported">{payment.accepts_mpesa ? "yes" : "no"}</span>
    </div>
  );
}

describe("TenantThemeContext & Dynamic CSS Token Engine", () => {
  const mockWestgateBootstrap: TenantBootstrapResponse = {
    cinema: {
      id: "11111111-2222-3333-4444-555555555555",
      name: "Westgate Cinema",
      slug: "westgate",
      city: "Nairobi",
      physical_address: "Westgate Mall, Westlands",
      contact_email: "info@westgatecinema.co.ke",
      contact_phone: "+254711000111",
    },
    theme: {
      primary_color: "#F59E0B",
      primary_hover: "#D97706",
      secondary_color: "#10B981",
      accent_color: "#6366F1",
      background_color: "#0D0D11",
      surface_color: "#16161E",
      surface_elevated: "#20202B",
      border_color: "rgba(245, 158, 11, 0.2)",
      text_primary: "#FFFFFF",
      text_muted: "#94A3B8",
      text_on_primary: "#000000",
      font_display: "'Cabinet Grotesk', sans-serif",
      font_body: "'Satoshi', sans-serif",
      border_radius: "12px",
      logo_url: "https://cdn.africinemas.com/logos/westgate.png",
      favicon_url: "https://cdn.africinemas.com/favicons/westgate.ico",
      hero_backdrop_url: "https://cdn.africinemas.com/hero/westgate.jpg",
      css_variables: {
        "--color-primary": "#F59E0B",
        "--color-primary-hover": "#D97706",
        "--color-secondary": "#10B981",
        "--color-accent": "#6366F1",
        "--bg-app": "#0D0D11",
        "--bg-surface": "#16161E",
        "--bg-surface-elevated": "#20202B",
        "--border-subtle": "rgba(245, 158, 11, 0.2)",
        "--text-primary": "#FFFFFF",
        "--text-muted": "#94A3B8",
        "--text-on-primary": "#000000",
        "--font-family-display": "'Cabinet Grotesk', sans-serif",
        "--font-family-body": "'Satoshi', sans-serif",
        "--radius-md": "12px",
      },
    },
    payment: {
      gateway_mode: "DIRECT_DARAJA",
      accepts_mpesa: true,
      accepts_card: false,
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    document.title = "Africinemas";
    // Reset CSS variables
    document.documentElement.removeAttribute("style");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("injects dynamic CSS variables into document.documentElement upon successful bootstrap", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockWestgateBootstrap,
    } as Response);

    render(
      <TenantThemeProvider>
        <TestConsumer />
      </TenantThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("cinema-name")).toHaveTextContent("Westgate Cinema");
    });

    const rootStyle = document.documentElement.style;
    expect(rootStyle.getPropertyValue("--color-primary")).toBe("#F59E0B");
    expect(rootStyle.getPropertyValue("--color-primary-hover")).toBe("#D97706");
    expect(rootStyle.getPropertyValue("--color-secondary")).toBe("#10B981");
    expect(rootStyle.getPropertyValue("--bg-app")).toBe("#0D0D11");
    expect(rootStyle.getPropertyValue("--radius-md")).toBe("12px");
    expect(rootStyle.getPropertyValue("--text-on-primary")).toBe("#000000");
  });

  it("dynamically updates document title and sets favicon link", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockWestgateBootstrap,
    } as Response);

    render(
      <TenantThemeProvider>
        <TestConsumer />
      </TenantThemeProvider>
    );

    await waitFor(() => {
      expect(document.title).toBe("Westgate Cinema | Africinemas");
    });

    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    expect(favicon).not.toBeNull();
    expect(favicon.href).toBe("https://cdn.africinemas.com/favicons/westgate.ico");
  });

  it("falls back to default African Ruby tokens when the API fails with network error", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Error"));

    render(
      <TenantThemeProvider>
        <TestConsumer />
      </TenantThemeProvider>
    );

    // Should gracefully render fallback without crashing
    await waitFor(() => {
      expect(screen.getByTestId("cinema-name")).toHaveTextContent("Africinemas");
      expect(screen.getByTestId("primary-color")).toHaveTextContent("#E61C24");
    });

    const rootStyle = document.documentElement.style;
    expect(rootStyle.getPropertyValue("--color-primary")).toBe("#E61C24");
    expect(rootStyle.getPropertyValue("--bg-app")).toBe("#08080D");
  });

  it("exposes cinema identity and payment capabilities via useTenant hook", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockWestgateBootstrap,
    } as Response);

    render(
      <TenantThemeProvider>
        <TestConsumer />
      </TenantThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("cinema-city")).toHaveTextContent("Nairobi");
      expect(screen.getByTestId("gateway-mode")).toHaveTextContent("DIRECT_DARAJA");
      expect(screen.getByTestId("mpesa-supported")).toHaveTextContent("yes");
    });
  });
});
