import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyTickets } from '../../../../hooks/useTickets';
import { TicketStatus, STATUS_LABEL, PRIORITY_LABEL } from '../../types/ticket.types';
import { TicketResponse } from '../../types/ticket.types';

export const STATUS_CLASS: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'badge--new',
  [TicketStatus.ACKNOWLEDGED]: 'badge--acknowledged',
  [TicketStatus.ASSIGNED]: 'badge--assigned',
  [TicketStatus.OPEN]: 'badge--open',
  [TicketStatus.IN_PROGRESS]: 'badge--in-progress',
  [TicketStatus.ON_HOLD]: 'badge--on-hold',
  [TicketStatus.RESOLVED]: 'badge--resolved',
  [TicketStatus.CLOSED]: 'badge--closed',
  [TicketStatus.REOPENED]: 'badge--reopened',
};

const PRIORITY_CLASS: Record<string, string> = {
  p1: 'badge--critical',
  p2: 'badge--high',
  p3: 'badge--medium',
  p4: 'badge--low',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatsBar({ tickets }: { tickets: TicketResponse[] }) {
  const open     = tickets.filter((t) => [TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status)).length;
  const resolved = tickets.filter((t) => [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status)).length;
  return (
    <div className="dash-stats">
      {[
        { label: 'Total Tickets',       value: tickets.length, bg: '#EFF6FF', ic: '#2563EB' },
        { label: 'Open / In Progress',  value: open,           bg: '#FEF2F2', ic: '#EF4444' },
        { label: 'Resolved / Closed',   value: resolved,       bg: '#F0FDF4', ic: '#22C55E' },
      ].map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-card-icon" style={{ background: c.bg }}>
            <span style={{ color: c.ic, fontWeight: 800, fontSize: '1.1rem' }}>{c.value}</span>
          </div>
          <div className="stat-card-label">{c.label}</div>
          <div className="stat-card-value">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

const PlusIcon    = () => <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path strokeLinecap="round" d="M7 2v10M2 7h10" /></svg>;
const RefreshIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 15, height: 15 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4a8 8 0 0112 0M16 16a8 8 0 01-12 0M4 16v-4h4M16 4v4h-4" /></svg>;

export default function MyTickets() {
  const navigate = useNavigate();
  const { tickets, loading, error, refresh } = useMyTickets();

  return (
    <>
      <div className="dash-page-hdr" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="dash-page-title">My Support Tickets</h1>
          <p className="dash-page-sub">Track the status of all your submitted requests.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--outline" onClick={refresh} disabled={loading}><RefreshIcon /> Refresh</button>
          <button className="btn btn--primary" onClick={() => navigate('/customer/new-ticket')}> {/* ✅ fixed */}
            <PlusIcon /> New Ticket
          </button>
        </div>
      </div>

      {!loading && !error && <StatsBar tickets={tickets} />}

      {error && (
        <div style={{ padding: '14px 18px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div><h3>Ticket History</h3><p>Your submitted support requests</p></div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            <p style={{ fontSize: '1rem', marginBottom: 12 }}>No tickets yet.</p>
            <button className="btn btn--primary" onClick={() => navigate('/customer/new-ticket')}> {/* ✅ fixed */}
              <PlusIcon /> Raise your first ticket
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Ticket #</th><th>Subject</th><th>Priority</th><th>Status</th><th>Submitted</th><th>Due</th><th /></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, color: 'var(--blue-600)', fontFamily: 'monospace' }}>{t.ticket_number}</td>
                  <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                  <td>
                    <span className={`badge badge--dot ${PRIORITY_CLASS[t.priority] ?? ''}`}>
                      {PRIORITY_LABEL[t.priority as keyof typeof PRIORITY_LABEL] ?? t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_CLASS[t.status] ?? ''}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>{fmtDate(t.created_at)}</td>
                  <td style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>{t.resolution_due_at ? fmtDate(t.resolution_due_at) : '—'}</td>
                  <td>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => navigate(`/customer/tickets/${t.id}`)} // ✅ fixed
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}