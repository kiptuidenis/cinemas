import { createContext } from "react";
import { TenantContextValue } from "../types/tenant";

export const TenantThemeContext = createContext<TenantContextValue | undefined>(undefined);
