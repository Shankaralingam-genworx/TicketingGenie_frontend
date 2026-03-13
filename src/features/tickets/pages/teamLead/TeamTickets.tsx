/**
 * TeamTickets — All Tickets page for Team Lead.
 * File: src/features/tickets/pages/teamLead/TeamTickets.tsx
 *
 * Changes vs previous version:
 *   - Escalated tickets use reassignEscalatedTicket() (not assignTicket())
 *   - ReassignModal shows escalation override fields when ticket.is_escalated
 *   - Escalated rows highlighted in amber + ⚡ icon in agent column
 *   - TicketSlaBreachBadges shown inline for breached rows
 *   - SlaCountdown shows escalated clock for escalated tickets
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTeamAllTickets, fetchMyAgents, assignTicket, reassignEscalatedTicket,
  AgentUser, PaginatedTickets, TicketFilters,
} from '../../../../features/users/services/userApi';
import { TicketResponse, TicketStatus } from '../../types/ticket.types';
import { StatusBadge, PriorityBadge, EscalatedBadge } from '../../components/TicketBadges';
import FilterBar    from './FilterBar';
import SlaCountdown from '../../../tickets/components/SlaCountdown';
import Pagination   from './Pagination';
import { RefreshIcon } from '@/components/icons';



const SEV_COLOR: Record<string, string> = {
  critical: '#DC2626', high: '#D97706', medium: '#2563EB', low: '#64748B',
};

const REASSIGNABLE = new Set<string>([
  TicketStatus.ASSIGNED, TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD,
]);

// ── Unified reassign/assign modal ─────────────────────────────────────────────
function ReassignModal({ ticket, agents, onDone, onClose }: {
  ticket:   TicketResponse;
  agents:   AgentUser[];
  onDone:   (updated: TicketResponse) => void;
  onClose:  () => void;
}) {
  const currentId  = ticket.assigned_agent_id;
  const oldAgentId = ticket.escalation?.old_agent_id;
  const sla        = ticket.sla;

  const [sel,          setSel]          = useState('');
  const [respOverride, setRespOverride] = useState('');
  const [resoOverride, setResoOverride] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState<string | null>(null);

  // For escalated tickets, block the old agent
  const eligibleAgents = ticket.is_escalated
    ? agents.filter(a => a.id !== oldAgentId)
    : agents.filter(a => a.id !== currentId);

  const submit = async () => {
    const id = parseInt(sel, 10);
    if (isNaN(id)) return;
    setBusy(true); setErr(null);
    try {
      let updated: TicketResponse;
      if (ticket.is_escalated) {
        updated = await reassignEscalatedTicket(ticket.id, {
          new_agent_id:              id,
          escalated_response_mins:   respOverride ? parseFloat(respOverride) : null,
          escalated_resolution_mins: resoOverride ? parseFloat(resoOverride) : null,
        });
      } else {
        updated = await assignTicket(ticket.id, id);
      }
      onDone(updated); onClose();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>{ticket.is_escalated ? 'Reassign Escalated Ticket' : 'Reassign Ticket'}</h3>
          {ticket.is_escalated && <EscalatedBadge />}
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
          {ticket.ticket_number} — {ticket.title}
        </p>

        {ticket.is_escalated && ticket.escalation && (
          <div style={{ padding: '9px 12px', background: '#FEF2F2',
            border: '1px solid #FCA5A5', borderRadius: 8, marginBottom: 12,
            fontSize: '0.81rem', color: '#B91C1C' }}>
            <strong>Breach:</strong> {ticket.escalation.reason.replace(/_/g, ' ')}
            <br/>
            <strong>Old agent (blocked):</strong>{' '}
            {agents.find(a => a.id === oldAgentId)?.name ?? `Agent #${oldAgentId}`}
          </div>
        )}

        {!ticket.is_escalated && currentId && (
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem' }}>
            Currently: <strong>
              {agents.find(a => a.id === currentId)?.name ?? `Agent #${currentId}`}
            </strong>
          </p>
        )}

        {err && <p style={{ color: '#DC2626', fontSize: '0.83rem', marginBottom: 8 }}>{err}</p>}

        <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--slate-600)' }}>
          {ticket.is_escalated ? 'Reassign to' : 'Reassign to'}
        </label>
        <select value={sel} onChange={e => setSel(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)',
            borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.9rem',
            marginTop: 6, background: 'var(--slate-50)' }}>
          <option value="">— Choose agent —</option>
          {eligibleAgents.map(a => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
        </select>

        {/* SLA defaults + overrides for escalated tickets */}
        {ticket.is_escalated && sla && (
          <>
            <div style={{ marginTop: 10, padding: '9px 12px', background: '#F0FDF4',
              borderRadius: 8, fontSize: '0.79rem', color: '#166534' }}>
              SLA defaults — Response: <strong>{sla.additional_response_mins || sla.response_time_mins} min</strong>
              {' · '}Resolution: <strong>{sla.additional_resolution_mins || sla.resolution_time_mins} min</strong>
            </div>
            <button onClick={() => setShowOverride(v => !v)}
              style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.79rem', color: 'var(--slate-500)', fontWeight: 600, padding: 0 }}>
              {showOverride ? '▲ Hide' : '▼ Override SLA windows (optional)'}
            </button>
            {showOverride && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                {[
                  { label: 'Response (mins)', val: respOverride, set: setRespOverride },
                  { label: 'Resolution (mins)', val: resoOverride, set: setResoOverride },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-500)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      display: 'block', marginBottom: 3 }}>{label}</label>
                    <input type="number" min="1" placeholder="mins"
                      value={val} onChange={e => set(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px',
                        border: '1.5px solid var(--slate-200)', borderRadius: 8,
                        fontFamily: 'var(--font)', fontSize: '0.88rem' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn--primary" onClick={submit} disabled={!sel || busy}
            style={ticket.is_escalated ? { background: '#DC2626' } : {}}>
            {busy ? '…' : ticket.is_escalated ? '⚡ Reassign' : 'Reassign'}
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

  const handleReassignDone = (updated: TicketResponse) => {
    setData(prev => prev
      ? { ...prev, items: prev.items.map(t => t.id === updated.id ? updated : t) }
      : prev);
  };

  const tickets      = data?.items ?? [];
  const active       = tickets.filter(t => REASSIGNABLE.has(t.status)).length;
  const resolved     = tickets.filter(t => [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as TicketStatus)).length;
  const escalated    = tickets.filter(t => t.is_escalated).length;
  const unassigned   = tickets.filter(t => !t.assigned_agent_id).length;

  return (
    <>
      {modal && (
        <ReassignModal ticket={modal} agents={agents}
          onDone={handleReassignDone} onClose={() => setModal(null)} />
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
         <RefreshIcon style={{ width: "24px", height: "24px" }} /> Refresh
        </button>
      </div>

      {/* Stat row */}
      {data != null && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { l: 'Total',      v: data.total, c: '#2563EB', bg: '#EFF6FF' },
            { l: 'Active',     v: active,     c: '#D97706', bg: '#FFF7ED' },
            { l: 'Escalated',  v: escalated,  c: '#DC2626', bg: '#FEF2F2' },
            { l: 'Resolved',   v: resolved,   c: '#16A34A', bg: '#F0FDF4' },
            { l: 'Unassigned', v: unassigned, c: '#7C3AED', bg: '#F5F3FF' },
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
                  <th>SLA</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => {
                  // Pick the right SLA clock: escalated tickets show escalated clock
                  const slaDue = t.is_escalated
                    ? (t.escalated_response_due_at ?? t.escalated_resolution_due_at ?? t.resolution_due_at)
                    : t.resolution_due_at;
                  const isEscClock = t.is_escalated && !!(t.escalated_response_due_at ?? t.escalated_resolution_due_at);

                  return (
                    <tr key={t.id}
                      style={{ background: t.is_escalated ? '#FFFBEB' : undefined }}>
                      <td style={{ fontWeight: 600, color: 'var(--blue-600)', fontFamily: 'monospace' }}>
                        {t.ticket_number}
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                        {(t.response_sla_breached || t.resolution_sla_breached) && (
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>
                            🔴
                          </span>
                        )}
                      </td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600,
                          textTransform: 'capitalize', color: SEV_COLOR[t.severity] ?? 'var(--slate-600)' }}>
                          {t.severity}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <StatusBadge status={t.status} />
                          {t.is_escalated && <EscalatedBadge />}
                        </div>
                      </td>
                      <td style={{
                        fontSize: '0.83rem',
                        color: t.assigned_agent_id ? 'var(--slate-600)' : '#EF4444',
                        fontWeight: t.assigned_agent_id ? 400 : 600,
                      }}>
                        {t.assigned_agent_id
                          ? (agents.find(a => a.id === t.assigned_agent_id)?.name ?? `Agent #${t.assigned_agent_id}`)
                          : 'Unassigned'}
                      </td>
                      <td>
                        <SlaCountdown due={slaDue} status={t.status} escalated={isEscClock} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--outline btn--sm"
                            onClick={() => navigate(`/lead/tickets/${t.id}`)}>
                            View
                          </button>
                          {REASSIGNABLE.has(t.status) && (
                            <button className="btn btn--outline btn--sm"
                              onClick={() => setModal(t)}
                              style={t.is_escalated ? { borderColor: '#DC2626', color: '#DC2626' } : {}}>
                              {t.is_escalated ? '⚡' : ''} Reassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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