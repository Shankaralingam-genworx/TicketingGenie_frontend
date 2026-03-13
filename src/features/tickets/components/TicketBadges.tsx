
import React from 'react';
import { TicketResponse } from '../types/ticket.types';

// ── Status ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  new:          { label: 'New',          bg: '#EFF6FF', color: '#2563EB' },
  acknowledged: { label: 'Acknowledged', bg: '#E0F2FE', color: '#0284C7' },
  assigned:     { label: 'Assigned',     bg: '#F5F3FF', color: '#7C3AED' },
  open:         { label: 'Open',         bg: '#EFF6FF', color: '#2563EB' },
  in_progress:  { label: 'In Progress',  bg: '#FFF7ED', color: '#D97706' },
  on_hold:      { label: 'On Hold',      bg: '#FAF5FF', color: '#7C3AED' },
  resolved:     { label: 'Resolved',     bg: '#F0FDF4', color: '#16A34A' },
  closed:       { label: 'Closed',       bg: '#F8FAFC', color: '#64748B' },
  reopened:     { label: 'Reopened',     bg: '#FEF2F2', color: '#DC2626' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status?.toLowerCase()] ?? { label: status, bg: '#F1F5F9', color: '#334155' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px',
      borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ── Priority ──────────────────────────────────────────────────────────────────

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  p1: { label: 'P1 · Critical', color: '#DC2626' },
  p2: { label: 'P2 · High',     color: '#D97706' },
  p3: { label: 'P3 · Medium',   color: '#2563EB' },
  p4: { label: 'P4 · Low',      color: '#64748B' },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY_MAP[priority?.toLowerCase()] ?? { label: priority, color: '#334155' };
  return (
    <span style={{ color: p.color, fontWeight: 700, fontSize: '0.78rem',
      display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%',
        background: p.color, display: 'inline-block' }} />
      {p.label}
    </span>
  );
}

// ── SLA chip (static, detail sidebar) ────────────────────────────────────────

export function SlaChip({ due, status }: { due: string | null; status?: string }) {
  const s = status?.toLowerCase() ?? '';
  if (s === 'resolved' || s === 'closed') {
    return (
      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
        background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
        ✓ SLA Met
      </span>
    );
  }
  if (s === 'reopened') {
    return (
      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
        background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
        ⚠ Breached
      </span>
    );
  }
  if (!due) return <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>—</span>;

  const diff = new Date(due).getTime() - Date.now();
  if (diff <= 0) {
    return (
      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
        background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
        ⚠ Breached · {new Date(due).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  }
  const hrs  = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: hrs < 4 ? '#FFF7ED' : '#F0FDF4',
      color:      hrs < 4 ? '#D97706' : '#16A34A' }}>
      {`${hrs}h ${mins}m left`}
    </span>
  );
}

// ── Escalation badges ─────────────────────────────────────────────────────────

export function EscalatedBadge() {
  return (
    <span style={{ background: '#FFF1F2', color: '#E11D48', padding: '3px 10px',
      borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
       Escalated
    </span>
  );
}

export function SlaBreachBadge({ type }: { type: 'response' | 'resolution' | 'esc_response' | 'esc_resolution' }) {
  const labels: Record<string, string> = {
    response:       '🔴 Response SLA Breached',
    resolution:     '🔴 Resolution SLA Breached',
    esc_response:   '⚡ Escalated Response Breached',
    esc_resolution: '⚡ Escalated Resolution Breached',
  };
  return (
    <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '3px 9px',
      borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, border: '1px solid #FCA5A5',
      whiteSpace: 'nowrap' }}>
      {labels[type]}
    </span>
  );
}

/**
 * Renders all applicable SLA breach badges for a ticket.
 * Drop this below the title wherever breach visibility is needed.
 */
export function TicketSlaBreachBadges({ ticket }: { ticket: TicketResponse }) {
  return (
    <>
      {ticket.response_sla_breached && !ticket.is_escalated && (
        <SlaBreachBadge type="response" />
      )}
      {ticket.resolution_sla_breached && !ticket.is_escalated && (
        <SlaBreachBadge type="resolution" />
      )}
      {ticket.escalated_response_sla_breached && (
        <SlaBreachBadge type="esc_response" />
      )}
      {ticket.escalated_resolution_sla_breached && (
        <SlaBreachBadge type="esc_resolution" />
      )}
    </>
  );
}