import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("Cinema Platform App Shell", () => {
  it("renders brand header and cinema title cleanly", () => {
    render(<App />);
    expect(screen.getByText("KENYA")).toBeInTheDocument();
    expect(screen.getByText("CINEMAS")).toBeInTheDocument();
  });

  it("renders the active phase status badge", () => {
    render(<App />);
    expect(screen.getByText(/Phase 0.1 Foundation Active/i)).toBeInTheDocument();
  });

  it("displays the tenant selection control", () => {
    render(<App />);
    const select = screen.getByRole("combobox", { name: /Select Cinema Tenant/i });
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("Rupa's Cinemas — Eldoret");
    expect(screen.getAllByText("Rupa's Cinemas — Eldoret").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 4 core architecture pillar cards", () => {
    render(<App />);
    expect(screen.getByText("Django 5 & DRF Core")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL 16 & RLS")).toBeInTheDocument();
    expect(screen.getByText("Vite + TypeScript")).toBeInTheDocument();
    expect(screen.getByText("High-Assurance Safety")).toBeInTheDocument();
  });
});
