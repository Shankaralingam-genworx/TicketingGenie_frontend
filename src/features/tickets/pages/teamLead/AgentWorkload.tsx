/**
 * AgentWorkload — Support Agent Workload page for Team Lead.
 * File: src/features/tickets/pages/teamLead/AgentWorkload.tsx  (NEW FILE)
 *
 * Shows each agent in the team with:
 *   - Total tickets + count per status
 *   - Expandable ticket list with live SLA countdown (loaded via detail=true)
 *   - Full filter / search / sort on the per-agent ticket list (backend-driven)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAgentWorkload, type AgentWorkload as AgentWorkloadData, TicketFilters,
} from '../../../../features/users/services/userApi';
import { TicketStatus } from '../../types/ticket.types';
import { StatusBadge, PriorityBadge } from '../../components/TicketBadges';
import FilterBar    from './FilterBar';
import SlaCountdown from '../../../tickets/components/SlaCountdown';

const RefreshIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7"
    style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 4a8 8 0 0112 0M16 16a8 8 0 01-12 0M4 16v-4h4M16 4v4h-4"/>
  </svg>
);

// Status colours for the breakdown chips
const STATUS_CHIP: Record<string, { bg: string; color: string }> = {
  new:          { bg: '#EFF6FF', color: '#2563EB' },
  acknowledged: { bg: '#E0F2FE', color: '#0284C7' },
  assigned:     { bg: '#F5F3FF', color: '#7C3AED' },
  open:         { bg: '#EFF6FF', color: '#2563EB' },
  in_progress:  { bg: '#FFF7ED', color: '#D97706' },
  on_hold:      { bg: '#FAF5FF', color: '#7C3AED' },
  resolved:     { bg: '#F0FDF4', color: '#16A34A' },
  closed:       { bg: '#F8FAFC', color: '#64748B' },
  reopened:     { bg: '#FEF2F2', color: '#DC2626' },
};
const STATUS_LABEL: Record<string, string> = {
  new: 'New', acknowledged: 'Ack', assigned: 'Assigned', open: 'Open',
  in_progress: 'In Progress', on_hold: 'On Hold',
  resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened',
};

// Active statuses for the workload indicator (resolved/closed don't count)
const ACTIVE_STATUSES = new Set([
  TicketStatus.ASSIGNED, TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS, TicketStatus.ON_HOLD,
]);

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, navigate, onExpand, expanded }: {
  agent:     AgentWorkloadData;
  navigate:  ReturnType<typeof useNavigate>;
  onExpand:  () => void;
  expanded:  boolean;
}) {
  const active = agent.by_status
    .filter(b => ACTIVE_STATUSES.has(b.status as TicketStatus))
    .reduce((s, b) => s + b.count, 0);

  const initials = (agent.agent_name || agent.agent_email).slice(0, 2).toUpperCase();

  return (
    <div style={{ background: 'white', border: '1px solid var(--slate-200)',
      borderRadius: 12, overflow: 'hidden' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
        {/* Avatar */}
        <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#A5B4FC,#6D28D9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>
          {initials}
        </div>

        {/* Name / email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: 'var(--slate-800)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.agent_name || agent.agent_email}
          </p>
          {agent.agent_name && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              {agent.agent_email}
            </p>
          )}
        </div>

        {/* Total + active indicator */}
        <div style={{ textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800,
            color: active > 5 ? '#DC2626' : active > 2 ? '#D97706' : '#16A34A' }}>
            {agent.total}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--slate-400)',
            textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            total
          </div>
        </div>

        {/* Status breakdown chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 2, justifyContent: 'flex-end' }}>
          {agent.by_status.map(b => {
            const chip = STATUS_CHIP[b.status] ?? { bg: '#F1F5F9', color: '#334155' };
            return (
              <span key={b.status} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                background: chip.bg, color: chip.color,
              }}>
                {STATUS_LABEL[b.status] ?? b.status}
                <span style={{ fontWeight: 800 }}>{b.count}</span>
              </span>
            );
          })}
          {agent.total === 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>No tickets</span>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={onExpand}
          className="btn btn--outline btn--sm"
          style={{ marginLeft: 8, flexShrink: 0 }}>
          {expanded ? 'Hide' : 'View Tickets'}
        </button>
      </div>

      {/* Expanded ticket list */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--slate-100)', overflowX: 'auto' }}>
          {agent.tickets.length === 0 ? (
            <div style={{ padding: '24px 20px', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
              No tickets match the current filters.
            </div>
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Remaining</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {agent.tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, color: 'var(--blue-600)', fontFamily: 'monospace' }}>
                      {t.ticket_number}
                    </td>
                    <td style={{ maxWidth: 220, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SlaCountdown due={t.resolution_due_at} /></td>
                    <td>
                      <button className="btn btn--outline btn--sm"
                        onClick={() => navigate(`/lead/tickets/${t.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgentWorkload() {
  const navigate = useNavigate();
  const [agents,   setAgents]   = useState<AgentWorkloadData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filters,  setFilters]  = useState<TicketFilters>({
    sort_by: 'remaining_time', sort_dir: 'asc', per_page: 50,
  });

  const load = useCallback(async (f: TicketFilters, withDetail = expanded.size > 0) => {
    try {
      setLoading(true); setError(null);
      const data = await fetchAgentWorkload(f, withDetail);
      setAgents(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [expanded.size]);

  useEffect(() => { load(filters, false); }, []); // eslint-disable-line

  const toggleExpand = async (agentId: number) => {
    const next = new Set(expanded);
    if (next.has(agentId)) {
      next.delete(agentId);
      setExpanded(next);
    } else {
      next.add(agentId);
      setExpanded(next);
      // Reload with detail=true to get ticket lists
      await load(filters, true);
    }
  };

  const totalActive = agents.reduce((s, a) =>
    s + a.by_status.filter(b => ACTIVE_STATUSES.has(b.status as TicketStatus))
      .reduce((x, b) => x + b.count, 0), 0);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 className="dash-page-title">Agent Workload</h1>
          <p className="dash-page-sub">
            Live view of what each agent is working on.
            {agents.length > 0 && (
              <> · <strong>{agents.length}</strong> agents · <strong>{totalActive}</strong> active tickets</>
            )}
          </p>
        </div>
        <button className="btn btn--outline btn--sm"
          onClick={() => load(filters, expanded.size > 0)} disabled={loading}>
          <RefreshIcon /> Refresh
        </button>
      </div>

      <FilterBar filters={filters} onChange={setFilters}
        onApply={f => { setFilters(f); load(f, expanded.size > 0); }}
        loading={loading} showStatus={true} />

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2',
          border: '1px solid #FCA5A5', borderRadius: 10, color: '#B91C1C', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>Loading…</div>
      ) : agents.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
          No agents found in your team.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agents.map(a => (
            <AgentCard
              key={a.agent_id}
              agent={a}
              navigate={navigate}
              expanded={expanded.has(a.agent_id)}
              onExpand={() => toggleExpand(a.agent_id)}
            />
          ))}
        </div>
      )}
    </>
  );
}