import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  assignTicket,
  fetchMyAgents,
  updateTicketStatus,
  AgentUser,
} from "../../../../features/users/services/userApi";
import { fetchTicketById } from "../../../../features/users/services/userApi";
import { TicketResponse } from "../../types/ticket.types";
import {
  StatusBadge,
  PriorityBadge,
  SlaChip,
} from "../../components/TicketBadges";
import CommentThread from "../../../../components/common/CommentThread";

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--slate-100)" }}>
      <span style={{ minWidth: 150, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-500)", paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ color: "var(--slate-800)", fontSize: "0.88rem" }}>{children}</span>
    </div>
  );
}

const LEAD_TRANSITIONS: Record<string, string[]> = {
  new:              ["in_progress"],
  acknowledged:     ["in_progress"],
  assigned:         ["in_progress"],
  in_progress:      ["resolved", "on_hold", "closed"],
  on_hold:          ["in_progress", "resolved", "closed"],
  resolved:         ["closed", "reopened"],
  closed:           [],
  reopened:         ["in_progress"],
  // uppercase fallbacks
  NEW:              ["in_progress"],
  IN_PROGRESS:      ["resolved", "on_hold", "closed"],
  PENDING_CUSTOMER: ["in_progress", "resolved", "closed"],
  RESOLVED:         ["closed"],
  CLOSED:           [],
};

const STATUS_LABELS: Record<string, string> = {
  in_progress:      "Set In Progress",
  resolved:         "Mark Resolved",
  on_hold:          "Put On Hold",
  closed:           "Close Ticket",
  reopened:         "Reopen",
  // uppercase fallbacks
  IN_PROGRESS:      "Set In Progress",
  RESOLVED:         "Mark Resolved",
  PENDING_CUSTOMER: "Waiting on Customer",
  CLOSED:           "Close Ticket",
};

const STATUS_BTN_COLOR: Record<string, string> = {
  closed:           "#374151",
  CLOSED:           "#374151",
  resolved:         "#16A34A",
  RESOLVED:         "#16A34A",
  on_hold:          "#7C3AED",
  PENDING_CUSTOMER: "#7C3AED",
};

const BackIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10H5M9 6l-4 4 4 4" />
  </svg>
);

export default function LeadTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket,       setTicket]       = useState<TicketResponse | null>(null);
  const [agents,       setAgents]       = useState<AgentUser[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [updating,     setUpdating]     = useState(false);
  const [reassignAgent, setReassignAgent] = useState<string>("");
  const [reassigning,  setReassigning]  = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchTicketById(Number(id)), fetchMyAgents()])
      .then(([t, a]) => { setTicket(t); setAgents(a); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const moveStatus = async (newStatus: string) => {
    if (!ticket) return;
    try {
      setUpdating(true);
      setError(null);
      setTicket(await updateTicketStatus(ticket.id, newStatus));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const doReassign = async () => {
    if (!ticket || !reassignAgent) return;
    // Parse the selected agent id — the dropdown stores `a.id` (always defined)
    const agentId = parseInt(reassignAgent, 10);
    if (isNaN(agentId)) return;
    try {
      setReassigning(true);
      setError(null);
      setTicket(await assignTicket(ticket.id, agentId));
      setReassignAgent("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReassigning(false);
    }
  };

  if (loading)
    return <div style={{ padding: "60px 0", textAlign: "center", color: "var(--slate-400)" }}>Loading…</div>;
  if (error && !ticket)
    return <div style={{ padding: "14px 18px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, color: "#B91C1C" }}>{error}</div>;
  if (!ticket) return null;

  const nextStatuses = LEAD_TRANSITIONS[ticket.status] ?? [];

  // Resolve the currently-assigned agent's name for display
  const assignedAgent = agents.find((a) => a.id === ticket.assigned_agent_id);

  return (
    <>
      <button className="btn btn--outline btn--sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        <BackIcon /> Back
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <h1 className="dash-page-title" style={{ margin: 0 }}>{ticket.title}</h1>
        <StatusBadge status={ticket.status} />
        {ticket.is_escalated && (
          <span style={{ background: "#FFF1F2", color: "#E11D48", padding: "3px 10px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700 }}>
            ⚡ Escalated
          </span>
        )}
      </div>
      <p style={{ color: "var(--slate-400)", fontSize: "0.82rem", margin: "4px 0 20px" }}>
        {ticket.ticket_number} · Opened {fmt(ticket.created_at)}
      </p>

      {/* Action bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        {nextStatuses.map((s) => (
          <button
            key={s}
            className="btn btn--primary"
            onClick={() => moveStatus(s)}
            disabled={updating}
            style={{ background: STATUS_BTN_COLOR[s] ?? "#6D28D9" }}
          >
            {updating ? "…" : (STATUS_LABELS[s] ?? s)}
          </button>
        ))}

        {/* Reassign — uses a.id (always present int) as the option value */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
          <select
            style={{ padding: "8px 11px", border: "1.5px solid var(--slate-200)", borderRadius: 8, fontFamily: "var(--font)", fontSize: "0.85rem", background: "var(--slate-50)" }}
            value={reassignAgent}
            onChange={(e) => setReassignAgent(e.target.value)}
          >
            <option value="">Assign to…</option>
            {agents.map((a) => (
              // KEY FIX: use a.id (always a valid int) not a.user_id (optional/undefined)
              <option key={a.id} value={String(a.id)}>
                {a.name ?? a.email}
              </option>
            ))}
          </select>
          <button className="btn btn--outline" onClick={doReassign} disabled={!reassignAgent || reassigning}>
            {reassigning ? "…" : "Assign"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#B91C1C", fontSize: "0.83rem", marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: 12, padding: 22 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--slate-600)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Description</h3>
            <p style={{ margin: 0, color: "var(--slate-600)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ticket.description}</p>
          </div>

          {ticket.priority_overridden && (
            <div style={{ padding: "12px 16px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, fontSize: "0.83rem", color: "#92400E" }}>
              <strong>Priority Overridden</strong> — {ticket.priority_override_justification}
            </div>
          )}

          <div style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: 12, padding: 22 }}>
            <CommentThread ticketId={ticket.id} currentRole="TEAM_LEAD" />
          </div>
        </div>

        {/* Right */}
        <div style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Details</h3>
          <Row label="Ticket #">{ticket.ticket_number}</Row>
          <Row label="Priority"><PriorityBadge priority={ticket.priority} /></Row>
          <Row label="Customer Priority"><PriorityBadge priority={ticket.customer_priority} /></Row>
          <Row label="Severity">{ticket.severity}</Row>
          <Row label="Category">{ticket.issue?.name ?? "—"}</Row>
          <Row label="Customer Tier">{ticket.customer_tier}</Row>
          <Row label="Assigned Agent">
            {assignedAgent ? (
              <span style={{ fontWeight: 600, color: "#059669" }}>{assignedAgent.name ?? assignedAgent.email}</span>
            ) : ticket.assigned_agent_id ? (
              <span style={{ fontWeight: 600, color: "#059669" }}>Agent #{ticket.assigned_agent_id}</span>
            ) : (
              <span style={{ color: "#EF4444", fontWeight: 600 }}>Unassigned</span>
            )}
          </Row>

          <div style={{ margin: "12px 0 6px", paddingTop: 12, borderTop: "1px solid var(--slate-100)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-400)" }}>SLA</span>
          </div>
          <Row label="Response Due"><SlaChip due={ticket.response_due_at} /></Row>
          <Row label="Resolution Due"><SlaChip due={ticket.resolution_due_at} /></Row>
          <Row label="First Response">{fmt(ticket.first_response_at)}</Row>

          <div style={{ margin: "12px 0 6px", paddingTop: 12, borderTop: "1px solid var(--slate-100)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-400)" }}>Timeline</span>
          </div>
          <Row label="Created">{fmt(ticket.created_at)}</Row>
          <Row label="Updated">{fmt(ticket.updated_at)}</Row>
          <Row label="Resolved">{fmt(ticket.resolved_at)}</Row>
          <Row label="Closed">{fmt(ticket.closed_at)}</Row>
        </div>
      </div>
    </>
  );
}