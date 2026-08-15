import React, { useState } from "react";
import { Film, ShieldCheck, Database, Zap, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

export const App: React.FC = () => {
  const [selectedCinema, setSelectedCinema] = useState("Rupa's Cinemas — Eldoret");

  const cinemas = ["Rupa's Cinemas — Eldoret", "Mega Cinema — Kisumu", "Prestige Cinema — Nairobi"];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navigation Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-glass)",
          backdropFilter: "var(--backdrop-blur)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "var(--space-4)",
            paddingBottom: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-md)",
                background:
                  "linear-gradient(135deg, var(--color-crimson) 0%, var(--color-gold) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-gold-glow)",
              }}
            >
              <Film size={22} color="#ffffff" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-family-display)",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  letterSpacing: "-0.01em",
                }}
              >
                KENYA<span style={{ color: "var(--color-gold)" }}>CINEMAS</span>
              </span>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: -2 }}>
                Multi-Tenant SaaS Platform
              </div>
            </div>
          </div>

          {/* Tenant Cinema Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                background: "var(--bg-surface-elevated)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <MapPin size={16} color="var(--color-gold)" />
              <select
                aria-label="Select Cinema Tenant"
                value={selectedCinema}
                onChange={(e) => setSelectedCinema(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-family-body)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {cinemas.map((cinema) => (
                  <option key={cinema} value={cinema} style={{ background: "var(--bg-surface)" }}>
                    {cinema}
                  </option>
                ))}
              </select>
            </div>

            <span className="badge-gold">
              <Sparkles size={12} /> Phase 0.1 Foundation Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingTop: "var(--space-12)", paddingBottom: "var(--space-16)" }}>
        <div className="container">
          {/* Hero Section */}
          <section
            style={{ textAlign: "center", maxWidth: 840, margin: "0 auto var(--space-16) auto" }}
          >
            <div style={{ marginBottom: "var(--space-4)" }}>
              <span className="badge-crimson">Production-Grade SaaS Architecture</span>
            </div>
            <h1 style={{ marginBottom: "var(--space-4)" }}>
              Next-Generation Cinema Management & Digital Ticketing
            </h1>
            <p style={{ fontSize: "1.15rem", lineHeight: 1.7, marginBottom: "var(--space-8)" }}>
              Engineering a high-concurrency, multi-tenant platform initially tailored for{" "}
              <strong style={{ color: "var(--text-primary)" }}>{selectedCinema}</strong> and
              designed to scale to theaters across East Africa.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "var(--space-4)",
                flexWrap: "wrap",
              }}
            >
              <a href="#architecture" className="btn-primary">
                <Database size={18} /> Explore Architecture Stack
              </a>
              <a
                href="http://localhost:8000/api/v1/health/"
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                <ShieldCheck size={18} /> API Health Probe
              </a>
            </div>
          </section>

          {/* Architecture Pillars Grid */}
          <section id="architecture">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "var(--space-6)",
              }}
            >
              {/* Card 1: Django Backend */}
              <div className="cinema-card">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(16, 185, 129, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <Zap size={24} color="#10b981" />
                </div>
                <h3 style={{ marginBottom: "var(--space-2)" }}>Django 5 & DRF Core</h3>
                <p style={{ fontSize: "0.9rem", marginBottom: "var(--space-4)" }}>
                  Modular architecture with Python 3.14, SimpleJWT rotation via secure HttpOnly
                  cookies, and strict clean architecture.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    color: "var(--color-emerald)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} /> Modular Settings Configured
                </div>
              </div>

              {/* Card 2: Postgres RLS */}
              <div className="cinema-card">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(0, 229, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <Database size={24} color="#00e5ff" />
                </div>
                <h3 style={{ marginBottom: "var(--space-2)" }}>PostgreSQL 16 & RLS</h3>
                <p style={{ fontSize: "0.9rem", marginBottom: "var(--space-4)" }}>
                  Thread-safe ContextVar tenant scoping paired with PostgreSQL native Row-Level
                  Security policies for zero data leaks.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    color: "var(--color-cyan)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} /> Row-Level Isolation Engine
                </div>
              </div>

              {/* Card 3: React 19 Frontend */}
              <div className="cinema-card">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(229, 169, 59, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <Film size={24} color="#e5a93b" />
                </div>
                <h3 style={{ marginBottom: "var(--space-2)" }}>Vite + TypeScript</h3>
                <p style={{ fontSize: "0.9rem", marginBottom: "var(--space-4)" }}>
                  Custom Vanilla CSS design token system, TanStack Query server-state caching, and
                  strict zero-error TypeScript rules.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    color: "var(--color-gold)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} /> Luxury Dark Theme System
                </div>
              </div>

              {/* Card 4: Concurrency & Safety */}
              <div className="cinema-card">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(229, 9, 20, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  <ShieldCheck size={24} color="#e50914" />
                </div>
                <h3 style={{ marginBottom: "var(--space-2)" }}>High-Assurance Safety</h3>
                <p style={{ fontSize: "0.9rem", marginBottom: "var(--space-4)" }}>
                  Pessimistic row-locking, UUID public facades, header-based idempotency keys, and
                  automated Celery garbage collection.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    color: "var(--color-crimson)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} /> Concurrency Safety Blueprints
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "var(--space-6)",
          paddingBottom: "var(--space-6)",
          background: "var(--bg-surface)",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
        }}
      >
        <div className="container">
          Cinema Management Platform MVP • Phase 0.1 Scaffold • Crafted for Kenyan Cinemas
        </div>
      </footer>
    </div>
  );
};

export default App;
