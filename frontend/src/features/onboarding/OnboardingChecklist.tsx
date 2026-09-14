import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Film,
  CreditCard,
  Users,
  LucideIcon,
} from "lucide-react";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  icon: LucideIcon;
}

export const OnboardingChecklist: React.FC<{ cinemaName?: string }> = ({
  cinemaName = "Your Cinema",
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: "screen",
      title: "Configure First Auditorium Screen",
      description:
        "Define screen capacity, layout geometry, VIP rows, and wheelchair accessibility",
      completed: true,
      actionLabel: "View Screen",
      icon: Film,
    },
    {
      id: "showtime",
      title: "Schedule First Movie Showtime",
      description:
        "Attach movie title, ticket pricing tiers (VIP, Regular), and audio format (Atmos)",
      completed: false,
      actionLabel: "Add Showtime",
      icon: Film,
    },
    {
      id: "payments",
      title: "Connect M-Pesa & IntaSend Escrow",
      description: "Automate ticket payouts directly into your business paybill or bank account",
      completed: true,
      actionLabel: "Payment Settings",
      icon: CreditCard,
    },
    {
      id: "staff",
      title: "Invite Box Office Staff & Ushers",
      description: "Issue role-based permissions with mobile QR scanner app access",
      completed: false,
      actionLabel: "Invite Team",
      icon: Users,
    },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-6)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
        }}
      >
        <div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>{cinemaName} Launch Milestones</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 2 }}>
            Complete these 4 operational milestones to begin selling tickets online
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-neon-lime)" }}>
            {progressPercent}%
          </span>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {completedCount} of {items.length} Ready
          </div>
        </div>
      </div>

      <div
        style={{
          height: 4,
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: 2,
          overflow: "hidden",
          marginBottom: "var(--space-6)",
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "var(--color-neon-lime)",
            transition: "width 300ms ease",
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                background: item.completed
                  ? "rgba(16, 185, 129, 0.05)"
                  : "var(--bg-surface-elevated)",
                border: `1px solid ${
                  item.completed ? "rgba(16, 185, 129, 0.25)" : "var(--border-subtle)"
                }`,
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {item.completed ? (
                  <CheckCircle2 size={18} color="var(--color-emerald)" />
                ) : (
                  <Circle size={18} color="var(--text-muted)" />
                )}
                <Icon
                  size={16}
                  color={item.completed ? "var(--color-emerald)" : "var(--text-secondary)"}
                />
                <div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: item.completed ? "var(--text-primary)" : "var(--text-secondary)",
                      textDecoration: item.completed ? "line-through" : "none",
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {item.description}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--color-neon-lime)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {item.actionLabel} <ArrowRight size={14} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
