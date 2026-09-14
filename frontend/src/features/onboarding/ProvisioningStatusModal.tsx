import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Settings,
  X,
} from "lucide-react";
import { ProvisioningStatusResponse } from "../../types/onboarding";
import { getProvisioningStatus } from "../../api/onboarding";

interface ProvisioningStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  cinemaSlug: string;
  initialStatus?: ProvisioningStatusResponse | null;
}

export const ProvisioningStatusModal: React.FC<ProvisioningStatusModalProps> = ({
  isOpen,
  onClose,
  cinemaSlug,
  initialStatus,
}) => {
  const [status, setStatus] = useState<ProvisioningStatusResponse | null>(initialStatus || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !cinemaSlug) return;

    let isSubscribed = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const data = await getProvisioningStatus(cinemaSlug);
        if (isSubscribed) {
          setStatus(data);
          if (data.status === "READY" || data.status === "FAILED") {
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to query status");
        }
      }
    };

    // Immediate initial fetch
    fetchStatus();
    pollInterval = setInterval(fetchStatus, 2000);

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOpen, cinemaSlug]);

  if (!isOpen) return null;

  const isReady = status?.status === "READY";
  const isFailed = status?.status === "FAILED";

  const steps = [
    {
      id: 1,
      title: "Tenant Record & Subdomain Scoping",
      desc: "Creating isolated tenant record and registering routing domain in public schema",
      icon: Database,
      completed: true,
    },
    {
      id: 2,
      title: "PostgreSQL Schema Creation & DDL",
      desc: `Creating schema tenant_${cinemaSlug} and migrating isolated tenant tables`,
      icon: Layers,
      completed: isReady,
      inProgress: !isReady && !isFailed,
    },
    {
      id: 3,
      title: "Turnkey Seeding & Operational Defaults",
      desc: "Configuring 7-min seat hold TTL, IntaSend M-Pesa escrow, and starter themes",
      icon: Settings,
      completed: isReady,
      inProgress: !isReady && !isFailed,
    },
    {
      id: 4,
      title: "Production Routing Active",
      desc: `Routing live traffic at ${cinemaSlug}.africinemas.com`,
      icon: Sparkles,
      completed: isReady,
    },
  ];

  const tenantDomainUrl =
    status?.domain_url ||
    (typeof window !== "undefined" && window.location.hostname.includes("localhost")
      ? `http://${cinemaSlug}.localhost:8000`
      : `https://${cinemaSlug}.africinemas.com`);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="status-title">
      <div className="modal-dialog">
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
                width: 40,
                height: 40,
                borderRadius: "var(--radius-md)",
                background: isReady
                  ? "var(--color-emerald)"
                  : isFailed
                    ? "#ff5252"
                    : "var(--color-neon-lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isReady || isFailed ? "#ffffff" : "#111113",
              }}
            >
              {isReady ? (
                <CheckCircle2 size={24} />
              ) : isFailed ? (
                <AlertTriangle size={24} />
              ) : (
                <Clock size={24} className="animate-spin" />
              )}
            </div>
            <div>
              <h2 id="status-title" style={{ fontSize: "1.35rem", fontWeight: 800 }}>
                {isReady
                  ? "Cinema Tenant Provisioned!"
                  : isFailed
                    ? "Provisioning Stalled"
                    : "Provisioning Theater Infrastructure..."}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 2 }}>
                Subdomain:{" "}
                <strong style={{ color: "var(--color-neon-lime)" }}>
                  {cinemaSlug}.africinemas.com
                </strong>
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

        {/* Progress Bar */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            <span>Orchestration Progress</span>
            <span
              style={{
                fontWeight: 700,
                color: isReady ? "var(--color-emerald)" : "var(--color-neon-lime)",
              }}
            >
              {isReady ? "100% Complete" : isFailed ? "Failed" : "Step 2 of 4 (65%)"}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: isReady ? "100%" : isFailed ? "65%" : "65%",
                height: "100%",
                background: isReady
                  ? "var(--color-emerald)"
                  : isFailed
                    ? "#ff5252"
                    : "linear-gradient(90deg, var(--color-neon-lime) 0%, var(--color-gold) 100%)",
                transition: "width 500ms ease-in-out",
              }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255, 82, 82, 0.15)",
              border: "1px solid rgba(255, 82, 82, 0.4)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-4)",
              color: "#ff8080",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Steps List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: "var(--space-6)",
          }}
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: 12,
                  borderRadius: "var(--radius-md)",
                  background: step.completed
                    ? "rgba(16, 185, 129, 0.06)"
                    : step.inProgress
                      ? "rgba(214, 255, 56, 0.05)"
                      : "var(--bg-surface)",
                  border: `1px solid ${
                    step.completed
                      ? "rgba(16, 185, 129, 0.25)"
                      : step.inProgress
                        ? "rgba(214, 255, 56, 0.3)"
                        : "var(--border-subtle)"
                  }`,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: step.completed
                      ? "var(--color-emerald)"
                      : step.inProgress
                        ? "var(--color-neon-lime)"
                        : "var(--bg-surface-elevated)",
                    color: step.completed || step.inProgress ? "#111113" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {step.completed ? <CheckCircle2 size={16} /> : <Icon size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: step.completed
                        ? "var(--color-emerald)"
                        : step.inProgress
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            paddingTop: "var(--space-4)",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          {isReady ? (
            <a
              href={tenantDomainUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-pill-lime"
              style={{ textDecoration: "none" }}
            >
              Launch Cinema Dashboard <ArrowRight size={16} />
            </a>
          ) : (
            <button type="button" onClick={onClose} className="btn-pill-ghost">
              Run in Background
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
