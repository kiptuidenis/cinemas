import React, { useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  TrendingUp,
  Percent,
  HelpCircle,
  Facebook,
  Twitter,
  Youtube,
  Star,
  Zap,
  Film,
  Clock,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { RegistrationWizard } from "./features/onboarding/RegistrationWizard";
import { ProvisioningStatusModal } from "./features/onboarding/ProvisioningStatusModal";
import { ProvisioningStatusResponse } from "./types/onboarding";

// Industry standard desktop layout container (Material Design 3 / Apple HIG / Tailwind 7xl):
// 58px balanced edge gutters (calc(100% - 116px)) with a 1360px maximum container width.
const CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: 1360,
  width: "calc(100% - 116px)",
  margin: "0 auto",
};

export const App: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [provisioningSlug, setProvisioningSlug] = useState("westgate");
  const [initialStatus, setInitialStatus] = useState<ProvisioningStatusResponse | null>(null);

  const handleRegistrationSuccess = (response: ProvisioningStatusResponse) => {
    setIsWizardOpen(false);
    setProvisioningSlug(response.cinema_slug);
    setInitialStatus(response);
    setIsStatusModalOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#F8F9FA",
        color: "#111111",
        overflowX: "hidden",
      }}
    >
      {/* ======================================================================
          A. NAVIGATION BAR (Sticky Header)
          ====================================================================== */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          borderBottom: "1px solid #EBEBEB",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div
          style={{
            ...CONTAINER_STYLE,
            padding: "16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo (Left): "Africinemas" with tiny lime green dot */}
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <span
              style={{
                fontFamily: "var(--font-family-display)",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "#111111",
                letterSpacing: "-0.03em",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Afri
              <span style={{ position: "relative", display: "inline-block" }}>
                c
                <span
                  style={{
                    position: "absolute",
                    top: "30%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#D4FF00",
                  }}
                />
              </span>
              <span style={{ fontWeight: 800 }}>inemas</span>
            </span>
          </div>

          {/* Links (Center) - B2B Cinema Operator Solutions */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "#555555",
            }}
          >
            <a href="#features" style={{ color: "#111111", fontWeight: 600 }}>
              Features
            </a>
            <a href="#auditoriums" style={{ color: "#555555" }}>
              Auditoriums
            </a>
            <a href="#escrow" style={{ color: "#555555" }}>
              Escrow Rails
            </a>
            <a href="#docs" style={{ color: "#555555" }}>
              Developer Docs
            </a>
          </nav>

          {/* Actions (Right) */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#555555",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              Operator Log In
            </button>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              style={{
                background: "#111111",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "999px",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                transition: "transform 150ms ease",
              }}
            >
              <Film size={18} color="#D4FF00" /> Onboard Your Cinema
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================================
          B. HERO SECTION
          ====================================================================== */}
      <section
        id="hero"
        style={{
          ...CONTAINER_STYLE,
          margin: "28px auto 90px auto",
          padding: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.06fr 0.94fr",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          {/* Left Column: Massive Vibrant Lime-Green Organic Container */}
          <div
            style={{
              background: "#D4FF00",
              borderRadius: "40px",
              padding: "54px 48px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              minHeight: 560,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "clamp(2.7rem, 3.8vw, 3.8rem)",
                  fontWeight: 800,
                  lineHeight: 1.06,
                  letterSpacing: "-0.04em",
                  color: "#111111",
                  marginBottom: 24,
                }}
              >
                The Operating System for{" "}
                <span
                  style={{
                    display: "inline-block",
                    transform: "translateY(-4px)",
                    fontSize: "0.8em",
                  }}
                >
                  ✦
                </span>
                <br />
                Modern Cinemas
              </h1>

              <p
                style={{
                  fontSize: "1.12rem",
                  lineHeight: 1.6,
                  color: "#222222",
                  maxWidth: 460,
                  marginBottom: 44,
                  fontWeight: 500,
                }}
              >
                Run your entire cinema business on one high-concurrency platform: self-serve tenant
                onboarding, automated M-Pesa revenue splits, dynamic seating tiers, and live
                projector sync in under 5 minutes.
              </p>

              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "#111111",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "999px",
                  padding: "16px 32px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
                }}
              >
                <Ticket size={20} color="#D4FF00" /> Onboard Your Cinema
              </button>
            </div>

            {/* Scroll Indicator at bottom left */}
            <a
              href="#features"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#111111",
                cursor: "pointer",
                marginTop: 40,
                textDecoration: "none",
              }}
            >
              <span>Explore Capabilities</span>
              <ArrowDown size={16} />
            </a>

            {/* Hand-drawn black doodle loop line */}
            <svg
              width="160"
              height="140"
              viewBox="0 0 160 140"
              fill="none"
              style={{
                position: "absolute",
                bottom: -20,
                right: 10,
                pointerEvents: "none",
                opacity: 0.35,
              }}
            >
              <path
                d="M10 110 C40 30, 90 120, 145 40"
                stroke="#111111"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="145" cy="40" r="6" fill="#111111" />
            </svg>
          </div>

          {/* Right Column: Layered Multi-Depth Platform Mockups */}
          <div
            style={{
              position: "relative",
              minHeight: 560,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Back Mockup (Offset Dark UI Card - Executive Box Office Console) */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 15,
                width: 345,
                background: "#161619",
                borderRadius: "32px",
                padding: "24px 20px",
                color: "#FFFFFF",
                boxShadow: "0 22px 46px rgba(0, 0, 0, 0.16)",
                transform: "rotate(4deg) scale(0.98)",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Film size={16} color="#D4FF00" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    Anga Diamond Plaza — Console
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: "rgba(212, 255, 0, 0.15)",
                    color: "#D4FF00",
                    padding: "3px 8px",
                    borderRadius: "999px",
                  }}
                >
                  Verified Tenant
                </div>
              </div>

              <div style={{ fontSize: "0.75rem", color: "#888888", textTransform: "uppercase" }}>
                Today's Box Office Gross
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: 2 }}>
                KES 486,200.00
              </div>
              <div style={{ fontSize: "0.75rem", color: "#05C46B", fontWeight: 600 }}>
                +18.4% vs last Friday
              </div>

              {/* Glowing Line Chart */}
              <div style={{ height: 80, margin: "12px 0", position: "relative" }}>
                <svg width="100%" height="100%" viewBox="0 0 280 80" fill="none">
                  <path
                    d="M0 60 C30 50, 60 70, 90 40 C120 10, 150 50, 190 20 C230 -10, 250 30, 280 15"
                    stroke="#D4FF00"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="280" cy="15" r="5" fill="#D4FF00" />
                </svg>
              </div>

              {/* Time Range Tabs */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "#888888",
                  borderBottom: "1px solid #2B2B30",
                  paddingBottom: 8,
                  marginBottom: 10,
                }}
              >
                <span>Today</span>
                <span>Week</span>
                <span style={{ color: "#D4FF00", fontWeight: 700 }}>Month</span>
                <span>Q3</span>
                <span>All</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  marginBottom: 6,
                }}
              >
                <span style={{ color: "#AAAAAA" }}>Admissions</span>
                <span style={{ fontWeight: 700 }}>1,892 Seats Sold</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "#05C46B",
                  marginBottom: 4,
                }}
              >
                <span>Net Escrow Settlement</span>
                <span style={{ fontWeight: 700 }}>KES 437,580</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.7rem",
                  color: "#888888",
                }}
              >
                <span>Concurrency Guard</span>
                <span style={{ color: "#D4FF00", fontWeight: 700 }}>0 Double-Bookings</span>
              </div>
            </div>

            {/* Front Mockup (Pure White UI Card - Operator Live Screen & Box Office Console) */}
            <div
              style={{
                position: "absolute",
                left: 8,
                bottom: 12,
                width: 360,
                background: "#FFFFFF",
                borderRadius: "32px",
                padding: "24px 22px",
                boxShadow: "0 24px 50px rgba(0, 0, 0, 0.09)",
                border: "1px solid #EBEBEB",
                zIndex: 2,
              }}
            >
              {/* Header: Cinema Name + Active Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111111" }}>
                    Rupa's Cinemas Eldoret
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#666666", fontWeight: 500 }}>
                    Live Screen Operations Console
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#111113",
                    color: "#D4FF00",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#D4FF00",
                      display: "inline-block",
                    }}
                  />
                  4 Screens Live
                </div>
              </div>

              {/* Screen Selector Chips */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "hidden" }}>
                <span
                  style={{
                    background: "#111111",
                    color: "#FFFFFF",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  Screen 1 (IMAX Laser)
                </span>
                <span
                  style={{
                    background: "#F2F3F5",
                    color: "#555555",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  Screen 2 (3D Atmos)
                </span>
                <span
                  style={{
                    background: "#F2F3F5",
                    color: "#555555",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  Screen 3 (VIP Velvet)
                </span>
              </div>

              {/* Active Screen Monitor Card */}
              <div
                style={{
                  background: "#111113",
                  color: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#AAAAAA" }}>
                    Screen 1: Dune: Part Two (Evening)
                  </div>
                  <div
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: "#D4FF00",
                      marginTop: 2,
                    }}
                  >
                    94.8% Capacity
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#888888", marginTop: 2 }}>
                    228 / 240 Seats • KES 273,600 Gross
                  </div>
                </div>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "3px solid #D4FF00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={16} color="#D4FF00" />
                </div>
              </div>

              {/* Secondary Screens Status */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    background: "#F8F9FA",
                    padding: "8px 12px",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Film size={13} color="#111111" />
                    <span style={{ fontWeight: 600 }}>Screen 2: Deadpool & Wolverine</span>
                  </div>
                  <div style={{ fontWeight: 700, color: "#05C46B" }}>86.5% Sold</div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "#555555",
                    padding: "0 4px",
                  }}
                >
                  <span>Concession POS Attach Rate</span>
                  <span style={{ fontWeight: 700, color: "#111111" }}>42% (KES 84,500)</span>
                </div>
              </div>

              {/* Operator Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  style={{
                    background: "#F2F3F5",
                    color: "#111111",
                    border: "1px solid #E0E2E6",
                    borderRadius: "999px",
                    padding: "9px 8px",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Adjust Seating Tiers
                </button>
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  style={{
                    background: "#D4FF00",
                    color: "#111111",
                    border: "none",
                    borderRadius: "999px",
                    padding: "9px 8px",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(212, 255, 0, 0.3)",
                  }}
                >
                  Showtime Scheduler
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          C. FEATURES SECTION 1: "Engineered for High-Yield Theater Operations"
          ====================================================================== */}
      <section
        id="features"
        style={{
          ...CONTAINER_STYLE,
          margin: "0 auto 100px auto",
          padding: 0,
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2rem, 3.8vw, 2.8rem)",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.03em",
            marginBottom: 36,
            maxWidth: 560,
          }}
        >
          Engineered for High-Yield
          <br />
          Theater Operations
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Card 1: Dynamic Seating & Multi-Auditorium Engine */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "28px",
              padding: "40px 36px",
              border: "1px solid #EBEBEB",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 280,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <h3
                style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111111", marginBottom: 10 }}
              >
                Dynamic Seating & Multi-Auditorium Engine
              </h3>
              <p style={{ color: "#555555", fontSize: "1rem", maxWidth: 360, lineHeight: 1.5 }}>
                Design custom VIP luxury recliners, couples daybeds, and standard tiers with
                automated showtime pricing rules and TMS projector synchronization.
              </p>
            </div>

            <div style={{ marginTop: 32 }}>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111111",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Explore Seating Engine <ArrowRight size={16} />
              </button>
            </div>

            {/* Graphic: Lime green blob + black hand-drawn squiggly doodle */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: 20,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "36px",
                  background: "#D4FF00",
                  transform: "rotate(-12deg)",
                }}
              />
              <svg
                width="70"
                height="70"
                viewBox="0 0 70 70"
                fill="none"
                style={{ marginLeft: -40, zIndex: 1 }}
              >
                <path
                  d="M15 35 C20 15, 55 15, 50 35 C45 55, 20 50, 35 30"
                  stroke="#111111"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Automated M-Pesa Escrow & Split Settlements */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "28px",
              padding: "40px 36px",
              border: "1px solid #EBEBEB",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 280,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <h3
                style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111111", marginBottom: 10 }}
              >
                Automated M-Pesa Escrow & Split Settlements
              </h3>
              <p style={{ color: "#555555", fontSize: "1rem", maxWidth: 360, lineHeight: 1.5 }}>
                Instant daily revenue sweeps to your corporate bank account via IntaSend escrow,
                eliminating manual cash counts and simplifying KRA/distributor reports.
              </p>
            </div>

            <div style={{ marginTop: 32 }}>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#111111",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                View Settlement Flows <ArrowRight size={16} />
              </button>
            </div>

            {/* Graphic: Hand-drawn black squiggly upward line chart with colored disc */}
            <div
              style={{
                position: "absolute",
                bottom: 24,
                right: 32,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#D4FF00",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#FF5252",
                }}
              />
              <svg width="80" height="50" viewBox="0 0 80 50" fill="none">
                <path
                  d="M5 45 C25 35, 30 50, 50 15 C60 0, 68 20, 75 8"
                  stroke="#111111"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx="75" cy="8" r="4" fill="#111111" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          D. ADVANTAGES SECTION (2-Column: 30% Left, 70% Right 2x2 Grid)
          ====================================================================== */}
      <section
        id="auditoriums"
        style={{
          ...CONTAINER_STYLE,
          margin: "0 auto 100px auto",
          padding: 0,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "0.75fr 1.25fr", gap: 48 }}>
          {/* Left Column (30%) */}
          <div>
            <h2
              style={{
                fontSize: "clamp(2.2rem, 3.5vw, 3rem)",
                fontWeight: 800,
                color: "#111111",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: 20,
              }}
            >
              Platform
              <br />
              Advantages
            </h2>
            <p
              style={{
                color: "#555555",
                fontSize: "1.05rem",
                lineHeight: 1.6,
                maxWidth: 320,
              }}
            >
              Engineered in consultation with Kenyan cinema exhibitors to eliminate box office
              friction, queue bottlenecks, and revenue leakage.
            </p>
          </div>

          {/* Right Column (70% - 2x2 Grid) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Item 1: 5-Minute Tenant Provisioning */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid #EBEBEB",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#D4FF00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111111",
                  marginBottom: 16,
                }}
              >
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111111" }}>
                5-Minute Tenant Provisioning
              </h3>
              <p style={{ color: "#555555", fontSize: "0.9rem", marginTop: 8, lineHeight: 1.5 }}>
                Without complex server provisioning, launch your branded cinema portal, custom
                subdomain (e.g. westgate.africinemas.com), and booking engine in under 5 minutes.
              </p>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5D7DC",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#111111",
                  marginTop: 16,
                  cursor: "pointer",
                }}
              >
                Onboard Cinema
              </button>
            </div>

            {/* Item 2: Zero Double-Booking Guarantee */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid #EBEBEB",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#D4FF00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111111",
                  marginBottom: 16,
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111111" }}>
                Zero Double-Booking Guarantee
              </h3>
              <p style={{ color: "#555555", fontSize: "0.9rem", marginTop: 8, lineHeight: 1.5 }}>
                Our distributed Redis locking engine isolates every seat with a 7-minute TTL,
                guaranteeing zero duplicate tickets during blockbuster rushes.
              </p>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5D7DC",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#111111",
                  marginTop: 16,
                  cursor: "pointer",
                }}
              >
                Explore Architecture
              </button>
            </div>

            {/* Item 3: Direct M-Pesa & Card Rails */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid #EBEBEB",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#D4FF00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111111",
                  marginBottom: 16,
                }}
              >
                <Percent size={20} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111111" }}>
                Direct M-Pesa & Card Rails
              </h3>
              <p style={{ color: "#555555", fontSize: "0.9rem", marginTop: 8, lineHeight: 1.5 }}>
                Built-in IntaSend escrow handles customer payments directly into your theater
                merchant account with instant STK push and transparent 10% platform split.
              </p>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5D7DC",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#111111",
                  marginTop: 16,
                  cursor: "pointer",
                }}
              >
                Explore Pricing
              </button>
            </div>

            {/* Item 4: Multiplex & Arthouse Scale */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid #EBEBEB",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#D4FF00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111111",
                  marginBottom: 16,
                }}
              >
                <Star size={20} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111111" }}>
                Multiplex & Arthouse Scale
              </h3>
              <p style={{ color: "#555555", fontSize: "0.9rem", marginTop: 8, lineHeight: 1.5 }}>
                From single-screen community auditoriums in Eldoret to 12-screen commercial
                multiplex circuits across East Africa.
              </p>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5D7DC",
                  borderRadius: "999px",
                  padding: "6px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#111111",
                  marginTop: 16,
                  cursor: "pointer",
                }}
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          E. PARTNERS SECTION
          ====================================================================== */}
      <section
        id="escrow"
        style={{
          ...CONTAINER_STYLE,
          margin: "0 auto 100px auto",
          padding: 0,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#111111", marginBottom: 10 }}>
          Ecosystem Partners
        </h2>
        <p style={{ color: "#555555", fontSize: "1.05rem", marginBottom: 44 }}>
          Trusted by Cinema Operators, Integrated with Global Cinematic Exhibition Standards
        </p>

        {/* Monochrome Logos Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 44,
            flexWrap: "wrap",
            opacity: 0.9,
          }}
        >
          {/* M-PESA */}
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.25rem",
              letterSpacing: "0.04em",
              color: "#111111",
            }}
          >
            SAFARICOM M-PESA
          </div>

          {/* IntaSend */}
          <div
            style={{
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-0.02em",
              color: "#111111",
            }}
          >
            INTASEND
          </div>

          {/* KCB Bank */}
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.2rem",
              letterSpacing: "0.05em",
              color: "#111111",
            }}
          >
            KCB BANK
          </div>

          {/* VISA */}
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.35rem",
              fontStyle: "italic",
              letterSpacing: "0.08em",
              color: "#111111",
            }}
          >
            VISA
          </div>

          {/* Dolby Atmos */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 900,
              fontSize: "1.15rem",
              color: "#111111",
            }}
          >
            <div
              style={{
                width: 14,
                height: 18,
                borderLeft: "4px solid #111111",
                borderRight: "4px solid #111111",
              }}
            />
            <span>DOLBY ATMOS</span>
          </div>

          {/* IMAX */}
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.35rem",
              letterSpacing: "0.15em",
              color: "#111111",
            }}
          >
            IMAX
          </div>

          {/* Christie Digital */}
          <div
            style={{
              fontWeight: 800,
              fontSize: "1.15rem",
              letterSpacing: "0.06em",
              color: "#111111",
            }}
          >
            CHRISTIE
          </div>

          {/* Barco */}
          <div
            style={{
              fontWeight: 900,
              fontSize: "1.25rem",
              letterSpacing: "0.08em",
              color: "#111111",
            }}
          >
            BARCO
          </div>
        </div>
      </section>

      {/* ======================================================================
          F. APP PROMO BANNER (Solid Black Card with 3D Overlapping Monitor)
          ====================================================================== */}
      <section
        id="docs"
        style={{
          ...CONTAINER_STYLE,
          margin: "0 auto 120px auto",
          padding: 0,
        }}
      >
        <div
          style={{
            background: "#111111",
            borderRadius: "40px",
            padding: "54px 54px 40px 54px",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 32,
            alignItems: "center",
            position: "relative",
            minHeight: 320,
          }}
        >
          {/* Left Side: Copy + White Pill Button */}
          <div>
            <h2
              style={{
                fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.15,
                marginBottom: 20,
                maxWidth: 440,
              }}
            >
              Manage Multi-Screen Operations from Anywhere
            </h2>

            <p
              style={{
                fontSize: "1.05rem",
                color: "#A0A0A0",
                lineHeight: 1.6,
                maxWidth: 420,
                marginBottom: 32,
              }}
            >
              From the projection booth to the executive suite, track real-time admissions, monitor
              concession POS attach rates, and audit ticket scans across all locations on any
              device.
            </p>

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              style={{
                background: "#FFFFFF",
                color: "#111111",
                border: "none",
                borderRadius: "999px",
                padding: "14px 28px",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(255, 255, 255, 0.2)",
              }}
            >
              <Ticket size={18} color="#111111" /> Onboard Your Cinema
            </button>
          </div>

          {/* Right Side: Mockup Card Overflowing the Bottom Edge */}
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                width: 300,
                background: "#FFFFFF",
                borderRadius: "28px",
                padding: "24px 20px",
                color: "#111111",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
                transform: "translateY(40px)",
                border: "1px solid #EBEBEB",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#888888", textTransform: "uppercase" }}>
                Multi-Screen Daily Gross
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: 2 }}>
                KES 1,698,830.00
              </div>

              <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
                <span
                  style={{
                    background: "#111111",
                    color: "#FFFFFF",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "4px 12px",
                  }}
                >
                  Daily Settlement
                </span>
                <span
                  style={{
                    background: "#F2F3F5",
                    color: "#555555",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    borderRadius: "999px",
                    padding: "4px 12px",
                  }}
                >
                  M-Pesa Sweep
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}
                >
                  <span style={{ fontWeight: 600 }}>Screen 1 (IMAX)</span>
                  <span style={{ fontWeight: 700 }}>KES 688,200</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}
                >
                  <span style={{ fontWeight: 600 }}>Screen 2 (3D ScreenX)</span>
                  <span style={{ fontWeight: 700 }}>KES 492,700</span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}
                >
                  <span style={{ fontWeight: 600 }}>Screen 3 (VIP Velvet)</span>
                  <span style={{ fontWeight: 700 }}>KES 517,930</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          G. FEATURES SECTION 2: Real-Time Rails (Alternating Staggered Rows)
          ====================================================================== */}
      <section
        style={{
          ...CONTAINER_STYLE,
          margin: "0 auto 100px auto",
          padding: 0,
        }}
      >
        {/* Row 1: Frictionless M-Pesa Checkouts & 0.5s QR Admission */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
            marginBottom: 90,
          }}
        >
          {/* Left Visual: Black UI card + Lime accent blob */}
          <div
            style={{ position: "relative", minHeight: 280, display: "flex", alignItems: "center" }}
          >
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 140,
                height: 140,
                borderRadius: "40px",
                background: "#D4FF00",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: 320,
                background: "#111113",
                borderRadius: "28px",
                padding: "24px",
                color: "#FFFFFF",
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.12)",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}
              >
                <span style={{ color: "#AAAAAA" }}>STK Push Conversion</span>
                <span style={{ color: "#D4FF00", fontWeight: 700 }}>98.4%</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: 4 }}>
                Avg Checkout: 4.2s
              </div>

              <div style={{ height: 80, margin: "14px 0" }}>
                <svg width="100%" height="100%" viewBox="0 0 260 70" fill="none">
                  <path
                    d="M5 50 C40 30, 70 60, 110 20 C150 -10, 190 40, 240 10"
                    stroke="#D4FF00"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="240" cy="10" r="4" fill="#D4FF00" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Text */}
          <div>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#111111", marginBottom: 16 }}>
              Frictionless M-Pesa Checkouts & 0.5s QR Admission
            </h2>
            <p style={{ color: "#555555", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 440 }}>
              No more payment drop-offs or box office queues. Moviegoers receive an instant M-Pesa
              STK push prompt directly on their phone, issuing cryptographically signed QR tickets
              that scan in under 0.5 seconds at your theater doors.
            </p>
          </div>
        </div>

        {/* Row 2: Distributed Concurrency & High-Traffic Seat Protection */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Left Text */}
          <div>
            <h2 style={{ fontSize: "2.4rem", fontWeight: 800, color: "#111111", marginBottom: 16 }}>
              Distributed Concurrency & High-Traffic Seat Protection
            </h2>
            <p style={{ color: "#555555", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: 440 }}>
              High-traffic premier releases cause heavy box office stampedes. Our distributed Redis
              locking engine enforces a strict 7-minute seat hold TTL, ensuring zero double-bookings
              even during blockbuster midnight releases.
            </p>
          </div>

          {/* Right Visual: Seat status items on Top of Massive Lime Blob with Squiggly Lines */}
          <div
            style={{
              position: "relative",
              minHeight: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Massive Lime Blob extending from right */}
            <div
              style={{
                position: "absolute",
                right: -40,
                width: 380,
                height: 280,
                borderRadius: "50px",
                background: "#D4FF00",
                zIndex: 0,
              }}
            />

            {/* Connecting squiggly line */}
            <svg
              width="240"
              height="200"
              viewBox="0 0 240 200"
              fill="none"
              style={{ position: "absolute", zIndex: 1, pointerEvents: "none" }}
            >
              <path
                d="M40 30 C120 70, 20 120, 160 170"
                stroke="#111111"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Seat Status Cards */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: 290,
              }}
            >
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "12px 18px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Clock size={16} color="#EAB308" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Seat E14 (VIP)</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>KES 1,200</div>
                  <div style={{ fontSize: "0.7rem", color: "#EAB308", fontWeight: 600 }}>
                    06:42 TTL
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "12px 18px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginLeft: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Clock size={16} color="#EAB308" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Seat E15 (VIP)</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>KES 1,200</div>
                  <div style={{ fontSize: "0.7rem", color: "#EAB308", fontWeight: 600 }}>
                    06:42 TTL
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "18px",
                  padding: "12px 18px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginLeft: -10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ShieldCheck size={16} color="#05C46B" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Seat F08 (Regular)</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>KES 900</div>
                  <div style={{ fontSize: "0.7rem", color: "#05C46B", fontWeight: 600 }}>
                    Confirmed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          H. PRE-FOOTER CTA (Centered)
          ====================================================================== */}
      <section
        style={{
          ...CONTAINER_STYLE,
          margin: "0 auto 100px auto",
          padding: 0,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          Ready to Modernize Your Cinema's Box Office?
        </h2>

        <p
          style={{
            color: "#555555",
            fontSize: "1.05rem",
            lineHeight: 1.6,
            maxWidth: 540,
            margin: "0 auto 28px auto",
          }}
        >
          Join Kenya's leading cinema exhibitors. Launch your branded online booking engine,
          automated M-Pesa payouts, and multi-screen management in 5 minutes.
        </p>

        <button
          type="button"
          onClick={() => setIsWizardOpen(true)}
          style={{
            background: "#111111",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "999px",
            padding: "16px 36px",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Film size={20} color="#D4FF00" /> Onboard Your Cinema
        </button>
      </section>

      {/* ======================================================================
          I. FOOTER (Solid Black with 4 Columns & Lime Submit Button)
          ====================================================================== */}
      <footer
        style={{
          background: "#111111",
          color: "#A0A0A0",
          padding: "70px 32px 40px 32px",
          borderTopLeftRadius: "36px",
          borderTopRightRadius: "36px",
        }}
      >
        <div
          style={{
            ...CONTAINER_STYLE,
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr 1.3fr",
            gap: 48,
            marginBottom: 50,
          }}
        >
          {/* Col 1: Logo */}
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <span
                style={{
                  fontFamily: "var(--font-family-display)",
                  fontWeight: 800,
                  fontSize: "1.4rem",
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Afri
                <span style={{ position: "relative", display: "inline-block" }}>
                  c
                  <span
                    style={{
                      position: "absolute",
                      top: "30%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#D4FF00",
                    }}
                  />
                </span>
                <span style={{ fontWeight: 800 }}>inemas</span>
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6, maxWidth: 260, color: "#888888" }}>
              The high-concurrency multi-tenant cinema management and digital ticketing SaaS
              platform for East Africa.
            </p>
          </div>

          {/* Col 2: Solutions */}
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 16 }}>
              Solutions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem" }}>
              <a href="#features" style={{ color: "#A0A0A0" }}>
                Auditorium Engine
              </a>
              <a href="#features" style={{ color: "#A0A0A0" }}>
                Dynamic Pricing
              </a>
              <a href="#escrow" style={{ color: "#A0A0A0" }}>
                Concession POS
              </a>
              <a href="#escrow" style={{ color: "#A0A0A0" }}>
                Distributor Split Reports
              </a>
            </div>
          </div>

          {/* Col 3: Operators */}
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 16 }}>
              Operators
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem" }}>
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  setIsWizardOpen(true);
                }}
                style={{ color: "#A0A0A0" }}
              >
                Self-Service Onboarding
              </a>
              <a href="#auditoriums" style={{ color: "#A0A0A0" }}>
                Operator Console
              </a>
              <a href="#auditoriums" style={{ color: "#A0A0A0" }}>
                Subdomain Routing
              </a>
              <a
                href="http://localhost:8000/api/v1/health/"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#A0A0A0" }}
              >
                API Health & Docs
              </a>
            </div>
          </div>

          {/* Col 4: Subscribe */}
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 16 }}>
              Cinema Industry Insights
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                type="email"
                placeholder="Your operator e-mail"
                style={{
                  background: "#222226",
                  border: "1px solid #333338",
                  borderRadius: "999px",
                  padding: "12px 18px",
                  fontSize: "0.85rem",
                  color: "#FFFFFF",
                  flex: 1,
                  outline: "none",
                }}
              />
              <button
                type="button"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "#D4FF00",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#111111",
                }}
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: 14, color: "#FFFFFF" }}>
              <Facebook size={18} style={{ cursor: "pointer" }} />
              <Twitter size={18} style={{ cursor: "pointer" }} />
              <Youtube size={18} style={{ cursor: "pointer" }} />
            </div>
          </div>
        </div>

        <div
          style={{
            ...CONTAINER_STYLE,
            borderTop: "1px solid #222226",
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.8rem",
            color: "#666666",
          }}
        >
          <div>© {new Date().getFullYear()} Africinemas SaaS Platform. All rights reserved.</div>
          <div>Phase 1 Multi-Tenant Tenant Onboarding Engine Active</div>
        </div>
      </footer>

      {/* Interactive Registration Wizard Modal */}
      <RegistrationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* Real-time Provisioning Status Modal */}
      <ProvisioningStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        cinemaSlug={provisioningSlug}
        initialStatus={initialStatus}
      />
    </div>
  );
};

export default App;
