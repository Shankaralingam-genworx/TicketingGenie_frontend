/**
 * TicketWorkView — Agent ticket detail page.
 * File: src/features/tickets/pages/agent/TicketWorkView.tsx
 *
 * SLA behaviour:
 *   ASSIGNED status   → Response Due timer is running.
 *                        Once agent clicks "Start Working" → response timer stops,
 *                        resolution timer starts (backend sets resolution_due_at).
 *
 *   OPEN / IN_PROGRESS / ON_HOLD → Resolution Due timer is running.
 *                        Response Due shown as "Responded · <time>" (first_response_at).
 *
 *   RESOLVED (on time) → SLA Met on resolution chip.
 *   RESOLVED (late)    → SLA Breached on resolution chip.
 *   CLOSED             → SLA Met.
 *
 *   If the relevant SLA (response for ASSIGNED, resolution for active) is
 *   breached → dropdown and "Start Working" are LOCKED with an explanation banner.
 *   Agent must contact the lead to escalate — they cannot change status.
 *
 * Status transitions (frontend-only map, backend still validates for security):
 *   ASSIGNED    → "Start Working" → OPEN
 *   OPEN        → IN_PROGRESS | ON_HOLD | RESOLVED
 *   IN_PROGRESS → ON_HOLD | RESOLVED
 *   ON_HOLD     → IN_PROGRESS | RESOLVED
 *   RESOLVED    → (none — lead closes)
 *   CLOSED      → REOPENED
 *   REOPENED    → IN_PROGRESS | ON_HOLD | RESOLVED  (same options as OPEN)
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchTicketById,
  updateTicketStatus,
  startWorkingOnTicket,
} from '@/features/users/services/userService';
import { TicketResponse, TicketStatus } from '../../types/ticket.types';
import { StatusBadge, PriorityBadge } from '../../components/TicketBadges';
import CommentThread from '@/components/common/CommentThread';
import { BackIcon } from '@/components/icons';

// ── Frontend transition map ───────────────────────────────────────────────────

const AGENT_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
  [TicketStatus.OPEN]:        [TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.RESOLVED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.ON_HOLD,     TicketStatus.RESOLVED],
  [TicketStatus.ON_HOLD]:     [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.RESOLVED]:    [],   // terminal for agent — lead closes
  [TicketStatus.CLOSED]:      [TicketStatus.REOPENED],
  [TicketStatus.REOPENED]:    [TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD, TicketStatus.RESOLVED],
};

function getAllowedTransitions(status: TicketStatus): TicketStatus[] {
  return AGENT_TRANSITIONS[status] ?? [];
}

// ── SLA state helper ──────────────────────────────────────────────────────────
//
// Returns which SLA clock is "active" for the current status and whether
// that clock has already expired (breached).
//
// ASSIGNED                      → response SLA is the active clock
// OPEN / IN_PROGRESS / ON_HOLD
//   / REOPENED                  → resolution SLA is the active clock
// RESOLVED                      → check if resolved on time (isMet / isBreached)
// CLOSED                        → always Met

interface SlaState {
  activeType: 'response' | 'resolution' | 'none';
  due: string | null;
  isBreached: boolean;
  isMet: boolean;
}

function getSlaState(ticket: TicketResponse): SlaState {
  const status = ticket.status as TicketStatus;
  const now    = Date.now();

  if (status === TicketStatus.RESOLVED) {
    const resolvedAt    = ticket.resolved_at       ? new Date(ticket.resolved_at).getTime()       : null;
    const resolutionDue = ticket.resolution_due_at ? new Date(ticket.resolution_due_at).getTime() : null;
    const isMet = resolvedAt != null && resolutionDue != null && resolvedAt <= resolutionDue;
    return { activeType: 'none', due: null, isBreached: !isMet && resolutionDue != null, isMet };
  }

  if (status === TicketStatus.CLOSED) {
    return { activeType: 'none', due: null, isBreached: false, isMet: true };
  }

  if (status === TicketStatus.ASSIGNED) {
    const due        = ticket.response_due_at ?? null;
    const isBreached = due ? now > new Date(due).getTime() : false;
    return { activeType: 'response', due, isBreached, isMet: false };
  }

  // OPEN, IN_PROGRESS, ON_HOLD, REOPENED
  const due        = ticket.resolution_due_at ?? null;
  const isBreached = due ? now > new Date(due).getTime() : false;
  return { activeType: 'resolution', due, isBreached, isMet: false };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_LABELS: Partial<Record<TicketStatus, string>> = {
  [TicketStatus.IN_PROGRESS]: 'Mark In Progress',
  [TicketStatus.ON_HOLD]:     'Put On Hold',
  [TicketStatus.RESOLVED]:    'Mark Resolved',
  [TicketStatus.CLOSED]:      'Close Ticket',
  [TicketStatus.REOPENED]:    'Reopen Ticket',
};

const STATUS_COLOR: Partial<Record<TicketStatus, string>> = {
  [TicketStatus.RESOLVED]:    '#16A34A',
  [TicketStatus.ON_HOLD]:     '#7C3AED',
  [TicketStatus.CLOSED]:      '#64748B',
  [TicketStatus.REOPENED]:    '#D97706',
  [TicketStatus.IN_PROGRESS]: '#2563EB',
};

// ── Icons ─────────────────────────────────────────────────────────────────────


const PlayIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
  </svg>
);

// ── Detail row ────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--slate-100)' }}>
      <span style={{ minWidth: 150, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', paddingTop: 2 }}>
        {label}
      </span>
      <span style={{ color: 'var(--slate-800)', fontSize: '0.88rem' }}>{children}</span>
    </div>
  );
}

// ── SLA chip components ───────────────────────────────────────────────────────

function SlaMetChip() {
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
      ✓ SLA Met
    </span>
  );
}

function SlaBreachedChip({ label }: { label?: string }) {
  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
      ⚠ {label ?? 'SLA Breached'}
    </span>
  );
}

// Live countdown chip — re-ticks every 30 s
function SlaLiveChip({ due }: { due: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const diff = new Date(due).getTime() - Date.now();
  if (diff <= 0) return <SlaBreachedChip />;

  const hrs  = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const urgent = hrs < 4;

  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: urgent ? '#FFF7ED' : '#F0FDF4',
      color:      urgent ? '#D97706' : '#16A34A',
      border:     `1px solid ${urgent ? '#FED7AA' : '#BBF7D0'}` }}>
      {`${hrs}h ${mins}m left`}
    </span>
  );
}

// ── Status dropdown ───────────────────────────────────────────────────────────

function StatusDropdown({
  options, onSelect, updating,
}: {
  options: TicketStatus[];
  onSelect: (s: TicketStatus) => void;
  updating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn--outline"
        onClick={() => setOpen(o => !o)}
        disabled={updating}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {updating ? 'Updating…' : 'Change Status'}
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'white', border: '1px solid var(--slate-200)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          zIndex: 100, minWidth: 200, overflow: 'hidden',
        }}>
          {options.map(s => (
            <button key={s}
              onClick={() => { setOpen(false); onSelect(s); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', textAlign: 'left', border: 'none',
                background: 'none', padding: '10px 14px', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600,
                color: STATUS_COLOR[s] ?? 'var(--slate-700)',
                borderBottom: '1px solid var(--slate-100)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--slate-50)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: STATUS_COLOR[s] ?? '#94A3B8' }} />
              {STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SLA breach banner ─────────────────────────────────────────────────────────

function SlaBreachBanner({ type }: { type: 'response' | 'resolution' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '14px 18px', background: '#FEF2F2',
      border: '1px solid #FCA5A5', borderRadius: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
      <div>
        <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '0.88rem', color: '#B91C1C' }}>
          {type === 'response' ? 'Response' : 'Resolution'} SLA Breached — Status Updates Locked
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#DC2626', lineHeight: 1.5 }}>
          {type === 'response'
            ? 'The response window has passed. You can no longer update this ticket. Please contact your team lead to reassign or escalate.'
            : 'The resolution deadline has passed. You can no longer update this ticket. Please contact your team lead to escalate.'}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentTicketDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket,   setTicket]   = useState<TicketResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Scroll to top when navigating between tickets
  useEffect(() => {
    const main = document.querySelector('.dash-main') as HTMLElement | null;
    if (main) main.scrollTop = 0;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchTicketById(Number(id))
      .then(setTicket)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartWorking = async () => {
    if (!ticket) return;
    try {
      setUpdating(true); setError(null);
      const updated = await startWorkingOnTicket(ticket.id);
      setTicket(updated);
    } catch (e: any) { setError(e.message); }
    finally { setUpdating(false); }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      setUpdating(true); setError(null);
      const updated = await updateTicketStatus(ticket.id, newStatus);
      setTicket(updated);
    } catch (e: any) { setError(e.message); }
    finally { setUpdating(false); }
  };

  if (loading) return (
    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
      Loading ticket…
    </div>
  );
  if (error && !ticket) return (
    <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C' }}>
      {error}
    </div>
  );
  if (!ticket) return null;

  // ── Derived state ─────────────────────────────────────────────────────────

  const sla         = getSlaState(ticket);
  const isAssigned  = ticket.status === TicketStatus.ASSIGNED;
  const workStarted = !!ticket.work_started_at;
  const allowedNext = getAllowedTransitions(ticket.status as TicketStatus);

  // Lock all status controls when the active SLA has been breached
  const isLocked = sla.isBreached && sla.activeType !== 'none';

  // ── Response Due chip ─────────────────────────────────────────────────────
  //   ASSIGNED + not breached → live countdown
  //   ASSIGNED + breached     → Breached chip (also locked via isLocked above)
  //   After start working     → "Responded · <timestamp>" (timer stopped)
  //   RESOLVED / CLOSED       → SLA Met or Breached from resolution check
  function ResponseDueChip() {
    if (sla.isMet || ticket?.status === TicketStatus.CLOSED) return <SlaMetChip />;

    if (workStarted) {
      if (ticket?.first_response_at) {
        return (
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-600)', fontWeight: 500 }}>
            Responded · {fmt(ticket.first_response_at)}
          </span>
        );
      }
      return <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>Stopped</span>;
    }

    if (ticket?.response_due_at) {
      if (Date.now() > new Date(ticket.response_due_at).getTime()) {
        return <SlaBreachedChip label="Response Breached" />;
      }
      return <SlaLiveChip due={ticket.response_due_at} />;
    }
    return <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>—</span>;
  }

  // ── Resolution Due chip ───────────────────────────────────────────────────
  //   Not started yet              → "Starts on first response"
  //   Active (OPEN/IN_PROG/ON_HOLD/REOPENED) + not breached → live countdown
  //   Active + breached            → Breached chip (locked via isLocked)
  //   RESOLVED on time             → SLA Met
  //   RESOLVED late                → Breached
  //   CLOSED                       → SLA Met
  function ResolutionDueChip() {
    if (!workStarted) {
      return (
        <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
          Starts on first response
        </span>
      );
    }

    if (ticket?.status === TicketStatus.RESOLVED || ticket?.status === TicketStatus.CLOSED) {
      return sla.isMet ? <SlaMetChip /> : <SlaBreachedChip label="Resolution Breached" />;
    }

    if (ticket?.resolution_due_at) {
      if (Date.now() > new Date(ticket.resolution_due_at).getTime()) {
        return <SlaBreachedChip label="Resolution Breached" />;
      }
      return <SlaLiveChip due={ticket.resolution_due_at} />;
    }
    return <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>—</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 1. Page header ────────────────────────────────────────────── */}
      <div>
         <button
                  className="btn btn--outline btn--sm"
                  style={{ marginBottom: 12 }}
                  onClick={() => navigate(-1)}
                >
                  <BackIcon /> Back
                </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="dash-page-title" style={{ margin: 0 }}>{ticket.title}</h1>
          <StatusBadge status={ticket.status} />
          {ticket.is_escalated && (
            <span style={{ background: '#FFF1F2', color: '#E11D48', padding: '3px 12px',
              borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>
               Escalated
            </span>
          )}
          {/* Inline breach badge next to title */}
          {sla.isBreached && sla.activeType === 'response' && (
            <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '3px 10px',
              borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, border: '1px solid #FCA5A5' }}>
              🔴 Response SLA Breached
            </span>
          )}
          {sla.isBreached && sla.activeType === 'resolution' && (
            <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '3px 10px',
              borderRadius: 99, fontSize: '0.73rem', fontWeight: 700, border: '1px solid #FCA5A5' }}>
              🔴 Resolution SLA Breached
            </span>
          )}
        </div>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.82rem', margin: '6px 0 0' }}>
          {ticket.ticket_number} · Opened {fmt(ticket.created_at)}
        </p>
      </div>

      {/* ── 2. SLA breach banner — replaces action bar when locked ───── */}
      {isLocked && <SlaBreachBanner type={sla.activeType as 'response' | 'resolution'} />}

      {/* ── 3. Status action bar — hidden when locked ─────────────────── */}
      {!isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* "Start Working" only when ASSIGNED */}
          {isAssigned && (
            <button
              className="btn btn--primary"
              onClick={handleStartWorking}
              disabled={updating}
              style={{ background: '#059669', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <PlayIcon />
              {updating ? 'Starting…' : 'Start Working'}
            </button>
          )}

          {/* Dropdown for all post-ASSIGNED transitions */}
          {allowedNext.length > 0 && (
            <StatusDropdown
              options={allowedNext}
              onSelect={handleStatusChange}
              updating={updating}
            />
          )}

          {error && (
            <span style={{ fontSize: '0.82rem', color: '#B91C1C', background: '#FEF2F2',
              border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: 8 }}>
              {error}
            </span>
          )}
        </div>
      )}

      {/* ── 4. Ticket Details — 3-column grid ────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--slate-600)',
          textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Ticket Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px' }}>
          {/* Col 1 */}
          <div>
            <Row label="Ticket #">{ticket.ticket_number}</Row>
            <Row label="Priority"><PriorityBadge priority={ticket.priority} /></Row>
            <Row label="Severity">{ticket.severity}</Row>
            <Row label="Source">{ticket.source}</Row>
          </div>
          {/* Col 2 */}
          <div>
            <Row label="Category">{ticket.issue?.name ?? '—'}</Row>
            <Row label="Customer">{ticket.customer_email ?? '—'}</Row>
            <Row label="First Response">{fmt(ticket.first_response_at)}</Row>
            <Row label="Resolved At">{fmt(ticket.resolved_at)}</Row>
          </div>
          {/* Col 3 — live SLA chips */}
          <div>
            <Row label="Response Due"><ResponseDueChip /></Row>
            <Row label="Resolution Due"><ResolutionDueChip /></Row>
            <Row label="Created">{fmt(ticket.created_at)}</Row>
            <Row label="Last Updated">{fmt(ticket.updated_at)}</Row>
          </div>
        </div>
      </div>

      {/* ── 5. Description ────────────────────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>Description</h3>
        <p style={{ margin: 0, color: 'var(--slate-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {ticket.description}
        </p>
      </div>

      {/* ── 6. Attachments (if any) ───────────────────────────────────── */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>Attachments</h3>
          {ticket.attachments.map((a: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
              borderBottom: '1px solid var(--slate-100)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--blue-600)' }}>
                {a.original_name ?? a.filename ?? `Attachment ${i + 1}`}
              </span>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', color: '#2563EB', marginLeft: 8 }}>
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 7. Comments ───────────────────────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
        <CommentThread ticketId={ticket.id} currentRole="SUPPORT_AGENT" allowAttachments />
      </div>

    </div>
  );
}