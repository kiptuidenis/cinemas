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

    const handler = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const result = await checkSubdomainAvailability(currentSlug);
        setSlugAvailable(result.is_available);
        setSlugMessage(
          result.is_available
            ? `${result.subdomain}.africinemas.com is available!`
            : `${result.subdomain} is already reserved.`
        );
      } catch {
        setSlugAvailable(null);
        setSlugMessage(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [currentSlug]);

  const onSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await registerCinema(
        {
          cinema_name: data.cinema_name,
          slug: data.slug,
          city: "Nairobi",
          address: "HQ / Main Branch",
          contact_phone: "+254700000000",
          primary_color: "#E61C24",
          secondary_color: "#E5A93B",
          accent_color: "#D4FF00",
          preset_name: "african-ruby",
          first_name: "Operator",
          last_name: "Admin",
          email: data.email,
          phone_number: "+254700000000",
          password: data.password,
          password_confirm: data.password,
        },
        idempotencyKey
      );

      onSuccess(response);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to register cinema. Please try again.";
      setSubmissionError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignin = async (data: SigninFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    // Simulate operator login check
    setTimeout(() => {
      setIsSubmitting(false);
      // Redirect or launch tenant console
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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1.08fr",
        background: "#FFFFFF",
        color: "#111111",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* ======================================================================
          LEFT SECTION: Brand & Minimalist SaaS Authentication Form
          ====================================================================== */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "100vh",
          overflowY: "auto",
          padding: "36px 54px",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header: Brand Logo & Back Link */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
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

          <button
            type="button"
            onClick={onBackToHome}
            style={{
              background: "none",
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#666666",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
              transition: "color 150ms ease",
            }}
          >
            <ArrowLeft size={16} /> Back to website
          </button>
        </div>

        {/* Center Container: Vertically Centered Modern Auth Card */}
        <div
          style={{
            maxWidth: 380,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Headline & Subtitle */}
          <h1
            style={{
              fontSize: "2.15rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#111111",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {mode === "signup" ? "Create an account" : "Welcome back"}
          </h1>

          <p
            style={{
              fontSize: "0.95rem",
              color: "#666670",
              marginTop: 10,
              marginBottom: 28,
              lineHeight: 1.5,
            }}
          >
            {mode === "signup"
              ? "Start your 30-day free cinema trial. No credit card required."
              : "Enter your operator credentials to access your cinema console."}
          </p>

          {/* Submission Error Banner */}
          {submissionError && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #EF4444",
                borderRadius: "10px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#991B1B",
                fontSize: "0.82rem",
                marginBottom: 20,
              }}
            >
              <AlertCircle size={16} />
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
                    color: "#333338",
                    marginBottom: 6,
                  }}
                >
                  Cinema / Company Name
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="cinema_name"
                    {...registerSignup("cinema_name")}
                    placeholder="e.g. Rupa's Cinemas Eldoret"
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 38px",
                      borderRadius: "10px",
                      border: signupErrors.cinema_name ? "1px solid #EF4444" : "1px solid #E5E7EB",
                      fontSize: "0.92rem",
                      color: "#111111",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 150ms ease",
                    }}
                  />
                  <Building2
                    size={16}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                </div>
                {signupErrors.cinema_name && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#EF4444",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
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
                    color: "#333338",
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
                    style={{
                      width: "100%",
                      padding: "12px 120px 12px 38px",
                      borderRadius: "10px",
                      border: signupErrors.slug
                        ? "1px solid #EF4444"
                        : slugAvailable === true
                          ? "1px solid #10B981"
                          : "1px solid #E5E7EB",
                      fontSize: "0.92rem",
                      color: "#111111",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <Globe
                    size={16}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 13,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#888888",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    .africinemas.com
                    {isCheckingSlug ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : slugAvailable === true ? (
                      <Check size={14} color="#10B981" strokeWidth={3} />
                    ) : slugAvailable === false ? (
                      <X size={14} color="#EF4444" strokeWidth={3} />
                    ) : null}
                  </span>
                </div>
                {slugMessage && (
                  <span
                    style={{
                      fontSize: "0.74rem",
                      color: slugAvailable ? "#05C46B" : "#EF4444",
                      marginTop: 4,
                      display: "block",
                      fontWeight: 500,
                    }}
                  >
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
                    color: "#333338",
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
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 38px",
                      borderRadius: "10px",
                      border: signupErrors.email ? "1px solid #EF4444" : "1px solid #E5E7EB",
                      fontSize: "0.92rem",
                      color: "#111111",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <Mail
                    size={16}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                </div>
                {signupErrors.email && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#EF4444",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
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
                    color: "#333338",
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
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 38px",
                      borderRadius: "10px",
                      border: signupErrors.password ? "1px solid #EF4444" : "1px solid #E5E7EB",
                      fontSize: "0.92rem",
                      color: "#111111",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <Lock
                    size={16}
                    color="#9CA3AF"
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
                      color: "#9CA3AF",
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
                      color: "#EF4444",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
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
                        background: currentPassword.length >= 8 ? "#D4FF00" : "#E5E7EB",
                      }}
                    />
                    <div
                      style={{
                        height: 3,
                        flex: 1,
                        borderRadius: 2,
                        background: /[A-Z]/.test(currentPassword) ? "#D4FF00" : "#E5E7EB",
                      }}
                    />
                    <div
                      style={{
                        height: 3,
                        flex: 1,
                        borderRadius: 2,
                        background: /[0-9]/.test(currentPassword) ? "#05C46B" : "#E5E7EB",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "#111111",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px 20px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 6,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                }}
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
                    color: "#333338",
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
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 38px",
                      borderRadius: "10px",
                      border: signinErrors.identifier ? "1px solid #EF4444" : "1px solid #E5E7EB",
                      fontSize: "0.92rem",
                      color: "#111111",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <Mail
                    size={16}
                    color="#9CA3AF"
                    style={{ position: "absolute", left: 12, top: 14 }}
                  />
                </div>
                {signinErrors.identifier && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#EF4444",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
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
                      color: "#333338",
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
                      color: "#666670",
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
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 38px",
                      borderRadius: "10px",
                      border: signinErrors.password ? "1px solid #EF4444" : "1px solid #E5E7EB",
                      fontSize: "0.92rem",
                      color: "#111111",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <Lock
                    size={16}
                    color="#9CA3AF"
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
                      color: "#9CA3AF",
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
                      color: "#EF4444",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
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
                  color: "#555555",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: "#111111", cursor: "pointer" }}
                />
                <span>Remember for 30 days</span>
              </label>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "#111111",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px 20px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                }}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                <span>Sign in</span>
              </button>
            </form>
          )}

          {/* Social SSO: Sign up / Sign in with Google (Matches reference image) */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                // Mock Google OAuth redirect
                window.alert("Google OAuth: Redirecting to accounts.google.com");
              }}
              style={{
                width: "100%",
                background: "#FFFFFF",
                color: "#374151",
                border: "1px solid #D1D5DB",
                borderRadius: "10px",
                padding: "11px 20px",
                fontSize: "0.92rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "background-color 150ms ease",
              }}
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
              color: "#666670",
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
                    color: "#111111",
                    textDecoration: "underline",
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
                    color: "#111111",
                    textDecoration: "underline",
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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.78rem",
            color: "#888892",
            marginTop: 36,
          }}
        >
          <div>© Africinemas 2026</div>
          <a
            href="mailto:help@africinemas.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#666670",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <Mail size={13} />
            <span>help@africinemas.com</span>
          </a>
        </div>
      </div>

      {/* ======================================================================
          RIGHT SECTION: Sculpted 3D Cinema Row Booking & Confirming Animation
          ====================================================================== */}
      <div style={{ width: "100%", height: "100%", minHeight: "100vh" }}>
        <CinemaRow3DAnimation />
      </div>
    </div>
  );
};

export default AuthPage;
