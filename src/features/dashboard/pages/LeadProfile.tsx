import React, { useEffect, useState } from 'react';
import ProfilePage from '../components/ProfilePage';
import { userService, type AgentUser } from '@/features/users/services/userService';
import type { TicketResponse } from '@/features/tickets/types/ticket.types';

export default function LeadProfile() {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [agents,  setAgents]  = useState<AgentUser[]>([]);

  useEffect(() => {
    userService.fetchTeamAllTickets({ per_page: 200 })
      .then((r) => setTickets(r.items)).catch(() => {});
    userService.fetchMyAgents().then(setAgents).catch(() => {});
  }, []);

  const open    = tickets.filter((t) => ['new','assigned','open','in_progress','on_hold','reopened'].includes(t.status)).length;
  const resolved = tickets.filter((t) => ['resolved','closed'].includes(t.status)).length;
  const overdue  = tickets.filter((t) => t.resolution_due_at && new Date(t.resolution_due_at) < new Date()).length;

  return (
    <ProfilePage
      statsTitle="Team Summary"
      stats={[
        { label: 'Total',      value: tickets.length, color: '#2563EB' },
        { label: 'Active',     value: open,            color: '#D97706' },
        { label: 'Resolved',   value: resolved,        color: '#16A34A' },
        { label: 'SLA Breach', value: overdue,         color: '#DC2626' },
      ]}
      extraDetails={[
        { label: 'Team Agents', value: String(agents.length) },
      ]}
    >
      {/* Agents list */}
      {agents.length > 0 && (
        <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            My Agents
          </h3>
          {agents.map((a) => (
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
      )}
    </ProfilePage>
  );
}
