/**
 * TeamTickets — All Tickets page for Team Lead.
 * File: src/features/tickets/pages/teamLead/TeamTickets.tsx
 *
 * Shows every ticket for the team across all statuses.
 * - All filter / search / sort / pagination is backend-driven
 * - Live SLA countdown on each row
 * - Reassign available only for: assigned, open, in_progress, on_hold
 * - No reassign for: resolved, closed (and other terminal statuses)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTeamAllTickets, fetchMyAgents, assignTicket,
  AgentUser, PaginatedTickets, TicketFilters,
} from '../../../../features/users/services/userApi';
import { TicketResponse, TicketStatus } from '../../types/ticket.types';
import { StatusBadge, PriorityBadge } from '../../components/TicketBadges';
import FilterBar    from './FilterBar';
import SlaCountdown from '../../../tickets/components/SlaCountdown';
import Pagination   from './Pagination';

const RefreshIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
    style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 4a8 8 0 0112 0M16 16a8 8 0 01-12 0M4 16v-4h4M16 4v4h-4"/>
  </svg>
);

const SEV_COLOR: Record<string, string> = {
  critical: '#DC2626', high: '#D97706', medium: '#2563EB', low: '#64748B',
};

// Statuses that allow reassignment by team lead
const REASSIGNABLE = new Set<string>([
  TicketStatus.ASSIGNED, TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD,
]);

// ── Reassign modal ────────────────────────────────────────────────────────────
function ReassignModal({ ticket, agents, onAssign, onClose }: {
  ticket:   TicketResponse;
  agents:   AgentUser[];
  onAssign: (id: number) => Promise<void>;
  onClose:  () => void;
}) {
  const currentId = ticket.assigned_agent_id;
  const [sel,  setSel]  = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);

  const submit = async () => {
    const id = parseInt(sel, 10);
    if (isNaN(id)) return;
    setBusy(true); setErr(null);
    try { await onAssign(id); onClose(); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 4px' }}>Reassign Ticket</h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
          {ticket.ticket_number} — {ticket.title}
        </p>
        {currentId && (
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem' }}>
            Currently:{' '}
            <strong>{agents.find(a => a.id === currentId)?.name ?? `Agent #${currentId}`}</strong>
          </p>
        )}
        {err && <p style={{ color: '#DC2626', fontSize: '0.83rem', marginBottom: 8 }}>{err}</p>}

        <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--slate-600)' }}>Reassign to</label>
        <select value={sel} onChange={e => setSel(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)',
            borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.9rem',
            marginTop: 6, marginBottom: 20, background: 'var(--slate-50)' }}>
          <option value="">— Choose agent —</option>
          {agents.filter(a => a.id !== currentId)
            .map(a => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--primary" onClick={submit} disabled={!sel || busy}>
            {busy ? 'Reassigning…' : 'Reassign'}
          </button>
          <button className="btn btn--outline" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TeamTickets() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<PaginatedTickets | null>(null);
  const [agents,  setAgents]  = useState<AgentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState<TicketResponse | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    sort_by: 'created_at', sort_dir: 'desc', per_page: 25,
  });

  const load = useCallback(async (f: TicketFilters) => {
    try {
      setLoading(true); setError(null);
      const [d, ags] = await Promise.all([fetchTeamAllTickets(f), fetchMyAgents()]);
      setData(d); setAgents(ags);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filters); }, []); // eslint-disable-line

  const doReassign = async (agentId: number) => {
    if (!modal) return;
    const updated = await assignTicket(modal.id, agentId);
    setData(prev => prev
      ? { ...prev, items: prev.items.map(t => t.id === updated.id ? updated : t) }
      : prev);
  };

  const tickets = data?.items ?? [];

  // Quick counts from the current page (cosmetic only — true totals come from backend)
  const active     = tickets.filter(t => REASSIGNABLE.has(t.status)).length;
  const resolved   = tickets.filter(t => [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status)).length;
  const unassigned = tickets.filter(t => !t.assigned_agent_id).length;

  return (
    <>
      {modal && (
        <ReassignModal ticket={modal} agents={agents}
          onAssign={doReassign} onClose={() => setModal(null)} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="dash-page-title">All Team Tickets</h1>
          <p className="dash-page-sub">
            Every status.{data != null && <> · <strong>{data.total}</strong> total</>}
          </p>
        </div>
        <button className="btn btn--outline btn--sm"
          onClick={() => load(filters)} disabled={loading}>
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Stat row */}
      {data != null && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { l: 'Total',      v: data.total, c: '#2563EB', bg: '#EFF6FF' },
            { l: 'Active',     v: active,     c: '#D97706', bg: '#FFF7ED' },
            { l: 'Resolved',   v: resolved,   c: '#16A34A', bg: '#F0FDF4' },
            { l: 'Unassigned', v: unassigned, c: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.l} style={{ padding: '12px 20px', borderRadius: 10,
              background: s.bg, minWidth: 110 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.c, opacity: 0.7,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <FilterBar filters={filters} onChange={setFilters}
        onApply={f => { setFilters(f); load(f); }}
        loading={loading} showStatus={true} />

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2',
          border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div>
            <h3>Team Tickets</h3>
            <p>Reassign available for assigned / open / in-progress / on-hold only</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading…</div>
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
                  <th>Priority</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>SLA Remaining</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--blue-600)', fontFamily: 'monospace' }}>
                      {t.ticket_number}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600,
                        textTransform: 'capitalize', color: SEV_COLOR[t.severity] ?? 'var(--slate-600)' }}>
                        {t.severity}
                      </span>
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{
                      fontSize: '0.83rem',
                      color: t.assigned_agent_id ? 'var(--slate-600)' : '#EF4444',
                      fontWeight: t.assigned_agent_id ? 400 : 600,
                    }}>
                      {t.assigned_agent_id
                        ? (agents.find(a => a.id === t.assigned_agent_id)?.name ?? `Agent #${t.assigned_agent_id}`)
                        : 'Unassigned'}
                    </td>
                    <td><SlaCountdown due={t.resolution_due_at} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn--outline btn--sm"
                          onClick={() => navigate(`/lead/tickets/${t.id}`)}>
                          View
                        </button>
                        {REASSIGNABLE.has(t.status) && (
                          <button className="btn btn--outline btn--sm"
                            onClick={() => setModal(t)}>
                            Reassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && (
              <Pagination page={data.page} pages={data.pages}
                total={data.total} perPage={data.per_page}
                onChange={p => { const f = { ...filters, page: p }; setFilters(f); load(f); }} />
            )}
          </>
        )}
      </div>
    </>
  );
}