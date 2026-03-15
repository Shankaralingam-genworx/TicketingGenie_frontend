/**
 * AssignedTickets — single "My Tickets" page for Support Agent.
 * File: src/features/tickets/pages/agent/AssignedTickets.tsx
 *
 * SLA column logic:
 *   ASSIGNED (before start working) → show Response Due countdown
 *   OPEN / IN_PROGRESS / ON_HOLD   → show Resolution Due countdown
 *   RESOLVED (before resolution_due_at passed) → SLA Met badge
 *   RESOLVED (after  resolution_due_at passed) → SLA Breached badge
 *   CLOSED                          → SLA Met badge
 *   REOPENED                        → SLA Breached badge (deadline already passed)
 *
 * If whichever due date has already passed → show "SLA Breached" badge.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAssignedTickets,
  PaginatedTickets,
  TicketFilters,
} from '@/features/users/services/userService';
import { TicketResponse, TicketStatus } from '../../types/ticket.types';
import { StatusBadge, PriorityBadge } from '../../components/TicketBadges';
import FilterBar  from '@/features/tickets/pages/teamLead/FilterBar';
import Pagination from '@/features/tickets/pages/teamLead/Pagination';
import { RefreshIcon } from '@/components/icons';

// ── Icons ─────────────────────────────────────────────────────────────────────


// ── Constants ─────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  critical: '#DC2626', high: '#D97706', medium: '#2563EB', low: '#64748B',
};

// Statuses that are "active" — show Work button, response/resolution SLA running
const ACTIVE = new Set<string>([
  TicketStatus.ASSIGNED,
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.ON_HOLD,
]);

// Statuses where response SLA is what matters (agent hasn't started working yet)
const RESPONSE_SLA_STATUSES = new Set<string>([
  TicketStatus.ASSIGNED,
]);

// Statuses where resolution SLA is running
const RESOLUTION_SLA_STATUSES = new Set<string>([
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.ON_HOLD,
]);

// ── Smart SLA cell ────────────────────────────────────────────────────────────

function SlaCell({ ticket }: { ticket: any }) {
  const status = ticket.status as TicketStatus;
  const now    = Date.now();

  // ── Resolved: check if resolved before deadline
  if (status === TicketStatus.RESOLVED) {
    const resolvedAt     = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : null;
    const resolutionDue  = ticket.resolution_due_at ? new Date(ticket.resolution_due_at).getTime() : null;
    if (resolvedAt && resolutionDue && resolvedAt <= resolutionDue) {
      return <SlaBadge type="met" />;
    }
    // resolved late or no deadline
    return <SlaBadge type="breached" label="Resolution Breached" />;
  }

  // ── Closed: always SLA Met (lead closed it after review)
  if (status === TicketStatus.CLOSED) {
    return <SlaBadge type="met" />;
  }

  // ── Reopened: resolution deadline already passed
  if (status === TicketStatus.REOPENED) {
    return <SlaBadge type="breached" label="SLA Breached" />;
  }

  // ── ASSIGNED: response SLA is the clock to watch
  if (RESPONSE_SLA_STATUSES.has(status)) {
    const due = ticket.response_due_at ? new Date(ticket.response_due_at).getTime() : null;
    if (!due) return <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>—</span>;
    if (now > due) return <SlaBadge type="breached" label="Response Breached" />;
    return <SlaCountdownChip due={due} label="Response Due" />;
  }

  // ── OPEN / IN_PROGRESS / ON_HOLD: resolution SLA is the clock
  if (RESOLUTION_SLA_STATUSES.has(status)) {
    const due = ticket.resolution_due_at ? new Date(ticket.resolution_due_at).getTime() : null;
    if (!due) return <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>—</span>;
    if (now > due) return <SlaBadge type="breached" label="Resolution Breached" />;
    return <SlaCountdownChip due={due} label="Resolution Due" />;
  }

  // NEW / ACKNOWLEDGED — no SLA chip yet
  return <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>—</span>;
}

function SlaBadge({ type, label }: { type: 'met' | 'breached'; label?: string }) {
  if (type === 'met') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.73rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
        background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0',
        whiteSpace: 'nowrap',
      }}>
        ✓ SLA Met
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.73rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5',
      whiteSpace: 'nowrap',
    }}>
      ⚠ {label ?? 'SLA Breached'}
    </span>
  );
}

function SlaCountdownChip({ due, label }: { due: number; label: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const diff = due - Date.now();
  if (diff <= 0) return <SlaBadge type="breached" label={label.replace(' Due', ' Breached')} />;

  const hrs  = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const urgent = hrs < 4;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: urgent ? '#FFF7ED' : '#F0FDF4',
      color:      urgent ? '#D97706' : '#16A34A',
      whiteSpace: 'nowrap',
    }}>
      {`${hrs}h ${mins}m`}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssignedTickets() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<PaginatedTickets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    sort_by: 'remaining_time', sort_dir: 'asc', per_page: 25,
  });

const load = useCallback(async (f: TicketFilters) => {
  try {
    setLoading(true);
    setError(null);
    const res = await fetchAssignedTickets(f);
    setTickets(res);

  } catch (e: any) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => { load(filters); }, []); // eslint-disable-line

  const [tickets, setTickets] = useState<TicketResponse[]>([]);

  const active   = tickets.filter(t => ACTIVE.has(t.status)).length;
  const resolved = tickets.filter(t =>
    [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as TicketStatus)).length;
  const atRisk   = tickets.filter(t => {
    const due = RESPONSE_SLA_STATUSES.has(t.status)
      ? t.response_due_at
      : t.resolution_due_at;
    return due && new Date(due).getTime() - Date.now() < 4 * 3_600_000
      && ACTIVE.has(t.status);
  }).length;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="dash-page-title">My Tickets</h1>
          <p className="dash-page-sub">
            All tickets assigned to you — use filters to narrow by status, priority or severity.
            {data != null && <> · <strong>{data.total}</strong> total</>}
          </p>
        </div>
        <button className="btn btn--outline btn--sm"
          onClick={() => load(filters)} disabled={loading}>
              <RefreshIcon style={{ width: 24, height: 24 }} /> Refresh
        </button>
      </div>

      {/* Stat row */}
      {data != null && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { l: 'Total',    v: data.total, c: '#2563EB', bg: '#EFF6FF' },
            { l: 'Active',   v: active,     c: '#D97706', bg: '#FFF7ED' },
            { l: 'Resolved', v: resolved,   c: '#16A34A', bg: '#F0FDF4' },
            { l: 'SLA Risk', v: atRisk,     c: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.l} style={{ padding: '12px 20px', borderRadius: 10,
              background: s.bg, minWidth: 110 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.c, opacity: 0.7,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      )}

      <FilterBar
        filters={filters} onChange={setFilters}
        onApply={f => { setFilters(f); load(f); }}
        loading={loading} showStatus={true}
      />

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2',
          border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div>
            <h3>Ticket Queue</h3>
            <p>Filter by status to focus on what you need — defaults to most urgent first</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            Loading…
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            No tickets match your filters.
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>
                    {tickets.some(t => t.status === TicketStatus.ASSIGNED)
                      ? 'Response Due'
                      : 'Resolution Due'}
                  </th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => {
                  // Determine if SLA is breached for this ticket
                  const isResponseBreached =
                    RESPONSE_SLA_STATUSES.has(t.status) &&
                    t.response_due_at &&
                    Date.now() > new Date(t.response_due_at).getTime();

                  const isResolutionBreached =
                    RESOLUTION_SLA_STATUSES.has(t.status) &&
                    t.resolution_due_at &&
                    Date.now() > new Date(t.resolution_due_at).getTime();

                  const isSlaBreached = isResponseBreached || isResolutionBreached;

                  return (
                    <tr key={t.id} style={isSlaBreached ? { background: '#FFF5F5' } : {}}>
                      <td style={{ fontWeight: 600, color: 'var(--blue-600)',
                        fontFamily: 'monospace' }}>
                        {t.ticket_number}
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </td>
                      <td style={{ color: 'var(--slate-500)', fontSize: '0.83rem' }}>
                        {t.issue?.name ?? '—'}
                      </td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600,
                          textTransform: 'capitalize',
                          color: SEV_COLOR[t.severity] ?? 'var(--slate-600)' }}>
                          {t.severity}
                        </span>
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td><SlaCell ticket={t} /></td>
                      <td style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className={`btn btn--sm ${isSlaBreached ? 'btn--outline' : ACTIVE.has(t.status) ? 'btn--primary' : 'btn--outline'}`}
                          style={isSlaBreached ? { borderColor: '#FCA5A5', color: '#DC2626' } : {}}
                          onClick={() => navigate(`/agent/tickets/${t.id}`)}>
                          {ACTIVE.has(t.status) ? 'Work' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data && (
              <Pagination
                page={data.page} pages={data.pages}
                total={data.total} perPage={data.per_page}
                onChange={p => {
                  const f = { ...filters, page: p };
                  setFilters(f); load(f);
                }}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}