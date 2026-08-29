/**
 * TypeScript contract interfaces matching the backend /api/v1/tenant/bootstrap/ schema.
 */

export interface CinemaIdentity {
  id: string;
  name: string;
  slug: string;
  city: string;
  physical_address: string;
  contact_email: string;
  contact_phone: string;
}

export interface TenantTheme {
  primary_color: string;
  primary_hover: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  surface_elevated: string;
  border_color: string;
  text_primary: string;
  text_muted: string;
  text_on_primary: string;
  font_display: string;
  font_body: string;
  border_radius: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_backdrop_url: string | null;
  css_variables: Record<string, string>;
}

export interface PaymentCapabilities {
  gateway_mode: "INTASEND_ESCROW" | "DIRECT_DARAJA";
  accepts_mpesa: boolean;
  accepts_card: boolean;
}

export interface TenantBootstrapResponse {
  cinema: CinemaIdentity;
  theme: TenantTheme;
  payment: PaymentCapabilities;
}

export interface TenantContextValue {
  cinema: CinemaIdentity;
  theme: TenantTheme;
  payment: PaymentCapabilities;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
