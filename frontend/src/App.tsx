import React, { useState, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { AuthPage } from "./features/auth/AuthPage";
import { RegistrationWizard } from "./features/onboarding/RegistrationWizard";
import { ProvisioningStatusModal } from "./features/onboarding/ProvisioningStatusModal";
import { ProvisioningStatusResponse } from "./types/onboarding";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"landing" | "auth">("landing");
  const [authInitialMode, setAuthInitialMode] = useState<"signup" | "signin">("signup");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [provisioningSlug, setProvisioningSlug] = useState("westgate");
  const [initialStatus, setInitialStatus] = useState<ProvisioningStatusResponse | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === "/login" || path === "/signin") {
      setAuthInitialMode("signin");
      setCurrentView("auth");
    } else if (path === "/signup" || path === "/register" || path === "/onboard") {
      setAuthInitialMode("signup");
      setCurrentView("auth");
    }
  }, []);

  const openAuth = (mode: "signup" | "signin") => {
    setAuthInitialMode(mode);
    setCurrentView("auth");
  };

  const handleRegistrationSuccess = (response: ProvisioningStatusResponse) => {
    setIsWizardOpen(false);
    setProvisioningSlug(response.cinema_slug);
    setInitialStatus(response);
    setIsStatusModalOpen(true);
  };

  if (currentView === "auth") {
    return (
      <>
        <AuthPage
          initialMode={authInitialMode}
          onBackToHome={() => setCurrentView("landing")}
          onSuccess={handleRegistrationSuccess}
        />
        <ProvisioningStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          cinemaSlug={provisioningSlug}
          initialStatus={initialStatus}
        />
      </>
    );
  }

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
      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .landing-container {
          max-width: 1360px;
          width: calc(100% - 116px);
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          .landing-container {
            width: calc(100% - 48px);
          }
        }
        @media (max-width: 640px) {
          .landing-container {
            width: calc(100% - 32px);
          }
        }

        .landing-section {
          margin: 0 auto 100px auto;
          padding: 0;
        }
        @media (max-width: 768px) {
          .landing-section {
            margin: 0 auto 60px auto;
          }
        }

        .landing-header-inner {
          padding: 16px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-desktop-nav {
          display: flex;
          align-items: center;
          gap: 32px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #555555;
        }
        .landing-desktop-nav a {
          text-decoration: none;
          color: #555555;
          transition: color 150ms ease;
        }
        .landing-desktop-nav a:hover {
          color: #111111;
        }

        .landing-login-btn {
          background: none;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          color: #555555;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 150ms ease, background-color 150ms ease;
        }
        .landing-login-btn:hover {
          color: #111111;
          background: #F2F3F5;
        }

        .landing-desktop-cta {
          background: #111111;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        .landing-desktop-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
        }

        .landing-mobile-menu-btn {
          display: none;
          background: #F2F3F5;
          border: 1px solid #E0E2E6;
          border-radius: 10px;
          padding: 8px;
          cursor: pointer;
          color: #111111;
          align-items: center;
          justify-content: center;
          transition: background-color 150ms ease;
        }
        .landing-mobile-menu-btn:hover {
          background: #E5E7EB;
        }

        @media (max-width: 991px) {
          .landing-desktop-nav {
            display: none;
          }
          .landing-desktop-cta {
            display: none;
          }
          .landing-mobile-menu-btn {
            display: flex;
          }
        }

        .landing-mobile-drawer {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border-top: 1px solid #EBEBEB;
          border-bottom: 1px solid #EBEBEB;
          padding: 18px 24px;
          gap: 14px;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          animation: drawerSlide 180ms ease-out;
        }
        @keyframes drawerSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .landing-mobile-link {
          text-decoration: none;
          color: #222222;
          font-size: 1rem;
          font-weight: 600;
          padding: 8px 0;
          border-bottom: 1px solid #F2F3F5;
        }
        .landing-mobile-cta {
          background: #111111;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 6px;
        }

        /* Hero */
        .landing-hero-section {
          margin: 28px auto 90px auto;
          padding: 0;
          position: relative;
        }
        @media (max-width: 768px) {
          .landing-hero-section {
            margin: 16px auto 60px auto;
          }
        }
        .landing-hero-grid {
          display: grid;
          grid-template-columns: 1.06fr 0.94fr;
          gap: 28px;
          align-items: stretch;
        }
        .landing-hero-lime-card {
          background: #D4FF00;
          border-radius: 40px;
          padding: 54px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          min-height: 560px;
          box-sizing: border-box;
        }
        .landing-hero-mockup-wrapper {
          position: relative;
          min-height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
        .landing-mockup-back {
          position: absolute;
          right: 0;
          top: 15px;
          width: 345px;
          background: #161619;
          border-radius: 32px;
          padding: 24px 20px;
          color: #FFFFFF;
          box-shadow: 0 22px 46px rgba(0, 0, 0, 0.16);
          transform: rotate(4deg) scale(0.98);
          z-index: 1;
          transition: transform 250ms ease;
        }
        .landing-mockup-back:hover {
          transform: rotate(2deg) scale(1);
        }
        .landing-mockup-front {
          position: absolute;
          left: 8px;
          bottom: 12px;
          width: 360px;
          background: #FFFFFF;
          border-radius: 32px;
          padding: 24px 22px;
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.09);
          border: 1px solid #EBEBEB;
          z-index: 2;
          transition: transform 250ms ease, box-shadow 250ms ease;
        }
        .landing-mockup-front:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 56px rgba(0, 0, 0, 0.12);
        }
        @media (max-width: 991px) {
          .landing-hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .landing-hero-lime-card {
            min-height: auto;
            padding: 40px 28px;
            border-radius: 28px;
          }
          .landing-hero-mockup-wrapper {
            min-height: 520px;
            width: 100%;
            max-width: 440px;
            margin: 0 auto;
          }
        }
        @media (max-width: 480px) {
          .landing-hero-lime-card {
            padding: 32px 20px;
            border-radius: 24px;
          }
          .landing-hero-mockup-wrapper {
            min-height: 480px;
            max-width: 100%;
          }
          .landing-mockup-back {
            width: 92%;
            right: 0;
            top: 5px;
            padding: 20px 16px;
            transform: rotate(2deg) scale(0.96);
          }
          .landing-mockup-front {
            width: 94%;
            left: 3%;
            bottom: 5px;
            padding: 20px 16px;
          }
        }

        /* Section Headings */
        .landing-section-heading {
          font-family: var(--font-family-display);
          font-size: clamp(2rem, 3.8vw, 2.8rem);
          font-weight: 800;
          color: #111111;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
          line-height: 1.15;
        }
        .landing-section-subtext {
          color: #555555;
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 520px;
        }

        /* Features 1 */
        .landing-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .landing-feature-card {
          background: #FFFFFF;
          border-radius: 28px;
          padding: 40px 36px;
          border: 1px solid #EBEBEB;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 280px;
          position: relative;
          overflow: hidden;
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .landing-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.06);
        }
        @media (max-width: 860px) {
          .landing-features-grid {
            grid-template-columns: 1fr;
          }
          .landing-feature-card {
            padding: 32px 24px;
            border-radius: 22px;
          }
        }

        /* Advantages */
        .landing-advantages-grid {
          display: grid;
          grid-template-columns: 0.75fr 1.25fr;
          gap: 48px;
        }
        .landing-advantages-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .landing-advantage-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #EBEBEB;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .landing-advantage-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
        }
        @media (max-width: 991px) {
          .landing-advantages-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        @media (max-width: 640px) {
          .landing-advantages-cards {
            grid-template-columns: 1fr;
          }
          .landing-advantage-card {
            padding: 24px 20px;
          }
        }

        /* Banner */
        .landing-banner-grid {
          background: radial-gradient(circle at 82% 40%, rgba(212, 255, 0, 0.12) 0%, rgba(17, 17, 17, 0) 60%), #111111;
          border: 1px solid rgba(212, 255, 0, 0.22);
          border-radius: 40px;
          padding: 54px 54px 40px 54px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 32px;
          align-items: center;
          position: relative;
          min-height: 320px;
          box-sizing: border-box;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
        }
        .landing-banner-mockup-col {
          position: relative;
          display: flex;
          justify-content: flex-end;
        }
        .landing-banner-mockup {
          width: 320px;
          background: #18181C;
          border-radius: 28px;
          padding: 26px 22px;
          color: #FFFFFF;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(212, 255, 0, 0.08);
          transform: translateY(40px);
          border: 1px solid rgba(212, 255, 0, 0.28);
          transition: transform 250ms ease, box-shadow 250ms ease;
        }
        .landing-banner-mockup:hover {
          transform: translateY(34px);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.75), 0 0 50px rgba(212, 255, 0, 0.16);
        }
        .landing-banner-btn {
          background: #D4FF00;
          color: #111111;
          border: none;
          border-radius: 999px;
          padding: 14px 28px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(212, 255, 0, 0.35);
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .landing-banner-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(212, 255, 0, 0.5);
        }
        @media (max-width: 991px) {
          .landing-banner-grid {
            grid-template-columns: 1fr;
            padding: 36px 24px;
            border-radius: 28px;
          }
          .landing-banner-mockup-col {
            justify-content: center;
            margin-top: 16px;
          }
          .landing-banner-mockup {
            transform: translateY(0);
            width: 100%;
            max-width: 320px;
          }
          .landing-banner-mockup:hover {
            transform: translateY(-3px);
          }
        }

        /* Rails */
        .landing-rails-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
          margin-bottom: 90px;
        }
        .landing-rails-row-reverse {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .landing-rails-blob-wrapper {
          position: relative;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 32px;
        }
        @media (max-width: 991px) {
          .landing-rails-row {
            grid-template-columns: 1fr;
            gap: 32px;
            margin-bottom: 60px;
          }
          .landing-rails-row-reverse {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }

        /* Footer */
        .landing-footer {
          background: #111111;
          color: #A0A0A0;
          padding: 70px 32px 40px 32px;
          border-top-left-radius: 36px;
          border-top-right-radius: 36px;
          box-sizing: border-box;
        }
        .landing-footer-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr 1.3fr;
          gap: 48px;
          margin-bottom: 50px;
        }
        .landing-subfooter {
          border-top: 1px solid #222226;
          padding-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #666666;
        }
        @media (max-width: 991px) {
          .landing-footer {
            padding: 50px 20px 32px 20px;
            border-top-left-radius: 28px;
            border-top-right-radius: 28px;
          }
          .landing-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
          }
          .landing-subfooter {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
        @media (max-width: 600px) {
          .landing-footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>

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
        <div className="landing-container landing-header-inner">
          {/* Logo (Left): "Africinemas" with tiny lime green dot */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
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
          <nav className="landing-desktop-nav">
            <a href="#features" style={{ color: "#111111", fontWeight: 600 }}>
              Features
            </a>
            <a href="#auditoriums">Auditoriums</a>
            <a href="#escrow">Escrow Rails</a>
            <a href="#docs">Developer Docs</a>
          </nav>

          {/* Actions (Right) */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button type="button" onClick={() => openAuth("signin")} className="landing-login-btn">
              Operator Log In
            </button>
            <button
              type="button"
              onClick={() => openAuth("signup")}
              className="landing-desktop-cta"
            >
              <Film size={18} color="#D4FF00" /> Onboard Your Cinema
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="landing-mobile-menu-btn"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="landing-mobile-drawer">
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-mobile-link"
            >
              Features
            </a>
            <a
              href="#auditoriums"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-mobile-link"
            >
              Auditoriums
            </a>
            <a
              href="#escrow"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-mobile-link"
            >
              Escrow Rails
            </a>
            <a
              href="#docs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="landing-mobile-link"
            >
              Developer Docs
            </a>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openAuth("signup");
              }}
              className="landing-mobile-cta"
            >
              <Film size={18} color="#D4FF00" /> Onboard Your Cinema
            </button>
          </div>
        )}
      </header>

      {/* ======================================================================
          B. HERO SECTION
          ====================================================================== */}
      <section id="hero" className="landing-container landing-hero-section">
        <div className="landing-hero-grid">
          {/* Left Column: Massive Vibrant Lime-Green Organic Container */}
          <div className="landing-hero-lime-card">
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
                onClick={() => openAuth("signup")}
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
          <div className="landing-hero-mockup-wrapper">
            {/* Back Mockup (Offset Dark UI Card - Executive Box Office Console) */}
            <div className="landing-mockup-back">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Film size={16} color="#D4FF00" />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    Apex Cinema Multiplex — Console
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
              <div style={{ fontSize: "1.45rem", fontWeight: 800, marginTop: 2, color: "#FFFFFF" }}>
                KES 486,200.00
              </div>
              <div style={{ fontSize: "0.75rem", color: "#05C46B", fontWeight: 600 }}>
                +18.4% vs last Friday
              </div>

              {/* Glowing Line Chart */}
              <div style={{ height: 75, margin: "14px 0", position: "relative" }}>
                <svg width="100%" height="100%" viewBox="0 0 280 75" fill="none">
                  <path
                    d="M0 55 C30 45, 60 65, 90 35 C120 10, 150 45, 190 18 C230 -8, 250 25, 280 12"
                    stroke="#D4FF00"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="280" cy="12" r="5" fill="#D4FF00" />
                </svg>
              </div>

              {/* Clean Telemetry Metrics */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  borderTop: "1px solid #2B2B30",
                  paddingTop: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#888888" }}>Admissions</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#FFFFFF" }}>
                    1,892 Seats Sold
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "#888888" }}>Escrow Settlement</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#05C46B" }}>
                    KES 437,580
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                  fontSize: "0.72rem",
                  color: "#888888",
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingTop: 8,
                }}
              >
                <span>Concurrency Guard</span>
                <span style={{ color: "#D4FF00", fontWeight: 700 }}>0 Double-Bookings</span>
              </div>
            </div>

            {/* Front Mockup (Pure White UI Card - Operator Live Screen & Box Office Console) */}
            <div className="landing-mockup-front">
              {/* Header: Cinema Name + Active Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#111111" }}>
                    Premier Cinema Multiplex
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#666666", fontWeight: 500 }}>
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
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
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
                  Screen 1 (IMAX Laser)
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
                  Screen 2
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
                  Screen 3
                </span>
              </div>

              {/* Active Screen Monitor Card */}
              <div
                style={{
                  background: "#111113",
                  color: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#AAAAAA" }}>
                    Screen 1: Evening Screening
                  </div>
                  <div
                    style={{
                      fontSize: "1.2rem",
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
                    border: "2px solid #D4FF00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={16} color="#D4FF00" />
                </div>
              </div>

              {/* Operator Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  style={{
                    background: "#F2F3F5",
                    color: "#111111",
                    border: "1px solid #E0E2E6",
                    borderRadius: "999px",
                    padding: "10px 8px",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                  }}
                >
                  Adjust Seating Tiers
                </button>
                <button
                  type="button"
                  onClick={() => openAuth("signup")}
                  style={{
                    background: "#D4FF00",
                    color: "#111111",
                    border: "none",
                    borderRadius: "999px",
                    padding: "10px 8px",
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
      <section id="features" className="landing-container landing-section">
        <h2 className="landing-section-heading" style={{ maxWidth: 560, marginBottom: 36 }}>
          Engineered for High-Yield
          <br />
          Theater Operations
        </h2>

        <div className="landing-features-grid">
          {/* Card 1: Dynamic Seating & Multi-Auditorium Engine */}
          <div className="landing-feature-card">
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
                onClick={() => openAuth("signup")}
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
          <div className="landing-feature-card">
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
                onClick={() => openAuth("signup")}
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
      <section id="auditoriums" className="landing-container landing-section">
        <div className="landing-advantages-grid">
          {/* Left Column (30%) */}
          <div>
            <h2 className="landing-section-heading">
              Platform
              <br />
              Advantages
            </h2>
            <p className="landing-section-subtext" style={{ maxWidth: 320 }}>
              Engineered in consultation with Kenyan cinema exhibitors to eliminate box office
              friction, queue bottlenecks, and revenue leakage.
            </p>
          </div>

          {/* Right Column (70% - 2x2 Grid) */}
          <div className="landing-advantages-cards">
            {/* Item 1: 5-Minute Tenant Provisioning */}
            <div className="landing-advantage-card">
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
                subdomain (e.g. apex.africinemas.com), and booking engine in under 5 minutes.
              </p>
              <button
                type="button"
                onClick={() => openAuth("signup")}
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
            <div className="landing-advantage-card">
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
                onClick={() => openAuth("signup")}
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
            <div className="landing-advantage-card">
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
                onClick={() => openAuth("signup")}
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
            <div className="landing-advantage-card">
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
                onClick={() => openAuth("signup")}
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
        className="landing-container landing-section"
        style={{ textAlign: "center" }}
      >
        <h2 className="landing-section-heading">Ecosystem Partners</h2>
        <p className="landing-section-subtext" style={{ margin: "0 auto 44px auto" }}>
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
      <section id="docs" className="landing-container landing-section">
        <div className="landing-banner-grid">
          {/* Left Side: Copy + Lime Pill Button */}
          <div>
            <h2
              style={{
                fontFamily: "var(--font-family-display)",
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

            <button type="button" onClick={() => openAuth("signup")} className="landing-banner-btn">
              <Ticket size={18} color="#111111" /> Onboard Your Cinema
            </button>
          </div>

          {/* Right Side: Mockup Card Overflowing the Bottom Edge */}
          <div className="landing-banner-mockup-col">
            <div className="landing-banner-mockup">
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#FFFFFF" }}>
                <span style={{ color: "#D4FF00", fontSize: "1.1rem", marginRight: 4 }}>KES</span>
                1,698,830.00
              </div>

              <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
                <span
                  style={{
                    background: "#D4FF00",
                    color: "#111111",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    borderRadius: "999px",
                    padding: "4px 12px",
                    boxShadow: "0 2px 10px rgba(212, 255, 0, 0.28)",
                  }}
                >
                  Daily Settlement
                </span>
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    color: "#AAAAAA",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
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
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    paddingTop: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#CCCCCC" }}>Screen 1 (IMAX)</span>
                  <span style={{ fontWeight: 700, color: "#D4FF00" }}>KES 688,200</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    paddingTop: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#CCCCCC" }}>Screen 2 (3D ScreenX)</span>
                  <span style={{ fontWeight: 700, color: "#D4FF00" }}>KES 492,700</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    paddingTop: 8,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#CCCCCC" }}>Screen 3 (VIP Velvet)</span>
                  <span style={{ fontWeight: 700, color: "#D4FF00" }}>KES 517,930</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
          G. FEATURES SECTION 2: Real-Time Rails (Alternating Staggered Rows)
          ====================================================================== */}
      <section className="landing-container landing-section">
        {/* Row 1: Frictionless M-Pesa Checkouts & 0.5s QR Admission */}
        <div className="landing-rails-row">
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
            <h2 className="landing-section-heading" style={{ marginBottom: 16 }}>
              Frictionless M-Pesa Checkouts & 0.5s QR Admission
            </h2>
            <p className="landing-section-subtext" style={{ maxWidth: 440 }}>
              No more payment drop-offs or box office queues. Moviegoers receive an instant M-Pesa
              STK push prompt directly on their phone, issuing cryptographically signed QR tickets
              that scan in under 0.5 seconds at your theater doors.
            </p>
          </div>
        </div>

        {/* Row 2: Distributed Concurrency & High-Traffic Seat Protection */}
        <div className="landing-rails-row-reverse">
          {/* Left Text */}
          <div>
            <h2 className="landing-section-heading" style={{ marginBottom: 16 }}>
              Distributed Concurrency & High-Traffic Seat Protection
            </h2>
            <p className="landing-section-subtext" style={{ maxWidth: 440 }}>
              High-traffic premier releases cause heavy box office stampedes. Our distributed Redis
              locking engine enforces a strict 7-minute seat hold TTL, ensuring zero double-bookings
              even during blockbuster midnight releases.
            </p>
          </div>

          {/* Right Visual: Seat status items on Top of Massive Lime Blob with Squiggly Lines */}
          <div className="landing-rails-blob-wrapper">
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
      <section className="landing-container landing-section" style={{ textAlign: "center" }}>
        <h2 className="landing-section-heading">Ready to Modernize Your Cinema's Box Office?</h2>

        <p
          className="landing-section-subtext"
          style={{ margin: "0 auto 28px auto", maxWidth: 540 }}
        >
          Join Kenya's leading cinema exhibitors. Launch your branded online booking engine,
          automated M-Pesa payouts, and multi-screen management in 5 minutes.
        </p>

        <button
          type="button"
          onClick={() => openAuth("signup")}
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
      <footer className="landing-footer">
        <div className="landing-container landing-footer-grid">
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
                  openAuth("signup");
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

        <div className="landing-container landing-subfooter">
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
