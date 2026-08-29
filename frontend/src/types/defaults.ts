import { TenantBootstrapResponse } from "./tenant";

/**
 * Default fallback luxury African Ruby theme and escrow capabilities
 * used during initial load, network downtime, or for unconfigured tenants.
 */
export const DEFAULT_TENANT_BOOTSTRAP: TenantBootstrapResponse = {
  cinema: {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Africinemas",
    slug: "default",
    city: "Nairobi",
    physical_address: "Kenya",
    contact_email: "info@africinemas.com",
    contact_phone: "+254700000000",
  },
  theme: {
    primary_color: "#E61C24",
    primary_hover: "#C0141B",
    secondary_color: "#E5A93B",
    accent_color: "#00E5FF",
    background_color: "#08080D",
    surface_color: "#10101A",
    surface_elevated: "#181826",
    border_color: "rgba(255, 255, 255, 0.08)",
    text_primary: "#FFFFFF",
    text_muted: "#94A3B8",
    text_on_primary: "#FFFFFF",
    font_display: "'Outfit', sans-serif",
    font_body: "'Inter', sans-serif",
    border_radius: "10px",
    logo_url: null,
    favicon_url: null,
    hero_backdrop_url: null,
    css_variables: {
      "--color-primary": "#E61C24",
      "--color-primary-hover": "#C0141B",
      "--color-secondary": "#E5A93B",
      "--color-accent": "#00E5FF",
      "--bg-app": "#08080D",
      "--bg-surface": "#10101A",
      "--bg-surface-elevated": "#181826",
      "--border-subtle": "rgba(255, 255, 255, 0.08)",
      "--text-primary": "#FFFFFF",
      "--text-muted": "#94A3B8",
      "--text-on-primary": "#FFFFFF",
      "--font-family-display": "'Outfit', sans-serif",
      "--font-family-body": "'Inter', sans-serif",
      "--radius-md": "10px",
    },
  },
  payment: {
    gateway_mode: "INTASEND_ESCROW",
    accepts_mpesa: true,
    accepts_card: true,
  },
};
