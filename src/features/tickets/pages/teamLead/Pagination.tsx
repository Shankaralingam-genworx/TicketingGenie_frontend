/**
 * Pagination — simple page navigator.
 * File: src/features/tickets/pages/teamLead/Pagination.tsx
 */
import React from 'react';

interface Props {
  page:     number;
  pages:    number;
  total:    number;
  perPage:  number;
  onChange: (p: number) => void;
}

export default function Pagination({ page, pages, total, perPage, onChange }: Props) {
  if (pages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, total);

  const raw  = [1, pages, page - 1, page, page + 1].filter(p => p >= 1 && p <= pages);
  const nums = Array.from(new Set(raw)).sort((a, b) => a - b);

  const btnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 7, fontSize: '0.8rem',
    fontWeight: active ? 700 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: active ? '1.5px solid var(--blue-500)' : '1.5px solid var(--slate-200)',
    background: active ? 'var(--blue-50)' : 'white',
    color: active ? 'var(--blue-700)' : disabled ? 'var(--slate-300)' : 'var(--slate-700)',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px 4px', flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
        {start}–{end} of {total}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          style={btnStyle(false, page === 1)}>‹</button>

        {nums.map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && n - nums[i - 1] > 1 && (
              <span style={{ color: 'var(--slate-400)', padding: '0 2px' }}>…</span>
            )}
            <button onClick={() => onChange(n)} style={btnStyle(n === page, false)}>{n}</button>
          </React.Fragment>
        ))}

        <button onClick={() => onChange(page + 1)} disabled={page === pages}
          style={btnStyle(false, page === pages)}>›</button>
      </div>
    </div>
  );
}