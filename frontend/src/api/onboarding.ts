import {
  OnboardingFormData,
  ProvisioningStatusResponse,
  SubdomainCheckResponse,
} from "../types/onboarding";

/**
 * Check subdomain availability and suggestions with backend SubdomainAvailabilityService.
 */
export async function checkSubdomainAvailability(
  subdomain: string,
  signal?: AbortSignal
): Promise<SubdomainCheckResponse> {
  if (!subdomain || subdomain.trim().length === 0) {
    return {
      subdomain: "",
      is_available: false,
      status: "INVALID",
      message: "Subdomain cannot be empty",
    };
  }

  const encoded = encodeURIComponent(subdomain.trim().toLowerCase());
  const response = await fetch(`/api/v1/onboarding/check-subdomain/?subdomain=${encoded}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.detail || `Subdomain check failed: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Submit cinema registration payload with a unique client-generated idempotency key.
 */
export async function registerCinema(
  data: OnboardingFormData,
  idempotencyKey: string,
  signal?: AbortSignal
): Promise<ProvisioningStatusResponse> {
  const payload = {
    cinema_name: data.cinema_name,
    slug: data.slug.toLowerCase().trim(),
    city: data.city,
    address: data.address,
    contact_phone: data.contact_phone,
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    accent_color: data.accent_color,
    operator: {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email.toLowerCase().trim(),
      phone_number: data.phone_number,
      password: data.password,
      password_confirm: data.password_confirm,
    },
  };

  const response = await fetch("/api/v1/onboarding/register/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (response.status !== 202 && response.status !== 200 && response.status !== 201) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody?.detail ||
      errorBody?.message ||
      (typeof errorBody === "object" && errorBody ? JSON.stringify(errorBody) : null) ||
      `Registration failed: HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * Poll provisioning status of a registered cinema tenant.
 */
export async function getProvisioningStatus(
  slug: string,
  signal?: AbortSignal
): Promise<ProvisioningStatusResponse> {
  const encoded = encodeURIComponent(slug.trim().toLowerCase());
  const response = await fetch(`/api/v1/onboarding/status/?slug=${encoded}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(errBody?.detail || `Status check failed: HTTP ${response.status}`);
  }

  return response.json();
}
