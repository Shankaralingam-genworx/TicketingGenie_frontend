import React from "react";
import { useAppSelector } from "../../../hooks/useAppDispatch";
import { useMyTickets } from "../../../hooks/useTickets";
import { TicketStatus } from "../../../features/tickets/types/ticket.types";
import { useNavigate } from "react-router-dom";
import { BackIcon } from "../../../components/icons";

const TIER_COLOR: Record<string, { bg: string; color: string }> = {
  FREE: { bg: "#F8FAFC", color: "#64748B" },
  BASIC: { bg: "#EFF6FF", color: "#2563EB" },
  PRO: { bg: "#F5F3FF", color: "#7C3AED" },
  ENTERPRISE: { bg: "#FFF7ED", color: "#C2410C" },
};

export default function CustomerProfile() {
  const user = useAppSelector((s) => s.auth.user);
  const { tickets } = useMyTickets();
  const navigate = useNavigate();
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "CU";
  const tier = (user as any)?.customer_tier ?? "BASIC";
  const tierStyle = TIER_COLOR[tier] ?? TIER_COLOR.BASIC;

  const open = tickets.filter((t) =>
  [TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status as TicketStatus),
).length;

  const resolved = tickets.filter((t) =>
    [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as TicketStatus),
  ).length;

  return (
    <>
      <div>
        <button
          className="btn btn--outline btn--sm"
          style={{ marginBottom: 12 }}
          onClick={() => navigate(-1)}
        >
          <BackIcon /> Back
        </button>
        <h1 className="dash-page-title">My Profile</h1>
        <p className="dash-page-sub">
          Your account information and support summary.
        </p>
      </div>
        

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Identity card */}
        <div
          style={{
            background: "white",
            border: "1px solid var(--slate-200)",
            borderRadius: 14,
            padding: 28,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#60A5FA,#1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "white",
            }}
          >
            {initials}
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--slate-800)",
              }}
            >
              {user?.email}
            </p>
            <span
              style={{
                ...tierStyle,
                padding: "3px 12px",
                borderRadius: 99,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginTop: 6,
                display: "inline-block",
              }}
            >
              {tier} plan
            </span>
          </div>
          <div
            style={{
              width: "100%",
              borderTop: "1px solid var(--slate-100)",
              paddingTop: 14,
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "0.78rem",
                color: "var(--slate-500)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              Customer ID
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "0.88rem",
                color: "var(--slate-700)",
              }}
            >
              {(user as any)?.user_id ?? "—"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200)",
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: "0.9rem",
                color: "var(--slate-600)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Support Summary
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 14,
              }}
            >
              {[
                {
                  label: "Total Tickets",
                  value: tickets.length,
                  color: "#2563EB",
                },
                { label: "Open / Active", value: open, color: "#EF4444" },
                { label: "Resolved", value: resolved, color: "#22C55E" },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    textAlign: "center",
                    padding: "16px 10px",
                    background: "var(--slate-50)",
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: c.color,
                    }}
                  >
                    {c.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--slate-500)",
                      marginTop: 4,
                    }}
                  >
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200)",
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h3
              style={{
                margin: "0 0 14px",
                fontSize: "0.9rem",
                color: "var(--slate-600)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Account Details
            </h3>
            {[
              { label: "Email", value: user?.email ?? "—" },
              { label: "Role", value: "Customer" },
              { label: "Plan", value: tier },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid var(--slate-100)",
                }}
              >
                <span
                  style={{
                    minWidth: 140,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--slate-500)",
                  }}
                >
                  {r.label}
                </span>
                <span style={{ color: "var(--slate-800)", fontSize: "0.9rem" }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
