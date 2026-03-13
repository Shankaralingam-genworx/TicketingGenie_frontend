import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../hooks/useAppDispatch";
import { fetchAssignedTickets } from "../../../features/users/services/userApi";
import { TicketResponse } from "../../../features/tickets/types/ticket.types";
import { useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/icons";

export default function AgentProfile() {
  const user = useAppSelector((s) => s.auth.user);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "AG";
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  useEffect(() => {
    fetchAssignedTickets()
      .then(setTickets)
      .catch(() => {});
  }, []);

  const open = tickets.filter((t) =>
    ["NEW", "IN_PROGRESS", "PENDING_CUSTOMER"].includes(t.status),
  ).length;
  const resolved = tickets.filter((t) =>
    ["RESOLVED", "CLOSED"].includes(t.status),
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
      </div>
      <div className="dash-page-hdr">
        <h1 className="dash-page-title">My Profile</h1>
        <p className="dash-page-sub">
          Your agent account and workload summary.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Identity */}
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
              background: "linear-gradient(135deg,#34D399,#059669)",
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
                background: "#ECFDF5",
                color: "#065F46",
                padding: "3px 12px",
                borderRadius: 99,
                fontSize: "0.75rem",
                fontWeight: 700,
                marginTop: 6,
                display: "inline-block",
              }}
            >
              Support Agent
            </span>
          </div>
        </div>

        {/* Stats + details */}
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
                fontSize: "0.85rem",
                color: "var(--slate-600)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Workload Summary
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
                  label: "Total Assigned",
                  value: tickets.length,
                  color: "#2563EB",
                },
                { label: "Active", value: open, color: "#D97706" },
                { label: "Resolved", value: resolved, color: "#16A34A" },
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
                fontSize: "0.85rem",
                color: "var(--slate-600)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Account Details
            </h3>
            {[
              { label: "Email", value: user?.email ?? "—" },
              { label: "Role", value: "Support Agent" },
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
                    minWidth: 120,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--slate-500)",
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{ color: "var(--slate-800)", fontSize: "0.88rem" }}
                >
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
