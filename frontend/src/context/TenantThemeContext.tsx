import React, { useEffect, useState } from "react";
import { fetchTenantBootstrap } from "../api/tenant";
import { DEFAULT_TENANT_BOOTSTRAP } from "../types/defaults";
import {
  CinemaIdentity,
  TenantBootstrapResponse,
  TenantContextValue,
  TenantTheme,
} from "../types/tenant";
import { TenantThemeContext } from "./tenantContext";

/**
 * Injects CSS custom properties into :root (document.documentElement)
 * and updates document title and favicon links.
 */
function applyTheme(theme: TenantTheme, cinema: CinemaIdentity): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // 1. Inject Dynamic CSS Variables
  if (theme.css_variables) {
    for (const [key, value] of Object.entries(theme.css_variables)) {
      root.style.setProperty(key, value);
    }
  }

  // 2. Dynamic Document Title
  if (cinema.name && cinema.slug !== "default") {
    document.title = `${cinema.name} | Africinemas`;
  } else {
    document.title = "Africinemas — Multi-Tenant Cinema Hub";
  }

  // 3. Dynamic Favicon Injection
  if (theme.favicon_url) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = theme.favicon_url;
  }
}

export interface TenantThemeProviderProps {
  children: React.ReactNode;
  initialData?: TenantBootstrapResponse;
}

export const TenantThemeProvider: React.FC<TenantThemeProviderProps> = ({
  children,
  initialData,
}) => {
  const [bootstrap, setBootstrap] = useState<TenantBootstrapResponse>(
    initialData || DEFAULT_TENANT_BOOTSTRAP
  );
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialData) {
      applyTheme(initialData.theme, initialData.cinema);
      return;
    }

    const controller = new AbortController();

    async function loadTenant(): Promise<void> {
      try {
        setIsLoading(true);
        setIsError(false);
        const data = await fetchTenantBootstrap(controller.signal);
        setBootstrap(data);
        applyTheme(data.theme, data.cinema);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const errorObj = err instanceof Error ? err : new Error(String(err));
        console.warn(
          "[TenantThemeProvider] Failed to load tenant bootstrap. Using fallback theme.",
          errorObj
        );
        setIsError(true);
        setError(errorObj);
        // Apply default African Ruby theme on error so UI never crashes or looks broken
        applyTheme(DEFAULT_TENANT_BOOTSTRAP.theme, DEFAULT_TENANT_BOOTSTRAP.cinema);
      } finally {
        setIsLoading(false);
      }
    }

    loadTenant();

    return () => {
      controller.abort();
    };
  }, [initialData]);

  const value: TenantContextValue = {
    cinema: bootstrap.cinema,
    theme: bootstrap.theme,
    payment: bootstrap.payment,
    isLoading,
    isError,
    error,
  };

  return <TenantThemeContext.Provider value={value}>{children}</TenantThemeContext.Provider>;
};
