import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTicketById, updateTicketStatus } from '../../../../features/users/services/userApi';
import { TicketResponse } from '../../types/ticket.types';
import {
  StatusBadge,
  PriorityBadge,
  SlaChip,
} from '../../components/TicketBadges';
import CommentThread from '../../../../components/common/CommentThread';
import { TicketStatus } from "../../types/ticket.types";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "9px 0",
        borderBottom: "1px solid var(--slate-100)",
      }}
    >
      <span
        style={{
          minWidth: 150,
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--slate-500)",
          paddingTop: 2,
        }}
      >
        {label}
      </span>
      <span style={{ color: "var(--slate-800)", fontSize: "0.88rem" }}>
        {children}
      </span>
    </div>
  );
}

// Transitions an agent is allowed to make
const AGENT_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  [TicketStatus.NEW]: [TicketStatus.ACKNOWLEDGED],
  [TicketStatus.ACKNOWLEDGED]: [TicketStatus.ASSIGNED],
  [TicketStatus.ASSIGNED] : [TicketStatus.OPEN],
  [TicketStatus.OPEN] : [TicketStatus.IN_PROGRESS],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.ON_HOLD],

  [TicketStatus.ON_HOLD]: [TicketStatus.IN_PROGRESS],

  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [TicketStatus.REOPENED],
  [TicketStatus.REOPENED]:[TicketStatus.IN_PROGRESS]
};

const STATUS_LABELS: Partial<Record<TicketStatus, string>> = {
  [TicketStatus.IN_PROGRESS]: "Mark In Progress",
  [TicketStatus.RESOLVED]: "Mark Resolved",
  [TicketStatus.ON_HOLD]: "Put On Hold",
  [TicketStatus.REOPENED] : "Reopen the Ticket"
};

const BackIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    style={{ width: 15, height: 15 }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10H5M9 6l-4 4 4 4"
    />
  </svg>
);

export default function AgentTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTicketById(Number(id))
      .then(setTicket)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const moveStatus = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      setUpdating(true);
      const updated = await updateTicketStatus(ticket.id, newStatus);
      setTicket(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div
        style={{
          padding: "60px 0",
          textAlign: "center",
          color: "var(--slate-400)",
        }}
      >
        Loading ticket…
      </div>
    );
  if (error)
    return (
      <div
        style={{
          padding: "14px 18px",
          background: "#FEF2F2",
          border: "1px solid #FCA5A5",
          borderRadius: 10,
          color: "#B91C1C",
        }}
      >
        {error}
      </div>
    );
  if (!ticket) return null;

  const nextStatuses = AGENT_TRANSITIONS[ticket.status as TicketStatus] ?? [];
  console.log("Current ticket status:", ticket.status, "Next statuses:", nextStatuses);

  return (
    <>
      <button
        className="btn btn--outline btn--sm"
        style={{ marginBottom: 16 }}
        onClick={() => navigate("/agent/tickets")}
      >
        <BackIcon /> Back
      </button>

      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 4,
        }}
      >
        <h1 className="dash-page-title" style={{ margin: 0 }}>
          {ticket.title}
        </h1>
        <StatusBadge status={ticket.status} />
        {ticket.is_escalated && (
          <span
            style={{
              background: "#FFF1F2",
              color: "#E11D48",
              padding: "3px 10px",
              borderRadius: 99,
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            ⚡ Escalated
          </span>
        )}
      </div>
      <p
        style={{
          color: "var(--slate-400)",
          fontSize: "0.82rem",
          margin: "4px 0 20px",
        }}
      >
        {ticket.ticket_number} · Opened {fmt(ticket.created_at)}
      </p>
      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {nextStatuses.map((s) => {
            const bgColor =
              s === TicketStatus.RESOLVED
                ? "#16A34A"
                : s === TicketStatus.ON_HOLD
                  ? "#7C3AED"
                  : "#2563EB";

            return (
              <button
                key={s}
                className="btn btn--primary"
                onClick={() => moveStatus(s)}
                disabled={updating}
                style={{ background: bgColor }}
              >
                {updating ? "…" : (STATUS_LABELS[s] ?? s)}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            color: "#B91C1C",
            fontSize: "0.83rem",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Left: description + comments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200)",
              borderRadius: 12,
              padding: 22,
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "0.85rem",
                color: "var(--slate-600)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Description
            </h3>
            <p
              style={{
                margin: 0,
                color: "var(--slate-600)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {ticket.description}
            </p>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid var(--slate-200)",
              borderRadius: 12,
              padding: 22,
            }}
          >
            <CommentThread ticketId={ticket.id} currentRole="SUPPORT_AGENT" />
          </div>
        </div>

        {/* Right: metadata */}
        <div
          style={{
            background: "white",
            border: "1px solid var(--slate-200)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "0.8rem",
              color: "var(--slate-500)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Details
          </h3>
          <Row label="Ticket #">{ticket.ticket_number}</Row>
          <Row label="Priority">
            <PriorityBadge priority={ticket.priority} />
          </Row>
          <Row label="Severity">{ticket.severity}</Row>
          <Row label="Category">{ticket.issue?.name ?? "—"}</Row>
          <Row label="Source">{ticket.source}</Row>

          <div
            style={{
              margin: "12px 0 6px",
              paddingTop: 12,
              borderTop: "1px solid var(--slate-100)",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--slate-400)",
              }}
            >
              SLA
            </span>
          </div>
          <Row label="Response Due">
            <SlaChip due={ticket.response_due_at} />
          </Row>
          <Row label="Resolution Due">
            <SlaChip due={ticket.resolution_due_at} />
          </Row>
          <Row label="First Response">{fmt(ticket.first_response_at)}</Row>

          <div
            style={{
              margin: "12px 0 6px",
              paddingTop: 12,
              borderTop: "1px solid var(--slate-100)",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--slate-400)",
              }}
            >
              Timeline
            </span>
          </div>
          <Row label="Created">{fmt(ticket.created_at)}</Row>
          <Row label="Updated">{fmt(ticket.updated_at)}</Row>
          <Row label="Resolved">{fmt(ticket.resolved_at)}</Row>
        </div>
      </div>
    </>
  );
}
