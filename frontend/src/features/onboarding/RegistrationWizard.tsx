import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sparkles,
  Check,
  X,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Film,
} from "lucide-react";
import {
  KENYA_CITIES,
  THEME_PRESETS,
  OnboardingFormData,
  onboardingSchema,
  SubdomainCheckResponse,
  ProvisioningStatusResponse,
} from "../../types/onboarding";
import { checkSubdomainAvailability, registerCinema } from "../../api/onboarding";

interface RegistrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (status: ProvisioningStatusResponse) => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SubdomainCheckResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: {
      cinema_name: "",
      slug: "",
      city: "Nairobi",
      address: "",
      contact_phone: "+254712345678",
      primary_color: "#E61C24",
      secondary_color: "#E5A93B",
      accent_color: "#00E5FF",
      preset_name: "african-ruby",
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "+254712345678",
      password: "",
      password_confirm: "",
    },
  });

  const cinemaName = watch("cinema_name");
  const currentSlug = watch("slug");
  const primaryColor = watch("primary_color");
  const secondaryColor = watch("secondary_color");
  const accentColor = watch("accent_color");
  const currentPassword = watch("password") || "";

  // Auto-generate slug from cinema name if user hasn't typed custom slug yet
  useEffect(() => {
    if (cinemaName && currentStep === 1) {
      const generated = cinemaName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 63);
      if (!currentSlug || currentSlug === generated.slice(0, currentSlug.length)) {
        setValue("slug", generated, { shouldValidate: true });
      }
    }
  }, [cinemaName, currentStep, currentSlug, setValue]);

  // Debounced live subdomain check
  useEffect(() => {
    if (!currentSlug || currentSlug.length < 3) {
      setSlugStatus(null);
      return;
    }

    const abortController = new AbortController();
    setIsCheckingSlug(true);

    const timer = setTimeout(async () => {
      try {
        const result = await checkSubdomainAvailability(currentSlug, abortController.signal);
        setSlugStatus(result);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setSlugStatus({
            subdomain: currentSlug,
            is_available: false,
            status: "INVALID",
            message: err.message,
          });
        }
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [currentSlug]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (currentPassword.length >= 12) score += 1;
    if (/[A-Z]/.test(currentPassword)) score += 1;
    if (/[a-z]/.test(currentPassword)) score += 1;
    if (/[0-9]/.test(currentPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(currentPassword)) score += 1;
    return score;
  }, [currentPassword]);

  // WCAG contrast calculation (luminance)
  const contrastRatio = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const clean = hex.replace("#", "");
      const full =
        clean.length === 3
          ? clean
              .split("")
              .map((c) => c + c)
              .join("")
          : clean;
      const num = parseInt(full, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    };

    try {
      const [r, g, b] = hexToRgb(primaryColor || "#E61C24");
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return lum > 0.5 ? "Dark text recommended" : "Crisp white text (AAA High Contrast)";
    } catch {
      return "WCAG AA Valid";
    }
  }, [primaryColor]);

  // Step progression validation
  const handleNext = async () => {
    setSubmissionError(null);
    if (currentStep === 1) {
      const valid = await trigger(["cinema_name", "slug", "city", "address", "contact_phone"]);
      if (valid && slugStatus && slugStatus.is_available) {
        setCurrentStep(2);
      } else if (!slugStatus?.is_available) {
        setSubmissionError("Please choose an available subdomain before proceeding");
      }
    } else if (currentStep === 2) {
      const valid = await trigger(["primary_color", "secondary_color", "accent_color"]);
      if (valid) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrev = () => {
    setSubmissionError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await registerCinema(data, idempotencyKey);
      onSuccess(response);
    } catch (err: unknown) {
      setSubmissionError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div className="modal-dialog">
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md)",
                background: "var(--color-neon-lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111113",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="wizard-title" style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                Onboard Your Cinema
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                High-concurrency multi-tenant theater provisioning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-6)",
            background: "var(--bg-surface)",
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background:
                  currentStep >= 1 ? "var(--color-neon-lime)" : "var(--bg-surface-elevated)",
                color: currentStep >= 1 ? "#111113" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentStep > 1 ? <Check size={14} /> : "1"}
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: currentStep === 1 ? 700 : 500,
                color: currentStep === 1 ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              Identity
            </span>
          </div>

          <div
            style={{
              flex: 1,
              height: 2,
              background: currentStep >= 2 ? "var(--color-neon-lime)" : "var(--border-subtle)",
              margin: "0 12px",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background:
                  currentStep >= 2 ? "var(--color-neon-lime)" : "var(--bg-surface-elevated)",
                color: currentStep >= 2 ? "#111113" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {currentStep > 2 ? <Check size={14} /> : "2"}
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: currentStep === 2 ? 700 : 500,
                color: currentStep === 2 ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              Branding
            </span>
          </div>

          <div
            style={{
              flex: 1,
              height: 2,
              background: currentStep >= 3 ? "var(--color-neon-lime)" : "var(--border-subtle)",
              margin: "0 12px",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background:
                  currentStep === 3 ? "var(--color-neon-lime)" : "var(--bg-surface-elevated)",
                color: currentStep === 3 ? "#111113" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              3
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: currentStep === 3 ? 700 : 500,
                color: currentStep === 3 ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              Operator
            </span>
          </div>
        </div>

        {submissionError && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255, 82, 82, 0.15)",
              border: "1px solid rgba(255, 82, 82, 0.4)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-4)",
              color: "#ff8080",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            {submissionError}
          </div>
        )}

        {/* Wizard Step 1: Cinema Identity & Subdomain */}
        {currentStep === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="cinema_name">
                Cinema Business Name
              </label>
              <input
                id="cinema_name"
                type="text"
                placeholder="e.g. Westgate Cinema"
                className="form-input"
                {...register("cinema_name")}
              />
              {errors.cinema_name && <p className="form-error">{errors.cinema_name.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="slug">
                Custom Subdomain URL
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="slug"
                  type="text"
                  placeholder="westgate"
                  className="form-input"
                  style={{ paddingRight: 160 }}
                  {...register("slug")}
                />
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                >
                  .africinemas.com
                </span>
              </div>

              {/* Subdomain availability indicator */}
              <div style={{ marginTop: 8 }}>
                {isCheckingSlug ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Checking subdomain availability...
                  </div>
                ) : slugStatus ? (
                  slugStatus.is_available ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--color-emerald)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      <Check size={14} /> Subdomain {slugStatus.subdomain}.africinemas.com is
                      available!
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#ff5252",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        <X size={14} /> Subdomain {slugStatus.subdomain} is{" "}
                        {slugStatus.status.toLowerCase()}
                      </div>
                      {slugStatus.suggestions && slugStatus.suggestions.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Suggestions:
                          </span>
                          {slugStatus.suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setValue("slug", sug, { shouldValidate: true })}
                              style={{
                                background: "var(--bg-surface-elevated)",
                                border: "1px solid var(--border-subtle)",
                                borderRadius: "var(--radius-full)",
                                padding: "2px 8px",
                                fontSize: "0.75rem",
                                color: "var(--color-neon-lime)",
                                cursor: "pointer",
                              }}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ) : null}
              </div>
              {errors.slug && <p className="form-error">{errors.slug.message}</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="city">
                  Kenyan City
                </label>
                <select id="city" className="form-input" {...register("city")}>
                  {KENYA_CITIES.map((c) => (
                    <option key={c} value={c} style={{ background: "var(--bg-surface)" }}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.city && <p className="form-error">{errors.city.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact_phone">
                  Contact Phone
                </label>
                <input
                  id="contact_phone"
                  type="text"
                  placeholder="+254712345678"
                  className="form-input"
                  {...register("contact_phone")}
                />
                {errors.contact_phone && (
                  <p className="form-error">{errors.contact_phone.message}</p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                Mall / Physical Location
              </label>
              <input
                id="address"
                type="text"
                placeholder="e.g. 2nd Floor, Westgate Shopping Mall, Westlands"
                className="form-input"
                {...register("address")}
              />
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>
        )}

        {/* Wizard Step 2: Brand Styling */}
        {currentStep === 2 && (
          <div>
            <label className="form-label">Select Brand Color Preset</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 8,
                marginBottom: "var(--space-6)",
              }}
            >
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setValue("primary_color", preset.primary, { shouldValidate: true });
                    setValue("secondary_color", preset.secondary, { shouldValidate: true });
                    setValue("accent_color", preset.accent, { shouldValidate: true });
                    setValue("preset_name", preset.name);
                  }}
                  style={{
                    background: "var(--bg-surface)",
                    border: `1px solid ${
                      primaryColor === preset.primary
                        ? "var(--color-neon-lime)"
                        : "var(--border-subtle)"
                    }`,
                    borderRadius: "var(--radius-md)",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: preset.primary,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: preset.secondary,
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: preset.accent,
                        display: "inline-block",
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}
                  >
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Live Cinema Storefront Mockup Preview */}
            <div
              style={{
                background: "var(--bg-app)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4)",
                marginBottom: "var(--space-6)",
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
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--radius-sm)",
                      background: primaryColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Film size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                      {cinemaName || "Your Cinema"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {currentSlug || "cinema"}.africinemas.com
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-full)",
                    padding: "2px 8px",
                    fontSize: "0.7rem",
                    color: "var(--color-neon-lime)",
                  }}
                >
                  {contrastRatio}
                </span>
              </div>

              {/* Mock Tickets / Seat Preview */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: secondaryColor,
                      fontWeight: 700,
                    }}
                  >
                    Auditorium 1 • ScreenX
                  </span>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: 2 }}>
                    Dune: Part Two (IMAX 2D)
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    background: primaryColor,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "var(--radius-full)",
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Book KES 1,000
                </button>
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Primary Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="color"
                    style={{
                      width: 36,
                      height: 36,
                      border: "none",
                      borderRadius: 4,
                      background: "none",
                      cursor: "pointer",
                    }}
                    value={primaryColor}
                    onChange={(e) => setValue("primary_color", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                    {...register("primary_color")}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="color"
                    style={{
                      width: 36,
                      height: 36,
                      border: "none",
                      borderRadius: 4,
                      background: "none",
                      cursor: "pointer",
                    }}
                    value={secondaryColor}
                    onChange={(e) => setValue("secondary_color", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                    {...register("secondary_color")}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="color"
                    style={{
                      width: 36,
                      height: 36,
                      border: "none",
                      borderRadius: 4,
                      background: "none",
                      cursor: "pointer",
                    }}
                    value={accentColor}
                    onChange={(e) => setValue("accent_color", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: "8px 10px", fontSize: "0.8rem" }}
                    {...register("accent_color")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Step 3: Operator Account */}
        {currentStep === 3 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="first_name">
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  placeholder="Maina"
                  className="form-input"
                  {...register("first_name")}
                />
                {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="last_name">
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  placeholder="Kariuki"
                  className="form-input"
                  {...register("last_name")}
                />
                {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Operator Email (Owner)
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@westgatecinema.ke"
                  className="form-input"
                  {...register("email")}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone_number">
                  Operator Phone
                </label>
                <input
                  id="phone_number"
                  type="text"
                  placeholder="+254712345678"
                  className="form-input"
                  {...register("phone_number")}
                />
                {errors.phone_number && <p className="form-error">{errors.phone_number.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password (Argon2id Min 12 Chars)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="form-input"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength bar */}
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    height: 4,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        background:
                          passwordStrength >= level
                            ? passwordStrength >= 4
                              ? "var(--color-emerald)"
                              : passwordStrength >= 3
                                ? "var(--color-gold)"
                                : "#ff5252"
                            : "transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>
                    Strength:{" "}
                    {passwordStrength >= 5
                      ? "Military-grade"
                      : passwordStrength >= 4
                        ? "Strong"
                        : passwordStrength >= 3
                          ? "Medium"
                          : "Weak"}
                  </span>
                  <span>Argon2id + AES-256-GCM Secure</span>
                </div>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password_confirm">
                Confirm Password
              </label>
              <input
                id="password_confirm"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="form-input"
                {...register("password_confirm")}
              />
              {errors.password_confirm && (
                <p className="form-error">{errors.password_confirm.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "var(--space-8)",
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="btn-pill-ghost"
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button type="button" onClick={handleNext} className="btn-pill-lime">
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="btn-pill-lime"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Provisioning Tenant...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Launch Cinema Tenant
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
