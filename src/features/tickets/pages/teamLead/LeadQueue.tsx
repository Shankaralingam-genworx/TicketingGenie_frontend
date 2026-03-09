/**
 * LeadQueue — Assignment Queue page.
 * File: src/features/tickets/pages/teamLead/LeadQueue.tsx
 *
 * Shows NEW + ACKNOWLEDGED unassigned tickets.
 * All filter / search / sort / pagination is backend-driven.
 * Default sort: remaining_time asc (most urgent first).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTeamQueue, fetchMyAgents, assignTicket,
  AgentUser, PaginatedTickets, TicketFilters,
} from '../../../../features/users/services/userApi';
import { TicketResponse } from '../../types/ticket.types';
import { PriorityBadge } from '../../components/TicketBadges';
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

// ── Assign modal ──────────────────────────────────────────────────────────────
function AssignModal({ ticket, agents, onAssign, onClose }: {
  ticket:   TicketResponse;
  agents:   AgentUser[];
  onAssign: (id: number) => Promise<void>;
  onClose:  () => void;
}) {
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
        <h3 style={{ margin: '0 0 4px' }}>Assign Ticket</h3>
        <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
          {ticket.ticket_number} — {ticket.title}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <PriorityBadge priority={ticket.priority} />
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{ticket.issue?.name ?? '—'}</span>
          <SlaCountdown due={ticket.resolution_due_at} />
        </div>
        {err && <p style={{ color: '#DC2626', fontSize: '0.83rem', marginBottom: 8 }}>{err}</p>}

        <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--slate-600)' }}>Select Agent</label>
        <select value={sel} onChange={e => setSel(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)',
            borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.9rem',
            marginTop: 6, marginBottom: 20, background: 'var(--slate-50)' }}>
          <option value="">— Choose agent —</option>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--primary" onClick={submit} disabled={!sel || busy}>
            {busy ? 'Assigning…' : 'Assign'}
          </button>
          <button className="btn btn--outline" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeadQueue() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<PaginatedTickets | null>(null);
  const [agents,  setAgents]  = useState<AgentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState<TicketResponse | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    sort_by: 'remaining_time', sort_dir: 'asc', per_page: 25,
  });

  const load = useCallback(async (f: TicketFilters) => {
    try {
      setLoading(true); setError(null);
      const [d, ags] = await Promise.all([fetchTeamQueue(f), fetchMyAgents()]);
      setData(d); setAgents(ags);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filters); }, []); // eslint-disable-line

  const doAssign = async (agentId: number) => {
    if (!modal) return;
    await assignTicket(modal.id, agentId);
    setData(prev => prev
      ? { ...prev, items: prev.items.filter(t => t.id !== modal.id), total: prev.total - 1 }
      : prev);
  };

  const tickets = data?.items ?? [];

  return (
    <>
      {modal && (
        <AssignModal ticket={modal} agents={agents}
          onAssign={doAssign} onClose={() => setModal(null)} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="dash-page-title">Assignment Queue</h1>
          <p className="dash-page-sub">
            Unassigned tickets — assign each to a free agent.
            {data != null && <> · <strong>{data.total}</strong> pending</>}
          </p>
        </div>
        <button className="btn btn--outline btn--sm"
          onClick={() => load(filters)} disabled={loading}>
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* No status filter on queue — always NEW + ACKNOWLEDGED only */}
      <FilterBar filters={filters} onChange={setFilters}
        onApply={f => { setFilters(f); load(f); }}
        loading={loading} showStatus={false} />

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2',
          border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div>
            <h3>Unassigned Tickets</h3>
            <p>Sorted by SLA urgency — most critical first</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading…</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            🎉 Queue is clear — no unassigned tickets.
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
                  <th>SLA Remaining</th>
                  <th>Arrived</th>
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
                    <td style={{ color: 'var(--slate-500)', fontSize: '0.83rem' }}>
                      {t.issue?.name ?? '—'}
                    </td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600,
                        textTransform: 'capitalize', color: SEV_COLOR[t.severity] ?? 'var(--slate-600)' }}>
                        {t.severity}
                      </span>
                    </td>
                    <td><SlaCountdown due={t.resolution_due_at} /></td>
                    <td style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn--primary btn--sm" onClick={() => setModal(t)}>
                          Assign
                        </button>
                        <button className="btn btn--outline btn--sm"
                          onClick={() => navigate(`/lead/tickets/${t.id}`)}>
                          View
                        </button>
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