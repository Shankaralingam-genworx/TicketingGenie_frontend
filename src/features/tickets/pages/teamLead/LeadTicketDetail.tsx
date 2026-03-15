import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchMyAgents,
  assignTicket,
  reassignEscalatedTicket,
  fetchTicketById,
  AgentUser,
} from '@/features/users/services/userService';
import { TicketResponse } from '../../types/ticket.types';
import {
  StatusBadge,
  PriorityBadge,
  SlaChip,
  EscalatedBadge,
  TicketSlaBreachBadges,
} from '../../components/TicketBadges';
import SlaCountdown  from '@/features/tickets/components/SlaCountdown';
import CommentThread from '@/components/common/CommentThread';
import { BackIcon }  from '@/components/icons';

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

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
  const [showOverride, setShowOverride] = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState<string | null>(null);
  const eligibleAgents = agents.filter(a => a.id !== oldAgentId);

  const submit = async () => {
    const id = parseInt(sel, 10);
    if (isNaN(id)) return;
    setBusy(true); setErr(null);
    try {
      await onReassign(id, respOverride ? parseFloat(respOverride) : undefined, resoOverride ? parseFloat(resoOverride) : undefined);
      onClose();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 14, padding: 28, width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>Reassign Escalated Ticket</h3><EscalatedBadge />
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-500)' }}>{ticket.ticket_number} — {ticket.title}</p>
        {ticket.escalation && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 9, marginBottom: 14, fontSize: '0.82rem', color: '#B91C1C' }}>
            <strong>Breach reason:</strong> {ticket.escalation.reason.replace(/_/g, ' ')}
          </div>
        )}
        <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-600)' }}>
          Previous agent: <strong style={{ color: '#DC2626' }}>{agents.find(a => a.id === oldAgentId)?.name ?? `Agent #${oldAgentId}`}</strong><span style={{ opacity: 0.6 }}> (blocked)</span>
        </p>
        {err && <p style={{ color: '#DC2626', fontSize: '0.83rem', marginBottom: 8 }}>{err}</p>}
        <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate-600)' }}>Reassign to</label>
        <select value={sel} onChange={e => setSel(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.9rem', marginTop: 6, background: 'var(--slate-50)' }}>
          <option value="">— Choose new agent —</option>
          {eligibleAgents.map(a => <option key={a.id} value={a.id}>{a.name ?? a.email}</option>)}
        </select>
        {sla && (
          <div style={{ marginTop: 10, padding: '9px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: '0.79rem', color: '#166534' }}>
            SLA defaults — Response: <strong>{sla.additional_response_mins || sla.response_time_mins} min</strong>{' · '}Resolution: <strong>{sla.additional_resolution_mins || sla.resolution_time_mins} min</strong>
          </div>
        )}
        <button onClick={() => setShowOverride(v => !v)} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.79rem', color: 'var(--slate-500)', fontWeight: 600, padding: 0 }}>
          {showOverride ? '▲ Hide overrides' : '▼ Override SLA windows (optional)'}
        </button>
        {showOverride && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            {[{ label: 'Response window (mins)', val: respOverride, set: setRespOverride }, { label: 'Resolution window (mins)', val: resoOverride, set: setResoOverride }].map(({ label, val, set }) => (
              <div key={label}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type="number" min="1" placeholder="mins" value={val} onChange={e => set(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontFamily: 'var(--font)', fontSize: '0.88rem' }} />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn--primary" onClick={submit} disabled={!sel || busy} style={{ background: '#DC2626' }}>{busy ? 'Reassigning…' : '⚡ Reassign'}</button>
          <button className="btn btn--outline" onClick={onClose} disabled={busy}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function LeadTicketDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket,         setTicket]         = useState<TicketResponse | null>(null);
  const [agents,         setAgents]         = useState<AgentUser[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [showReassign,   setShowReassign]   = useState(false);
  const [quickAssignSel, setQuickAssignSel] = useState('');
  const [assigning,      setAssigning]      = useState(false);

  useEffect(() => {
    const main = document.querySelector('.dash-main') as HTMLElement | null;
    if (main) main.scrollTop = 0;
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchTicketById(Number(id)), fetchMyAgents()])
      .then(([t, a]) => { setTicket(t); setAgents(a ?? []); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const doQuickAssign = async () => {
    if (!ticket || !quickAssignSel) return;
    const agentId = parseInt(quickAssignSel, 10);
    if (isNaN(agentId)) return;
    setAssigning(true); setError(null);
    try { const updated = await assignTicket(ticket.id, agentId); setTicket(updated); setQuickAssignSel(''); }
    catch (e: any) { setError(e.message); }
    finally { setAssigning(false); }
  };

  const doEscalatedReassign = async (newAgentId: number, responseMins?: number, resolutionMins?: number) => {
    if (!ticket) return;
    const updated = await reassignEscalatedTicket(ticket.id, {
      new_agent_id: newAgentId,
      escalated_response_mins: responseMins,
      escalated_resolution_mins: resolutionMins,
    });
    setTicket(updated);
  };

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading ticket…</div>;
  if (error && !ticket) return <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C' }}>{error}</div>;
  if (!ticket) return null;

  const assignedAgent = agents.find(a => a.id === ticket.assigned_agent_id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {showReassign && ticket.is_escalated && (
        <EscalationReassignModal ticket={ticket} agents={agents} onReassign={doEscalatedReassign} onClose={() => setShowReassign(false)} />
      )}

      {/* 1. Header */}
      <div>
        <button className="btn btn--outline btn--sm" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}>
          <BackIcon /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="dash-page-title" style={{ margin: 0 }}>{ticket.title}</h1>
          <StatusBadge status={ticket.status} />
          {ticket.is_escalated && <EscalatedBadge />}
        </div>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.82rem', margin: '6px 0 0' }}>
          {ticket.ticket_number} · Opened {fmt(ticket.created_at)}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <TicketSlaBreachBadges ticket={ticket} />
        </div>
      </div>

      {/* 2. Action bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {ticket.is_escalated ? (
          <button className="btn btn--primary" onClick={() => setShowReassign(true)} style={{ background: '#DC2626' }}>⚡ Reassign</button>
        ) : (
          <>
            <select style={{ padding: '8px 11px', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontFamily: 'var(--font)', fontSize: '0.85rem', background: 'var(--slate-50)' }} value={quickAssignSel} onChange={e => setQuickAssignSel(e.target.value)}>
              <option value="">Assign to…</option>
              {agents.map(a => <option key={a.id} value={String(a.id)}>{a.name ?? a.email}</option>)}
            </select>
            <button className="btn btn--outline" onClick={doQuickAssign} disabled={!quickAssignSel || assigning}>{assigning ? '…' : 'Assign'}</button>
          </>
        )}
        {error && <span style={{ fontSize: '0.82rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: 8 }}>{error}</span>}
      </div>

      {/* 3. Priority override notice */}
      {ticket.priority_overridden && (
        <div style={{ padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, fontSize: '0.83rem', color: '#92400E' }}>
          <strong>Priority Overridden</strong> — {ticket.priority_override_justification}
        </div>
      )}

      {/* 4. Ticket details grid */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px' }}>
          <div>
            <Row label="Ticket #">{ticket.ticket_number}</Row>
            <Row label="Priority"><PriorityBadge priority={ticket.priority} /></Row>
            <Row label="Customer Priority"><PriorityBadge priority={ticket.customer_priority} /></Row>
            <Row label="Severity">{ticket.severity}</Row>
          </div>
          <div>
            <Row label="Category">{ticket.issue?.name ?? '—'}</Row>
            <Row label="Customer">{ticket.customer_email ?? '—'}</Row>
            <Row label="Customer Tier">{ticket.customer_tier}</Row>
            <Row label="Assigned Agent">
              {assignedAgent
                ? <span style={{ fontWeight: 600, color: '#059669' }}>{assignedAgent.name ?? assignedAgent.email}</span>
                : ticket.assigned_agent_id
                  ? <span style={{ fontWeight: 600, color: '#059669' }}>Agent #{ticket.assigned_agent_id}</span>
                  : <span style={{ color: '#EF4444', fontWeight: 600 }}>Unassigned</span>
              }
            </Row>
          </div>
          <div>
            <Row label="Response Due"><SlaChip due={ticket.response_due_at} status={ticket.status} /></Row>
            <Row label="Resolution Due">
              {ticket.work_started_at
                ? <SlaChip due={ticket.resolution_due_at} status={ticket.status} />
                : <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Not started yet</span>
              }
            </Row>
            <Row label="First Response">{fmt(ticket.first_response_at)}</Row>
            <Row label="Created">{fmt(ticket.created_at)}</Row>
          </div>
        </div>

        {ticket.is_escalated && (
          <>
            <div style={{ margin: '16px 0 8px', paddingTop: 14, borderTop: '1px solid var(--slate-100)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#E11D48' }}>⚡ Escalated SLA</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <Row label="Esc. Response Due">
                {ticket.escalated_response_due_at
                  ? <SlaCountdown due={ticket.escalated_response_due_at} status={ticket.status} escalated />
                  : <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Not reassigned yet</span>}
              </Row>
              <Row label="Esc. Resolution Due">
                {ticket.escalated_resolution_due_at
                  ? <SlaCountdown due={ticket.escalated_resolution_due_at} status={ticket.status} escalated />
                  : <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>New agent not started</span>}
              </Row>
            </div>
          </>
        )}
      </div>

      {/* 5. Description */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>Description</h3>
        <p style={{ margin: 0, color: 'var(--slate-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
      </div>

      {/* 6. Escalation details */}
      {ticket.is_escalated && ticket.escalation && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: '#9F1239', textTransform: 'uppercase', letterSpacing: '0.07em' }}>⚡ Escalation Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
            <div>
              <Row label="Reason"><span style={{ textTransform: 'capitalize' }}>{ticket.escalation.reason.replace(/_/g, ' ')}</span></Row>
              <Row label="Escalated by">{ticket.escalation.escalated_by}</Row>
              <Row label="Escalated at">{fmt(ticket.escalation.escalated_at)}</Row>
            </div>
            <div>
              <Row label="Old agent"><span style={{ color: '#DC2626', fontWeight: 600 }}>{agents.find(a => a.id === ticket.escalation?.old_agent_id)?.name ?? `Agent #${ticket.escalation.old_agent_id}`}</span></Row>
              {ticket.escalation.new_agent_id && (
                <Row label="Reassigned to"><span style={{ color: '#059669', fontWeight: 600 }}>{agents.find(a => a.id === ticket.escalation?.new_agent_id)?.name ?? `Agent #${ticket.escalation.new_agent_id}`}</span></Row>
              )}
              {ticket.escalation.notes && (
                <Row label="Notes"><span style={{ fontSize: '0.82rem', color: '#9F1239', opacity: 0.8 }}>{ticket.escalation.notes}</span></Row>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Attachments */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>Attachments</h3>
          {ticket.attachments.map((a: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--slate-100)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--blue-600)' }}>{a.original_name ?? a.filename ?? `Attachment ${i + 1}`}</span>
              {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#2563EB', marginLeft: 8 }}>View</a>}
            </div>
          ))}
        </div>
      )}

      {/* 8. Comments */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
        <CommentThread ticketId={ticket.id} currentRole="TEAM_LEAD" allowAttachments />
      </div>

    </div>
  );
}