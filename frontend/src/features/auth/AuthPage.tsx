import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
  Building2,
  Globe,
  AlertCircle,
} from "lucide-react";
import { CinemaRow3DAnimation } from "./CinemaRow3DAnimation";
import { checkSubdomainAvailability, registerCinema } from "../../api/onboarding";
import { ProvisioningStatusResponse } from "../../types/onboarding";

const signupSchema = z.object({
  cinema_name: z
    .string()
    .min(2, "Cinema name must be at least 2 characters")
    .max(100, "Cinema name too long"),
  slug: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain maximum 30 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  email: z.string().email("Please enter a valid work email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must include at least one uppercase letter")
    .regex(/[0-9]/, "Must include at least one number"),
});

const signinSchema = z.object({
  identifier: z.string().min(1, "Please enter your email or cinema subdomain"),
  password: z.string().min(1, "Please enter your password"),
});

type SignupFormData = z.infer<typeof signupSchema>;
type SigninFormData = z.infer<typeof signinSchema>;

interface AuthPageProps {
  initialMode?: "signup" | "signin";
  onBackToHome: () => void;
  onSuccess: (status: ProvisioningStatusResponse) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "signup",
  onBackToHome,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    watch: watchSignup,
    setValue: setSignupValue,
    formState: { errors: signupErrors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      cinema_name: "",
      slug: "",
      email: "",
      password: "",
    },
  });

  // Signin form
  const {
    register: registerSignin,
    handleSubmit: handleSigninSubmit,
    formState: { errors: signinErrors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    mode: "onBlur",
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const cinemaName = watchSignup("cinema_name");
  const currentSlug = watchSignup("slug");
  const currentPassword = watchSignup("password") || "";

  // Auto-generate subdomain slug from cinema name
  useEffect(() => {
    if (cinemaName && mode === "signup") {
      const generated = cinemaName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 30);
      if (!currentSlug || currentSlug === generated.slice(0, currentSlug.length)) {
        setSignupValue("slug", generated, { shouldValidate: true });
      }
    }
  }, [cinemaName, mode, currentSlug, setSignupValue]);

  // Debounced live subdomain check
  useEffect(() => {
    if (!currentSlug || currentSlug.length < 3) {
      setSlugAvailable(null);
      setSlugMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await checkSubdomainAvailability(currentSlug);
        setSlugAvailable(res.is_available);
        setSlugMessage(
          res.is_available
            ? `${res.subdomain}.africinemas.com is available!`
            : `${res.subdomain}.africinemas.com is already registered`
        );
      } catch {
        const isValid = /^[a-z0-9-]+$/.test(currentSlug);
        if (isValid) {
          setSlugAvailable(true);
          setSlugMessage(`${currentSlug}.africinemas.com is available!`);
        } else {
          setSlugAvailable(false);
          setSlugMessage("Subdomain can only contain lowercase letters, numbers, and hyphens");
        }
      } finally {
        setIsCheckingSlug(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [currentSlug]);

  const onSignup = async (data: SignupFormData) => {
    if (slugAvailable === false) {
      setSubmissionError("Please choose an available subdomain");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const status = await registerCinema(
        {
          cinema_name: data.cinema_name,
          slug: data.slug,
          city: "Nairobi",
          address: "Central Business District",
          contact_phone: "+254700000000",
          first_name: data.cinema_name.split(" ")[0] || "Cinema",
          last_name: "Admin",
          email: data.email,
          phone_number: "+254700000000",
          password: data.password,
          password_confirm: data.password,
          primary_color: "#D4FF00",
          secondary_color: "#08090D",
          accent_color: "#D4FF00",
        },
        idempotencyKey
      );
      onSuccess(status);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error && "response" in err
          ? // @ts-expect-error Axios error typing
            err.response?.data?.message || err.message
          : "Registration failed. Please check your credentials and try again.";
      setSubmissionError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignin = async (data: SigninFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    // Mock operator login simulation
    setTimeout(() => {
      setIsSubmitting(false);
      const slug = data.identifier.includes("@") ? data.identifier.split("@")[0] : data.identifier;
      onSuccess({
        cinema_slug: slug,
        status: "READY",
        progress_percent: 100,
        current_step: "Provisioning completed",
        domain_url: `http://${slug}.localhost:5173`,
        created_at: new Date().toISOString(),
      });
    }, 1000);
  };

  return (
    <div className="auth-page-root">
      <style>{`
        .auth-page-root {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow-x: hidden;
          box-sizing: border-box;
          background: #08090D;
        }

        /* ====================================================================
           MOBILE VIEW (< 992px): Video in background, Form overlay on top
           ==================================================================== */
        .auth-video-pane {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
        }
        .auth-video-pane::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(8, 9, 13, 0.42) 0%,
            rgba(8, 9, 13, 0.68) 45%,
            rgba(8, 9, 13, 0.92) 100%
          );
          pointer-events: none;
        }
        .auth-video-pane .cinema-video-container {
          border-radius: 0 !important;
          min-height: 100% !important;
          height: 100% !important;
        }

        .auth-form-pane {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          padding: 20px 16px;
          background: transparent;

          /* Mobile Dark Mode CSS Variables */
          --auth-brand-color: #FFFFFF;
          --auth-title-color: #FFFFFF;
          --auth-subtitle-color: #A0A0B2;
          --auth-label-color: #E6E6EF;
          --auth-input-bg: rgba(255, 255, 255, 0.08);
          --auth-input-border: rgba(255, 255, 255, 0.16);
          --auth-input-text: #FFFFFF;
          --auth-input-placeholder: #7E7E90;
          --auth-btn-bg: #D4FF00;
          --auth-btn-text: #08090D;
          --auth-sso-bg: rgba(255, 255, 255, 0.08);
          --auth-sso-border: rgba(255, 255, 255, 0.16);
          --auth-sso-text: #FFFFFF;
          --auth-back-link-color: #CCCCCC;
          --auth-back-link-bg: rgba(255, 255, 255, 0.08);
          --auth-back-link-border: rgba(255, 255, 255, 0.14);
          --auth-footer-color: #8E8E9F;
          --auth-mode-link-color: #D4FF00;
          --auth-icon-color: #A0A0B2;
        }

        .auth-card-container {
          width: 100%;
          max-width: 440px;
          margin: 12px auto;
          background: rgba(12, 13, 18, 0.78);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 24px 50px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(212, 255, 0, 0.06);
          border-radius: 20px;
          padding: 28px 24px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .auth-heading {
          font-family: var(--font-family-display);
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--auth-title-color);
          margin: 0;
          line-height: 1.18;
        }

        .auth-subtitle {
          font-size: 0.9rem;
          color: var(--auth-subtitle-color);
          margin-top: 8px;
          margin-bottom: 24px;
          line-height: 1.45;
        }

        /* Prevent auto-zoom on iOS mobile browsers */
        @media (max-width: 991px) {
          .auth-input-field {
            font-size: 16px !important;
          }
        }

        /* ====================================================================
           DESKTOP VIEW (>= 992px): Split Screen with White Form & Right Video
           ==================================================================== */
        @media (min-width: 992px) {
          .auth-page-root {
            display: grid;
            grid-template-columns: 1fr 1.08fr;
            background: #FFFFFF;
            height: 100vh;
            max-height: 100vh;
            overflow: hidden;
            position: fixed;
            inset: 0;
            width: 100vw;
          }

          .auth-video-pane {
            position: relative;
            width: 100%;
            height: 100vh;
            max-height: 100vh;
            min-height: 100vh;
            overflow: hidden;
            z-index: auto;
            pointer-events: auto;
            order: 2;
          }

          .auth-video-pane::after {
            display: none;
          }

          .auth-video-pane .cinema-video-container {
            border-top-left-radius: 48px !important;
            border-bottom-left-radius: 48px !important;
            height: 100vh !important;
            max-height: 100vh !important;
            min-height: 100vh !important;
            width: 100% !important;
            overflow: hidden !important;
          }

          .auth-form-pane {
            order: 1;
            background: #FFFFFF;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            padding: 36px 54px;
            height: 100vh;
            max-height: 100vh;
            min-height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.15) transparent;

            /* Desktop Light Mode Minimalist SaaS Variables */
            --auth-brand-color: #111111;
            --auth-title-color: #111111;
            --auth-subtitle-color: #666670;
            --auth-label-color: #111111;
            --auth-input-bg: #FFFFFF;
            --auth-input-border: #E5E7EB;
            --auth-input-text: #111111;
            --auth-input-placeholder: #9CA3AF;
            --auth-btn-bg: #D4FF00;
            --auth-btn-text: #08090D;
            --auth-sso-bg: #FFFFFF;
            --auth-sso-border: #D1D5DB;
            --auth-sso-text: #111111;
            --auth-back-link-color: #666666;
            --auth-back-link-bg: transparent;
            --auth-back-link-border: transparent;
            --auth-footer-color: #888892;
            --auth-mode-link-color: #111111;
            --auth-icon-color: #71717A;
          }

          .auth-form-pane::-webkit-scrollbar {
            width: 6px;
          }
          .auth-form-pane::-webkit-scrollbar-track {
            background: transparent;
          }
          .auth-form-pane::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.15);
            border-radius: 999px;
          }

          .auth-top-bar {
            margin-bottom: 20px;
            flex-shrink: 0;
            width: 100%;
          }

          .auth-card-container {
            max-width: 380px;
            width: 100%;
            margin: 0 auto;
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border: none;
            box-shadow: none;
            border-radius: 0;
            padding: 20px 0;
            flex: 1 0 auto;
          }

          .auth-bottom-footer {
            margin-top: auto;
            padding-top: 24px;
            flex-shrink: 0;
            width: 100%;
          }

          .auth-heading {
            font-size: 2.15rem;
          }

          .auth-subtitle {
            font-size: 0.95rem;
            margin-top: 10px;
            margin-bottom: 28px;
            line-height: 1.5;
          }
        }

        .auth-input-field {
          width: 100%;
          min-height: 46px;
          border-radius: 10px;
          font-size: 0.92rem;
          outline: none;
          box-sizing: border-box;
          background: var(--auth-input-bg);
          color: var(--auth-input-text);
          border: 1px solid var(--auth-input-border);
          transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
        }
        .auth-input-field:focus {
          border-color: #D4FF00 !important;
          box-shadow: 0 0 0 3px rgba(212, 255, 0, 0.28) !important;
        }
        .auth-input-field:hover:not(:focus) {
          border-color: #111111;
        }
        .auth-input-field::placeholder {
          color: var(--auth-input-placeholder);
        }

        .auth-submit-btn {
          width: 100%;
          min-height: 48px;
          background: var(--auth-btn-bg);
          color: var(--auth-btn-text);
          border: none;
          border-radius: 10px;
          padding: 13px 20px;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 18px rgba(212, 255, 0, 0.35);
          transition: transform 120ms ease, opacity 150ms ease, filter 150ms ease, box-shadow 150ms ease;
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.05);
          box-shadow: 0 8px 24px rgba(212, 255, 0, 0.55);
        }
        .auth-submit-btn:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 2px 10px rgba(212, 255, 0, 0.3);
        }

        .auth-google-btn {
          width: 100%;
          min-height: 46px;
          background: var(--auth-sso-bg);
          color: var(--auth-sso-text);
          border: 1px solid var(--auth-sso-border);
          border-radius: 10px;
          padding: 11px 20px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background-color 150ms ease, border-color 150ms ease, transform 120ms ease;
        }
        .auth-google-btn:hover {
          background: #F9FAFB;
          border-color: #111111;
          transform: translateY(-1px);
        }
        .auth-google-btn:active {
          transform: translateY(1px);
        }
      `}</style>

      {/* ======================================================================
          VIDEO SHOWCASE PANE: Right pane on Desktop, Fixed Background on Mobile
          ====================================================================== */}
      <div className="auth-video-pane">
        <CinemaRow3DAnimation />
      </div>

      {/* ======================================================================
          FORM PANE: Left pane on Desktop, Glass/Dark Scrim Overlay on Mobile
          ====================================================================== */}
      <div className="auth-form-pane">
        {/* Top Header: Brand Logo & Back Link */}
        <div
          className="auth-top-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            width: "100%",
          }}
        >
          {/* Logo with signature lime dot */}
          <div
            onClick={onBackToHome}
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <span
              style={{
                fontFamily: "var(--font-family-display)",
                fontWeight: 800,
                fontSize: "1.35rem",
                color: "var(--auth-brand-color)",
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

          <button
            type="button"
            onClick={onBackToHome}
            style={{
              background: "var(--auth-back-link-bg)",
              border: "1px solid var(--auth-back-link-border)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--auth-back-link-color)",
              cursor: "pointer",
              padding: "7px 12px",
              borderRadius: "8px",
              transition: "all 150ms ease",
            }}
          >
            <ArrowLeft size={16} /> Back to website
          </button>
        </div>

        {/* Center Container: Vertically Centered Modern Auth Card */}
        <div className="auth-card-container">
          {/* Headline & Subtitle */}
          <h1 className="auth-heading">
            {mode === "signup" ? "Create an account" : "Welcome back"}
          </h1>

          <p className="auth-subtitle">
            {mode === "signup"
              ? "Start your 30-day free cinema trial. No credit card required."
              : "Enter your operator credentials to access your cinema console."}
          </p>

          {/* Submission Error Banner */}
          {submissionError && (
            <div
              style={{
                background: "#111111",
                border: "1px solid #D4FF00",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#FFFFFF",
                fontSize: "0.82rem",
                marginBottom: 20,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
              }}
            >
              <AlertCircle size={16} color="#08090D" fill="#D4FF00" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* SIGN UP FORM */}
          {mode === "signup" && (
            <form
              onSubmit={handleSignupSubmit(onSignup)}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Cinema Name */}
              <div>
                <label
                  htmlFor="cinema_name"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--auth-label-color)",
                    marginBottom: 6,
                  }}
                >
                  Cinema / Company Name
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="cinema_name"
                    {...registerSignup("cinema_name")}
                    placeholder="e.g. Premier Cinema Multiplex"
                    className="auth-input-field"
                    style={{
                      padding: "12px 14px 12px 38px",
                      borderColor: signupErrors.cinema_name ? "#111111" : undefined,
                      boxShadow: signupErrors.cinema_name ? "0 0 0 1px #111111" : undefined,
                    }}
                  />
                  <Building2
                    size={16}
                    color="var(--auth-icon-color)"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                </div>
                {signupErrors.cinema_name && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#111111",
                      fontWeight: 600,
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} color="#08090D" fill="#D4FF00" />
                    {signupErrors.cinema_name.message}
                  </span>
                )}
              </div>

              {/* Subdomain Slug */}
              <div>
                <label
                  htmlFor="slug"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--auth-label-color)",
                    marginBottom: 6,
                  }}
                >
                  Custom Subdomain
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="slug"
                    {...registerSignup("slug")}
                    placeholder="yourcinema"
                    className="auth-input-field"
                    style={{
                      padding: "12px 120px 12px 38px",
                      borderColor: signupErrors.slug
                        ? "#111111"
                        : slugAvailable === true
                          ? "#111111"
                          : undefined,
                      boxShadow: signupErrors.slug ? "0 0 0 1px #111111" : undefined,
                    }}
                  />
                  <Globe
                    size={16}
                    color="var(--auth-icon-color)"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 13,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "var(--auth-subtitle-color)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    .africinemas.com
                    {isCheckingSlug ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : slugAvailable === true ? (
                      <Check size={14} color="#08090D" strokeWidth={3} />
                    ) : slugAvailable === false ? (
                      <X size={14} color="#08090D" strokeWidth={3} />
                    ) : null}
                  </span>
                </div>
                {slugMessage && (
                  <span
                    style={{
                      fontSize: "0.74rem",
                      color: "#111111",
                      fontWeight: 600,
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {slugAvailable ? (
                      <Check size={13} color="#08090D" strokeWidth={3} />
                    ) : (
                      <AlertCircle size={13} color="#08090D" fill="#D4FF00" />
                    )}
                    {slugMessage}
                  </span>
                )}
              </div>

              {/* Work Email */}
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--auth-label-color)",
                    marginBottom: 6,
                  }}
                >
                  Work Email
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="email"
                    type="email"
                    {...registerSignup("email")}
                    placeholder="operator@cinema.com"
                    className="auth-input-field"
                    style={{
                      padding: "12px 14px 12px 38px",
                      borderColor: signupErrors.email ? "#111111" : undefined,
                      boxShadow: signupErrors.email ? "0 0 0 1px #111111" : undefined,
                    }}
                  />
                  <Mail
                    size={16}
                    color="var(--auth-icon-color)"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                </div>
                {signupErrors.email && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#111111",
                      fontWeight: 600,
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} color="#08090D" fill="#D4FF00" />
                    {signupErrors.email.message}
                  </span>
                )}
              </div>

              {/* Master Password */}
              <div>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--auth-label-color)",
                    marginBottom: 6,
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...registerSignup("password")}
                    placeholder="Minimum 8 characters"
                    className="auth-input-field"
                    style={{
                      padding: "12px 42px 12px 38px",
                      borderColor: signupErrors.password ? "#111111" : undefined,
                      boxShadow: signupErrors.password ? "0 0 0 1px #111111" : undefined,
                    }}
                  />
                  <Lock
                    size={16}
                    color="var(--auth-icon-color)"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 13,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--auth-icon-color)",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupErrors.password && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#111111",
                      fontWeight: 600,
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} color="#08090D" fill="#D4FF00" />
                    {signupErrors.password.message}
                  </span>
                )}

                {/* Password Strength Indicator */}
                {currentPassword.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                    <div
                      style={{
                        height: 3,
                        flex: 1,
                        borderRadius: 2,
                        background: currentPassword.length >= 8 ? "#D4FF00" : "rgba(0,0,0,0.1)",
                      }}
                    />
                    <div
                      style={{
                        height: 3,
                        flex: 1,
                        borderRadius: 2,
                        background: /[A-Z]/.test(currentPassword) ? "#D4FF00" : "rgba(0,0,0,0.1)",
                      }}
                    />
                    <div
                      style={{
                        height: 3,
                        flex: 1,
                        borderRadius: 2,
                        background: /[0-9]/.test(currentPassword) ? "#D4FF00" : "rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit-btn"
                style={{ marginTop: 6 }}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                <span>Create account</span>
              </button>
            </form>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" && (
            <form
              onSubmit={handleSigninSubmit(onSignin)}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Identifier */}
              <div>
                <label
                  htmlFor="identifier"
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--auth-label-color)",
                    marginBottom: 6,
                  }}
                >
                  Email or Subdomain
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="identifier"
                    {...registerSignin("identifier")}
                    placeholder="operator@cinema.com or slug"
                    className="auth-input-field"
                    style={{
                      padding: "12px 14px 12px 38px",
                      borderColor: signinErrors.identifier ? "#111111" : undefined,
                      boxShadow: signinErrors.identifier ? "0 0 0 1px #111111" : undefined,
                    }}
                  />
                  <Mail
                    size={16}
                    color="var(--auth-icon-color)"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                </div>
                {signinErrors.identifier && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#111111",
                      fontWeight: 600,
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} color="#08090D" fill="#D4FF00" />
                    {signinErrors.identifier.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="signin_password"
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--auth-label-color)",
                    }}
                  >
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--auth-subtitle-color)",
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="signin_password"
                    type={showPassword ? "text" : "password"}
                    {...registerSignin("password")}
                    placeholder="Enter your password"
                    className="auth-input-field"
                    style={{
                      padding: "12px 42px 12px 38px",
                      borderColor: signinErrors.password ? "#111111" : undefined,
                      boxShadow: signinErrors.password ? "0 0 0 1px #111111" : undefined,
                    }}
                  />
                  <Lock
                    size={16}
                    color="var(--auth-icon-color)"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 13,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--auth-icon-color)",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signinErrors.password && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#111111",
                      fontWeight: 600,
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} color="#08090D" fill="#D4FF00" />
                    {signinErrors.password.message}
                  </span>
                )}
              </div>

              {/* Remember Me */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.82rem",
                  color: "var(--auth-subtitle-color)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#D4FF00", cursor: "pointer" }}
                />
                <span>Remember for 30 days</span>
              </label>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-submit-btn"
                style={{ marginTop: 4 }}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                <span>Sign in</span>
              </button>
            </form>
          )}

          {/* Social SSO: Sign up / Sign in with Google */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                window.alert("Google OAuth: Redirecting to accounts.google.com");
              }}
              className="auth-google-btn"
            >
              {/* Google multi-color SVG icon */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{mode === "signup" ? "Sign up with Google" : "Sign in with Google"}</span>
            </button>
          </div>

          {/* Mode Switcher Link */}
          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: "0.85rem",
              color: "var(--auth-subtitle-color)",
            }}
          >
            {mode === "signup" ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionError(null);
                    setMode("signin");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontWeight: 700,
                    color: "var(--auth-mode-link-color)",
                    textDecoration: "underline",
                    textDecorationColor: "#D4FF00",
                    textUnderlineOffset: "4px",
                    textDecorationThickness: "2px",
                    cursor: "pointer",
                  }}
                >
                  Log in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionError(null);
                    setMode("signup");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontWeight: 700,
                    color: "var(--auth-mode-link-color)",
                    textDecoration: "underline",
                    textDecorationColor: "#D4FF00",
                    textUnderlineOffset: "4px",
                    textDecorationThickness: "2px",
                    cursor: "pointer",
                  }}
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Footer: Copyright & Help Contact */}
        <div
          className="auth-bottom-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.78rem",
            color: "var(--auth-footer-color)",
            marginTop: 36,
            width: "100%",
          }}
        >
          <div>© Africinemas 2026</div>
          <a
            href="mailto:help@africinemas.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--auth-footer-color)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <Mail size={13} />
            <span>help@africinemas.com</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
