import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../../hooks/useAppDispatch';
import { fetchTeamTickets, fetchMyAgents, AgentUser } from '../../../features/users/services/userApi';
import { TicketResponse } from '../../../features/tickets/types/ticket.types';

export default function LeadProfile() {
  const user     = useAppSelector((s) => s.auth.user);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'TL';

  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [agents,  setAgents]  = useState<AgentUser[]>([]);

  useEffect(() => {
    // fetchTeamTickets now returns PaginatedTickets — extract .items
    fetchTeamTickets({ per_page: 200 }).then(r => setTickets(r.items)).catch(() => {});
    fetchMyAgents().then(setAgents).catch(() => {});
  }, []);

  const open     = tickets.filter((t) => ['new','in_progress','on_hold','assigned','open'].includes(t.status)).length;
  const resolved = tickets.filter((t) => ['resolved','closed'].includes(t.status)).length;
  const overdue  = tickets.filter((t) => t.resolution_due_at && new Date(t.resolution_due_at) < new Date()).length;

  return (
    <>
      <div className="dash-page-hdr">
        <h1 className="dash-page-title">My Profile</h1>
        <p className="dash-page-sub">Your team lead account and team overview.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Identity */}
        <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#A78BFA,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--slate-800)' }}>{user?.email}</p>
            <span style={{ background: '#F5F3FF', color: '#5B21B6', padding: '3px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, marginTop: 6, display: 'inline-block' }}>
              Team Lead
            </span>
          </div>
          <div style={{ width: '100%', borderTop: '1px solid var(--slate-100)', paddingTop: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Team Agents</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#6D28D9' }}>{agents.length}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team stats */}
          <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Team Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {[
                { label: 'Total',      value: tickets.length, color: '#2563EB' },
                { label: 'Active',     value: open,           color: '#D97706' },
                { label: 'Resolved',   value: resolved,       color: '#16A34A' },
                { label: 'SLA Breach', value: overdue,        color: '#DC2626' },
              ].map((c) => (
                <div key={c.label} style={{ textAlign: 'center', padding: '16px 10px', background: 'var(--slate-50)', borderRadius: 10 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: 4 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agents list */}
          <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>My Agents</h3>
            {agents.length === 0 ? (
              <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No agents found.</p>
            ) : agents.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--slate-100)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
                  {(a.name ?? a.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: 'var(--slate-800)' }}>{a.name ?? a.email}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-400)' }}>{a.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}