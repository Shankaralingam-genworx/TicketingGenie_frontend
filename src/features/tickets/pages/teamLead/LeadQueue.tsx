/**
 * LeadQueue — Assignment Queue page.
 * File: src/features/tickets/pages/teamLead/LeadQueue.tsx
 *
 * Changes from previous version:
 *   - NEW tab: "Escalated" — shows is_escalated=true tickets waiting for reassignment
 *   - Assign modal for normal tickets (NEW / ACKNOWLEDGED)
 *   - Escalation Reassign modal for escalated tickets:
 *       - Select new agent (old_agent blocked)
 *       - Optional override: escalated_response_mins + escalated_resolution_mins
 *       - Falls back to SLA policy additional mins if not overridden
 *   - Shows response_sla_breached badge on each escalated row
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchTeamQueue, fetchEscalatedTickets, fetchMyAgents,
  assignTicket, reassignEscalatedTicket,
  AgentUser, PaginatedTickets, TicketFilters,
} from '../../../../features/users/services/userApi';
import { TicketResponse } from '../../types/ticket.types';
import { PriorityBadge, EscalatedBadge, SlaBreachBadge } from '../../components/TicketBadges';
import FilterBar    from './FilterBar';
import SlaCountdown from '../../../tickets/components/SlaCountdown';
import Pagination   from './Pagination';
import { RefreshIcon } from '@/components/icons';



const SEV_COLOR: Record<string, string> = {
  critical: '#DC2626', high: '#D97706', medium: '#2563EB', low: '#64748B',
};

// ── Normal Assign modal ───────────────────────────────────────────────────────
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 4px' }}>Assign Ticket</h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
          {ticket.ticket_number} — {ticket.title}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <PriorityBadge priority={ticket.priority} />
          <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{ticket.issue?.name ?? '—'}</span>
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

// ── Escalation Reassign modal ─────────────────────────────────────────────────
function EscalationReassignModal({ ticket, agents, onReassign, onClose }: {
  ticket:     TicketResponse;
  agents:     AgentUser[];
  onReassign: (newAgentId: number, responseMins?: number, resolutionMins?: number) => Promise<void>;
  onClose:    () => void;
}) {
  const oldAgentId = ticket.escalation?.old_agent_id;
  const sla        = ticket.sla;

  const [sel,          setSel]          = useState('');
  const [respOverride, setRespOverride] = useState('');
  const [resoOverride, setResoOverride] = useState('');
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);

  const eligibleAgents = agents.filter(a => a.id !== oldAgentId);

  const submit = async () => {
    const id = parseInt(sel, 10);
    if (isNaN(id)) return;
    const respMins = respOverride ? parseFloat(respOverride) : undefined;
    const resoMins = resoOverride ? parseFloat(resoOverride) : undefined;
    setBusy(true); setErr(null);
    try { await onReassign(id, respMins, resoMins); onClose(); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  };

  const oldAgentName = agents.find(a => a.id === oldAgentId)?.name
    ?? (oldAgentId ? `Agent #${oldAgentId}` : '—');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Title */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>Reassign Escalated Ticket</h3>
          <EscalatedBadge />
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
          {ticket.ticket_number} — {ticket.title}
        </p>

        {/* Breach info banner */}
        {ticket.escalation && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2',
            border: '1px solid #FCA5A5', borderRadius: 9, marginBottom: 16,
            fontSize: '0.82rem', color: '#B91C1C' }}>
            <strong>Reason:</strong> {ticket.escalation.reason.replace(/_/g, ' ')}
            {ticket.escalation.notes && (
              <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{ticket.escalation.notes}</p>
            )}
          </div>
        )}

        {/* Old agent blocked notice */}
        <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--slate-600)' }}>
          Previous agent: <strong style={{ color: '#DC2626' }}>{oldAgentName}</strong>
          <span style={{ opacity: 0.6 }}> (blocked from reassignment)</span>
        </p>

        {err && <p style={{ color: '#DC2626', fontSize: '0.83rem', marginBottom: 8 }}>{err}</p>}

        {/* Agent select */}
        <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--slate-600)' }}>Reassign to</label>
        <select value={sel} onChange={e => setSel(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)',
            borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.9rem',
            marginTop: 6, background: 'var(--slate-50)' }}>
          <option value="">— Choose new agent —</option>
          {eligibleAgents.map(a => (
            <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
          ))}
        </select>

        {/* SLA defaults from policy */}
        {sla && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0FDF4',
            borderRadius: 8, fontSize: '0.79rem', color: '#166534' }}>
            SLA defaults — Response: <strong>{sla.additional_response_mins || sla.response_time_mins} min</strong>
            {' · '}Resolution: <strong>{sla.additional_resolution_mins || sla.resolution_time_mins} min</strong>
          </div>
        )}

        {/* Override toggle */}
        <button
          onClick={() => setShowOverride(v => !v)}
          style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.79rem', color: 'var(--slate-500)', fontWeight: 600, padding: 0 }}>
          {showOverride ? '▲ Hide overrides' : '▼ Override SLA windows (optional)'}
        </button>

        {showOverride && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--slate-500)',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                Response window (mins)
              </label>
              <input type="number" min="1" placeholder="e.g. 60"
                value={respOverride} onChange={e => setRespOverride(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--slate-200)',
                  borderRadius: 8, fontFamily: 'var(--font)', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--slate-500)',
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                Resolution window (mins)
              </label>
              <input type="number" min="1" placeholder="e.g. 240"
                value={resoOverride} onChange={e => setResoOverride(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--slate-200)',
                  borderRadius: 8, fontFamily: 'var(--font)', fontSize: '0.88rem' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn--primary" onClick={submit}
            disabled={!sel || busy}
            style={{ background: '#DC2626' }}>
            {busy ? 'Reassigning…' : '⚡ Reassign'}
          </button>
          <button className="btn btn--outline" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Tab = 'queue' | 'escalated';

export default function LeadQueue() {
  const navigate = useNavigate();
  const [tab,     setTab]     = useState<Tab>('queue');
  const [data,    setData]    = useState<PaginatedTickets | null>(null);
  const [agents,  setAgents]  = useState<AgentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState<{ ticket: TicketResponse; type: 'assign' | 'escalate' } | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({
    sort_by: 'remaining_time', sort_dir: 'asc', per_page: 25,
  });

  const load = useCallback(async (f: TicketFilters, t: Tab = tab) => {
    try {
      setLoading(true); setError(null);
      const [d, ags] = await Promise.all([
        t === 'queue' ? fetchTeamQueue(f) : fetchEscalatedTickets(f),
        fetchMyAgents(),
      ]);
      setData(d); setAgents(ags);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(filters, 'queue'); }, []); // eslint-disable-line

  const switchTab = (t: Tab) => {
    setTab(t);
    const f = { ...filters, page: 1 };
    setFilters(f);
    load(f, t);
  };

  const doAssign = async (agentId: number) => {
    if (!modal) return;
    await assignTicket(modal.ticket.id, agentId);
    setData(prev => prev
      ? { ...prev, items: prev.items.filter(t => t.id !== modal.ticket.id), total: prev.total - 1 }
      : prev);
  };

  const doReassign = async (newAgentId: number, responseMins?: number, resolutionMins?: number) => {
    if (!modal) return;
    const updated = await reassignEscalatedTicket(modal.ticket.id, {
      new_agent_id:              newAgentId,
      escalated_response_mins:   responseMins ?? null,
      escalated_resolution_mins: resolutionMins ?? null,
    });
    setData(prev => prev
      ? { ...prev, items: prev.items.map(t => t.id === updated.id ? updated : t) }
      : prev);
  };

  const tickets = data?.items ?? [];

  // Tab style helper
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? '#6D28D9' : 'var(--slate-100)',
    color: active ? 'white' : 'var(--slate-600)',
  });

  const escalatedCount = tab === 'escalated' ? data?.total ?? 0 : 0;

  return (
    <>
      {modal?.type === 'assign' && (
        <AssignModal ticket={modal.ticket} agents={agents}
          onAssign={doAssign} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'escalate' && (
        <EscalationReassignModal ticket={modal.ticket} agents={agents}
          onReassign={doReassign} onClose={() => setModal(null)} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="dash-page-title">Assignment Queue</h1>
          <p className="dash-page-sub">
            {tab === 'queue'
              ? 'Unassigned tickets — assign each to a free agent.'
              : 'Escalated tickets — reassign to a different agent.'}
            {data != null && <> · <strong>{data.total}</strong> {tab === 'queue' ? 'pending' : 'escalated'}</>}
          </p>
        </div>
        <button className="btn btn--outline btn--sm"
          onClick={() => load(filters)} disabled={loading}>
         <RefreshIcon style={{ width: "24px", height: "24px" }} /> Refresh
        </button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={tabStyle(tab === 'queue')} onClick={() => switchTab('queue')}>
          Queue
        </button>
        <button style={tabStyle(tab === 'escalated')} onClick={() => switchTab('escalated')}>
           Escalated
          {escalatedCount > 0 && (
            <span style={{ marginLeft: 6, background: '#DC2626', color: 'white',
              borderRadius: 99, fontSize: '0.68rem', padding: '1px 6px', fontWeight: 800 }}>
              {escalatedCount}
            </span>
          )}
        </button>
      </div>

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
            <h3>{tab === 'queue' ? 'Unassigned Tickets' : 'Escalated Tickets'}</h3>
            <p>
              {tab === 'queue'
                ? 'Sorted by SLA urgency — most critical first'
                : 'Cannot be reassigned to the same agent — SLA additional windows apply'}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading…</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            {tab === 'queue' ? 'Queue is clear — no unassigned tickets.' : 'No escalated tickets.'}
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
                  {tab === 'escalated' ? (
                    <>
                      <th>Old Agent</th>
                      <th>Breach Reason</th>
                      <th>Response SLA</th>
                    </>
                  ) : (
                    <th>Response Due</th>
                  )}
                  <th>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ background: t.is_escalated ? '#FFFBEB' : undefined }}>
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
                    {tab === 'escalated' ? (
                      <>
                        <td style={{ fontSize: '0.82rem', color: '#DC2626', fontWeight: 600 }}>
                          {agents.find(a => a.id === t.escalation?.old_agent_id)?.name
                            ?? (t.escalation?.old_agent_id ? `Agent #${t.escalation.old_agent_id}` : '—')}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: 'var(--slate-600)',
                            background: '#FEF2F2', padding: '2px 8px', borderRadius: 6 }}>
                            {t.escalation?.reason?.replace(/_/g, ' ') ?? '—'}
                          </span>
                        </td>
                        <td>
                          <SlaCountdown
                            due={t.escalated_response_due_at ?? t.response_due_at}
                            status={t.status}
                            escalated={!!t.escalated_response_due_at} />
                        </td>
                      </>
                    ) : (
                      <td><SlaCountdown due={t.response_due_at} status={t.status} /></td>
                    )}
                    <td style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {tab === 'escalated' ? (
                          <button className="btn btn--primary btn--sm"
                            onClick={() => setModal({ ticket: t, type: 'escalate' })}
                            style={{ background: '#DC2626' }}>
                            ⚡ Reassign
                          </button>
                        ) : (
                          <button className="btn btn--primary btn--sm"
                            onClick={() => setModal({ ticket: t, type: 'assign' })}>
                            Assign
                          </button>
                        )}
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