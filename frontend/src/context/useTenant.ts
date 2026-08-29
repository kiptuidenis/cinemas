import { useContext } from "react";
import { TenantContextValue } from "../types/tenant";
import { TenantThemeContext } from "./tenantContext";

/**
 * Custom React hook to access the active cinema identity, theme tokens, and payment capabilities.
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantThemeContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantThemeProvider");
  }
  return context;
}
