import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketDetail } from '../../../../hooks/useTickets';
import { STATUS_LABEL, PRIORITY_LABEL, TicketStatus } from '../../types/ticket.types';
import CommentThread from '../../../../components/common/CommentThread';

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const STATUS_COLOR: Record<TicketStatus, { bg: string; color: string }> = {
  [TicketStatus.NEW]: { bg: '#F1F5F9', color: '#475569' },
  [TicketStatus.ACKNOWLEDGED]: { bg: '#E0F2FE', color: '#0284C7' },
  [TicketStatus.ASSIGNED]: { bg: '#F5F3FF', color: '#7C3AED' },
  [TicketStatus.OPEN]: { bg: '#EFF6FF', color: '#2563EB' },
  [TicketStatus.IN_PROGRESS]: { bg: '#FFF7ED', color: '#D97706' },
  [TicketStatus.ON_HOLD]: { bg: '#FAF5FF', color: '#7C3AED' },
  [TicketStatus.RESOLVED]: { bg: '#F0FDF4', color: '#16A34A' },
  [TicketStatus.CLOSED]: { bg: '#F8FAFC', color: '#64748B' },
  [TicketStatus.REOPENED]: { bg: '#FEF2F2', color: '#DC2626' },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--slate-100)' }}>
      <span style={{ minWidth: 180, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', paddingTop: 2 }}>{label}</span>
      <span style={{ color: 'var(--slate-800)', fontSize: '0.9rem' }}>{children}</span>
    </div>
  );
}

function SLATimer({ due }: { due: string | null }) {
  if (!due) return <span style={{ color: 'var(--slate-400)' }}>—</span>;
  const diff    = new Date(due).getTime() - Date.now();
  const hrs     = Math.floor(Math.abs(diff) / 3_600_000);
  const mins    = Math.floor((Math.abs(diff) % 3_600_000) / 60_000);
  const overdue = diff < 0;
  return (
    <span style={{ color: overdue ? '#DC2626' : '#16A34A', fontWeight: 600 }}>
      {overdue ? '⚠ Overdue ' : ''}{fmt(due)} {!overdue && `(${hrs}h ${mins}m left)`}
    </span>
  );
}

const BackIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10H5M9 6l-4 4 4 4" />
  </svg>
);

export default function TicketDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, loading, error } = useTicketDetail(id ? Number(id) : null);

  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading ticket…</div>;
  if (error)   return <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C' }}>{error}</div>;
  if (!ticket) return null;

  const statusStyle = STATUS_COLOR[ticket.status] ?? { bg: '#F1F5F9', color: '#334155' };

  return (
    <>
      <div style={{ marginBottom: 6 }}>
        <button
          className="btn btn--outline btn--sm"
          style={{ marginBottom: 14 }}
          onClick={() => navigate('/customer/tickets')} 
        >
          <BackIcon /> Back to Tickets
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 className="dash-page-title" style={{ margin: 0 }}>{ticket.title}</h1>
          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '3px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700 }}>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
          {ticket.is_escalated && (
            <span style={{ background: '#FFF1F2', color: '#E11D48', padding: '3px 12px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700 }}>⚡ Escalated</span>
          )}
        </div>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.82rem', margin: '6px 0 0' }}>
          Ticket #{ticket.ticket_number} · Opened {fmt(ticket.created_at)}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginTop: 24, alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>Description</h3>
            <p style={{ margin: 0, color: 'var(--slate-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>Attachments</h3>
              {ticket.attachments.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--slate-100)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--blue-600)' }}>{a.filename ?? `Attachment ${i + 1}`}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comment thread — customer can reply to agent messages */}
          <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 24 }}>
            <CommentThread ticketId={ticket.id} currentRole="CUSTOMER" />
          </div>
        </div>

        {/* Right: metadata */}
        <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 22 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ticket Details</h3>
          <Row label="Ticket #">{ticket.ticket_number}</Row>
          <Row label="Priority">
            <span className={`badge badge--dot badge--${ticket.priority.toLowerCase()}`}>
              {PRIORITY_LABEL[ticket.priority as keyof typeof PRIORITY_LABEL] ?? ticket.priority}
            </span>
          </Row>
          <Row label="Severity">{ticket.severity}</Row>
          <Row label="Source">{ticket.source}</Row>
          <Row label="Issue Category">{ticket.issue?.name ?? ticket.issue_id ?? '—'}</Row>
          <Row label="Assigned Agent">{ticket.assigned_agent_id ? `Agent #${ticket.assigned_agent_id}` : 'Unassigned'}</Row>

          <div style={{ margin: '14px 0 6px', paddingTop: 14, borderTop: '1px solid var(--slate-100)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)' }}>SLA</span>
          </div>
          <Row label="Response Due"><SLATimer due={ticket.response_due_at} /></Row>
          <Row label="Resolution Due"><SLATimer due={ticket.resolution_due_at} /></Row>
          <Row label="First Response">{fmt(ticket.first_response_at)}</Row>

          <div style={{ margin: '14px 0 6px', paddingTop: 14, borderTop: '1px solid var(--slate-100)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)' }}>Timeline</span>
          </div>
          <Row label="Created">{fmt(ticket.created_at)}</Row>
          <Row label="Last Updated">{fmt(ticket.updated_at)}</Row>
          <Row label="Resolved At">{fmt(ticket.resolved_at)}</Row>
          <Row label="Closed At">{fmt(ticket.closed_at)}</Row>
        </div>
      </div>
    </>
  );
}