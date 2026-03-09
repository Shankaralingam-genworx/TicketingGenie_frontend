import React from 'react';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  new:              { label: 'New',          bg: '#EFF6FF', color: '#2563EB' },
  acknowledged:     { label: 'Acknowledged', bg: '#E0F2FE', color: '#0284C7' },
  assigned:         { label: 'Assigned',     bg: '#F5F3FF', color: '#7C3AED' },
  open:             { label: 'Open',         bg: '#EFF6FF', color: '#2563EB' },
  in_progress:      { label: 'In Progress',  bg: '#FFF7ED', color: '#D97706' },
  on_hold:          { label: 'On Hold',      bg: '#FAF5FF', color: '#7C3AED' },
  resolved:         { label: 'Resolved',     bg: '#F0FDF4', color: '#16A34A' },
  closed:           { label: 'Closed',       bg: '#F8FAFC', color: '#64748B' },
  reopened:         { label: 'Reopened',     bg: '#FEF2F2', color: '#DC2626' },
  // uppercase fallbacks
  NEW:              { label: 'New',          bg: '#EFF6FF', color: '#2563EB' },
  IN_PROGRESS:      { label: 'In Progress',  bg: '#FFF7ED', color: '#D97706' },
  PENDING_CUSTOMER: { label: 'Pending',      bg: '#FAF5FF', color: '#7C3AED' },
  RESOLVED:         { label: 'Resolved',     bg: '#F0FDF4', color: '#16A34A' },
  CLOSED:           { label: 'Closed',       bg: '#F8FAFC', color: '#64748B' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: '#F1F5F9', color: '#334155' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  p1: { label: 'P1 · Critical', color: '#DC2626' },
  p2: { label: 'P2 · High',     color: '#D97706' },
  p3: { label: 'P3 · Medium',   color: '#2563EB' },
  p4: { label: 'P4 · Low',      color: '#64748B' },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY_MAP[priority.toLowerCase()] ?? { label: priority, color: '#334155' };
  return (
    <span style={{ color: p.color, fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
      {p.label}
    </span>
  );
}

export function SlaChip({ due }: { due: string | null }) {
  if (!due) return <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>—</span>;
  const diff    = new Date(due).getTime() - Date.now();
  const overdue = diff < 0;
  const hrs     = Math.floor(Math.abs(diff) / 3_600_000);
  const mins    = Math.floor((Math.abs(diff) % 3_600_000) / 60_000);
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: overdue ? '#FEF2F2' : hrs < 4 ? '#FFF7ED' : '#F0FDF4',
      color:      overdue ? '#DC2626' : hrs < 4 ? '#D97706' : '#16A34A',
    }}>
      {overdue ? `⚠ ${hrs}h overdue` : `${hrs}h ${mins}m left`}
    </span>
  );
}
