import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAssignedTickets } from '../../../../features/users/services/userApi';
import { TicketResponse } from '../../types/ticket.types';
import { StatusBadge, PriorityBadge, SlaChip } from '../../components/TicketBadges';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RefreshIcon = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4a8 8 0 0112 0M16 16a8 8 0 01-12 0M4 16v-4h4M16 4v4h-4" /></svg>;

export default function AgentTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      setTickets(await fetchAssignedTickets());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const open       = tickets.filter((t) => ['NEW','IN_PROGRESS','PENDING_CUSTOMER'].includes(t.status)).length;
  const resolved   = tickets.filter((t) => ['RESOLVED','CLOSED'].includes(t.status)).length;
  const overdueSLA = tickets.filter((t) => t.resolution_due_at && new Date(t.resolution_due_at) < new Date()).length;

  return (
    <>
      <div className="dash-page-hdr" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="dash-page-title">My Assigned Tickets</h1>
          <p className="dash-page-sub">Tickets assigned to you by your team lead.</p>
        </div>
        <button className="btn btn--outline" onClick={load} disabled={loading}>
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="dash-stats">
          {[
            { label: 'Assigned',    value: tickets.length, bg: '#EFF6FF', ic: '#2563EB' },
            { label: 'Active',      value: open,           bg: '#FFF7ED', ic: '#D97706' },
            { label: 'Resolved',    value: resolved,       bg: '#F0FDF4', ic: '#22C55E' },
            { label: 'SLA at Risk', value: overdueSLA,     bg: '#FEF2F2', ic: '#EF4444' },
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
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="dash-table-wrap">
        <div className="dash-table-hdr">
          <div><h3>Ticket Queue</h3><p>Work through tickets in priority order</p></div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading…</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            No tickets assigned to you yet.
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Ticket #</th><th>Subject</th><th>Priority</th><th>Status</th><th>SLA</th><th>Created</th><th /></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, color: 'var(--blue-600)', fontFamily: 'monospace' }}>{t.ticket_number}</td>
                  <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><SlaChip due={t.resolution_due_at} /></td>
                  <td style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>{fmt(t.created_at)}</td>
                  <td>
                    <button className="btn btn--outline btn--sm" onClick={() => navigate(`/agent/tickets/${t.id}`)}>
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