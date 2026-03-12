/**
 * SlaCountdown — live SLA countdown timer.
 * File: src/features/tickets/components/SlaCountdown.tsx
 *
 * Supports two modes:
 *   normal    → shows resolution_due_at countdown
 *   escalated → shows escalated_response_due_at or escalated_resolution_due_at
 *               with an orange ⚡ indicator so leads know it's an escalated clock
 *
 * Colour rules:
 *   > 4h left   → green
 *   < 4h left   → amber/orange (urgent)
 *   expired     → red pill "⚠ SLA Breached"
 *   resolved/closed → green pill "✓ SLA Met"
 */
import { useEffect, useRef, useState } from 'react';

const MET      = new Set(['resolved', 'closed']);
const BREACHED = new Set(['reopened']);

function getMs(due: string): number {
  return new Date(due).getTime() - Date.now();
}

function fmtMs(ms: number): string {
  const abs = Math.abs(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    Math.floor(abs / 3_600_000),
    Math.floor(abs / 60_000) % 60,
    Math.floor(abs / 1_000)  % 60,
  ].map(pad).join(':');
}

const pill = (bg: string, color: string, border: string, label: string) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
    padding: '3px 9px', borderRadius: 99,
    background: bg, color, border: `1px solid ${border}`,
  }}>
    {label}
  </span>
);

interface Props {
  due?:      string | null;
  status?:   string;
  escalated?: boolean;  // true → show ⚡ prefix on countdown
}

export default function SlaCountdown({ due, status, escalated = false }: Props) {
  const [rem, setRem] = useState<number | null>(due ? getMs(due) : null);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!due) { setRem(null); return; }
    setRem(getMs(due));
    ref.current = setInterval(() => {
      const ms = getMs(due);
      setRem(ms);
      if (ms <= 0 && ref.current) { clearInterval(ref.current); ref.current = null; }
    }, 1_000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [due]);

  const s = status?.toLowerCase() ?? '';
  if (MET.has(s))      return pill('#F0FDF4', '#15803D', '#BBF7D0', '✓ SLA Met');
  if (BREACHED.has(s)) return pill('#FEF2F2', '#DC2626', '#FCA5A5', '⚠ SLA Breached');
  if (!due || rem === null) return <span style={{ color: 'var(--slate-400)', fontSize: '0.78rem' }}>—</span>;
  if (rem <= 0) return pill('#FEF2F2', '#DC2626', '#FCA5A5', '⚠ SLA Breached');

  const warn   = rem < 4 * 3_600_000;
  const prefix = escalated ? '' : '';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
      padding: '3px 9px', borderRadius: 99,
      background: warn ? '#FFF7ED' : '#F0FDF4',
      color:      warn ? '#D97706' : '#15803D',
      border:     `1px solid ${warn ? '#FED7AA' : '#BBF7D0'}`,
    }}>
      {prefix}{fmtMs(rem)}
    </span>
  );
}