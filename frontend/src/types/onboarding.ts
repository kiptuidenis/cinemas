import { z } from "zod";

export const KENYA_CITIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
  "Garissa",
  "Machakos",
] as const;

export const RESERVED_SLUGS = [
  "api",
  "admin",
  "app",
  "auth",
  "billing",
  "dashboard",
  "help",
  "login",
  "pay",
  "public",
  "root",
  "secure",
  "support",
  "www",
  "africinemas",
];

// -----------------------------------------------------------------------------
// Step 1: Cinema Identity & Subdomain
// -----------------------------------------------------------------------------
export const step1Schema = z.object({
  cinema_name: z
    .string()
    .min(2, "Cinema name must be at least 2 characters")
    .max(100, "Cinema name cannot exceed 100 characters"),
  slug: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain cannot exceed 63 characters")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain must contain only lowercase letters, numbers, and hyphens (cannot start or end with a hyphen)"
    )
    .refine((slug) => !RESERVED_SLUGS.includes(slug), {
      message: "This subdomain is reserved for platform infrastructure",
    }),
  city: z.enum(KENYA_CITIES, {
    message: "Please select a valid Kenyan city",
  }),
  address: z
    .string()
    .min(3, "Please specify mall, building, or street location")
    .max(255, "Address cannot exceed 255 characters"),
  contact_phone: z
    .string()
    .regex(
      /^(?:\+254|0)[17]\d{8}$/,
      "Enter a valid Kenyan phone number (+254... or 07... / 01...)"
    ),
});

export type Step1FormData = z.infer<typeof step1Schema>;

// -----------------------------------------------------------------------------
// Step 2: Brand Styling
// -----------------------------------------------------------------------------
export const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const step2Schema = z.object({
  primary_color: z.string().regex(hexColorRegex, "Must be a valid hex color (#RRGGBB)"),
  secondary_color: z.string().regex(hexColorRegex, "Must be a valid hex color (#RRGGBB)"),
  accent_color: z.string().regex(hexColorRegex, "Must be a valid hex color (#RRGGBB)"),
  preset_name: z.string().optional(),
});

export type Step2FormData = z.infer<typeof step2Schema>;

export interface ThemePreset {
  name: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  description: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "african-ruby",
    label: "African Ruby",
    primary: "#E61C24",
    secondary: "#E5A93B",
    accent: "#00E5FF",
    description: "Vibrant high-contrast crimson and gold for blockbuster theaters",
  },
  {
    name: "savannah-gold",
    label: "Savannah Gold",
    primary: "#E5A93B",
    secondary: "#181826",
    accent: "#E61C24",
    description: "Opulent golden amber luxury cinema aesthetic",
  },
  {
    name: "emerald-imax",
    label: "Emerald IMAX",
    primary: "#05C46B",
    secondary: "#08080D",
    accent: "#D6FF38",
    description: "Modern laser IMAX feel with electric emerald & chartreuse",
  },
  {
    name: "electric-lime",
    label: "Electric Cinema",
    primary: "#D6FF38",
    secondary: "#111113",
    accent: "#00E5FF",
    description: "High-tech neo-fintech high-voltage lime for modern indie venues",
  },
  {
    name: "midnight-velvet",
    label: "Midnight Velvet",
    primary: "#8B5CF6",
    secondary: "#1E1B4B",
    accent: "#F43F5E",
    description: "Deep atmospheric violet and rose for boutique cinephile venues",
  },
];

// -----------------------------------------------------------------------------
// Step 3: Operator Account
// -----------------------------------------------------------------------------
export const step3Schema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please provide a valid business email address"),
    phone_number: z
      .string()
      .regex(
        /^(?:\+254|0)[17]\d{8}$/,
        "Enter a valid Kenyan phone number (+254... or 07... / 01...)"
      ),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters for tenant administration")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export type Step3FormData = z.infer<typeof step3Schema>;

// -----------------------------------------------------------------------------
// Complete Combined Onboarding Data
// -----------------------------------------------------------------------------
export const onboardingSchema = step1Schema.and(step2Schema).and(step3Schema);
export type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Subdomain status response
export interface SubdomainCheckResponse {
  subdomain: string;
  is_available: boolean;
  status: "AVAILABLE" | "TAKEN" | "RESERVED" | "COOLING_DOWN" | "INVALID";
  suggestions?: string[];
  cooldown_until?: string | null;
  message?: string;
}

// Provisioning status response
export interface ProvisioningStatusResponse {
  cinema_slug: string;
  status: "PENDING" | "PROVISIONING" | "RETRYING" | "READY" | "FAILED" | "SUSPENDED";
  progress_percent: number;
  current_step: string;
  provisioning_error?: string | null;
  domain_url?: string;
  created_at: string;
}
