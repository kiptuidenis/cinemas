import { TenantBootstrapResponse } from "../types/tenant";

/**
 * Fetch tenant bootstrap metadata including identity, design tokens, and payment capabilities.
 * Automatically queries the relative endpoint /api/v1/tenant/bootstrap/ which resolves
 * to the active cinema subdomain via backend TenantMainMiddleware.
 */
export async function fetchTenantBootstrap(signal?: AbortSignal): Promise<TenantBootstrapResponse> {
  const response = await fetch("/api/v1/tenant/bootstrap/", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to bootstrap cinema tenant: HTTP ${response.status}`);
  }

  const data: TenantBootstrapResponse = await response.json();
  return data;
}
