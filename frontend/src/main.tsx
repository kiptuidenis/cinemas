import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { TenantThemeProvider } from "./context/TenantThemeContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TenantThemeProvider>
      <App />
    </TenantThemeProvider>
  </React.StrictMode>
);
