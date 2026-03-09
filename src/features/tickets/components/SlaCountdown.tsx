/**
 * SlaCountdown — live SLA stopwatch, ticks every second.
 * File: src/features/tickets/components/SlaCountdown.tsx
 *
 * green  = >4 h remaining
 * amber  = <4 h remaining
 * red    = overdue (shows negative time prefixed with −)
 */
import { useEffect, useState } from 'react';

function compute(due: string | null) {
  if (!due) return null;
  const diff = new Date(due).getTime() - Date.now();
  const abs  = Math.abs(diff);
  const pad  = (n: number) => String(n).padStart(2, '0');
  const h    = Math.floor(abs / 3_600_000);
  const m    = Math.floor(abs / 60_000) % 60;
  const s    = Math.floor(abs / 1_000)  % 60;
  return {
    label:   `${pad(h)}:${pad(m)}:${pad(s)}`,
    overdue: diff < 0,
    warn:    diff >= 0 && diff < 4 * 3_600_000,
  };
}

export default function SlaCountdown({ due }: { due: string | null }) {
  const [state, setState] = useState(() => compute(due));

  useEffect(() => {
    if (!due) return;
    setState(compute(due));
    const id = setInterval(() => setState(compute(due)), 1_000);
    return () => clearInterval(id);
  }, [due]);

  if (!due || !state) {
    return <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>—</span>;
  }

  const { label, overdue, warn } = state;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
      padding: '3px 9px', borderRadius: 99,
      background: overdue ? '#FEF2F2' : warn ? '#FFF7ED' : '#F0FDF4',
      color:      overdue ? '#DC2626' : warn ? '#D97706' : '#15803D',
      border: `1px solid ${overdue ? '#FCA5A5' : warn ? '#FED7AA' : '#BBF7D0'}`,
    }}>
      {overdue && <span style={{ fontSize: '0.65rem' }}>⚠</span>}
      {overdue ? `−${label}` : label}
    </span>
  );
}