/**
 * FilterBar — backend-driven filter / search / sort toolbar.
 * File: src/features/tickets/pages/teamLead/FilterBar.tsx
 *
 * Search: local draft state — fires onApply only on Enter or ✕ clear.
 * Category: same pattern — fires onApply only on Enter or when cleared.
 * All other controls (dropdowns, sort) still fire onApply immediately.
 */
import React, { useEffect, useState } from 'react';
import { TicketFilters } from '@/features/users/services/userService';

const STATUS_OPTS = [
  { v: 'new',          l: 'New'          },
  { v: 'acknowledged', l: 'Acknowledged' },
  { v: 'assigned',     l: 'Assigned'     },
  { v: 'open',         l: 'Open'         },
  { v: 'in_progress',  l: 'In Progress'  },
  { v: 'on_hold',      l: 'On Hold'      },
  { v: 'resolved',     l: 'Resolved'     },
  { v: 'closed',       l: 'Closed'       },
  { v: 'reopened',     l: 'Reopened'     },
];
const PRIORITY_OPTS = [
  { v: 'p1', l: 'P1 · Critical' },
  { v: 'p2', l: 'P2 · High'     },
  { v: 'p3', l: 'P3 · Medium'   },
  { v: 'p4', l: 'P4 · Low'      },
];
const SEVERITY_OPTS = [
  { v: 'critical', l: 'Critical' },
  { v: 'high',     l: 'High'     },
  { v: 'medium',   l: 'Medium'   },
  { v: 'low',      l: 'Low'      },
];
const SORT_OPTS = [
  { v: 'remaining_time', l: 'SLA Remaining' },
  { v: 'priority',       l: 'Priority'      },
  { v: 'severity',       l: 'Severity'      },
  { v: 'created_at',     l: 'Date Created'  },
];

const ctrl: React.CSSProperties = {
  padding: '7px 11px', border: '1.5px solid var(--slate-200)',
  borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.82rem',
  background: 'white', color: 'var(--slate-700)', outline: 'none',
};

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelect({ label, opts, selected, onChange }: {
  label:    string;
  opts:     { v: string; l: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        ...ctrl, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
      }}>
        {label}
        {selected.length > 0 && (
          <span style={{
            background: 'var(--blue-600)', color: 'white', borderRadius: 99,
            fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', lineHeight: 1.5,
          }}>
            {selected.length}
          </span>
        )}
        <span style={{ opacity: 0.45, fontSize: '0.7rem', marginLeft: 2 }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
            background: 'white', border: '1px solid var(--slate-200)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.11)',
            minWidth: 170, overflow: 'hidden',
          }}>
            {opts.map(o => (
              <label key={o.v} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px',
                cursor: 'pointer', fontSize: '0.83rem', color: 'var(--slate-700)',
                background: selected.includes(o.v) ? 'var(--blue-50)' : 'transparent',
              }}>
                <input type="checkbox" checked={selected.includes(o.v)}
                  onChange={() => toggle(o.v)} style={{ cursor: 'pointer' }} />
                {o.l}
              </label>
            ))}
            {selected.length > 0 && (
              <div style={{ borderTop: '1px solid var(--slate-100)', padding: '8px 14px' }}>
                <button onClick={() => { onChange([]); setOpen(false); }} style={{
                  fontSize: '0.75rem', color: 'var(--slate-500)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
interface Props {
  filters:     TicketFilters;
  onChange:    (f: TicketFilters) => void;
  onApply:     (f: TicketFilters) => void;
  loading?:    boolean;
  showStatus?: boolean;
}

export default function FilterBar({ filters, onChange, onApply, loading, showStatus = true }: Props) {
  // Local drafts — don't hit backend until Enter
  const [searchDraft,   setSearchDraft]   = useState(filters.search   ?? '');
  const [categoryDraft, setCategoryDraft] = useState(filters.category ?? '');
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Keep drafts in sync if parent resets filters externally
  useEffect(() => { setSearchDraft(filters.search   ?? ''); }, [filters.search]);
  useEffect(() => { setCategoryDraft(filters.category ?? ''); }, [filters.category]);

  // Fires immediately for dropdowns + sort
  const setAndApply = (patch: Partial<TicketFilters>) => {
    const next = { ...filters, ...patch, page: 1 };
    onChange(next);
    onApply(next);
  };

  // Commits the search draft to parent + triggers fetch
  const commitSearch = (value: string) => {
    const next = { ...filters, search: value || undefined, page: 1 };
    onChange(next);
    onApply(next);
  };

  // Commits the category draft
  const commitCategory = (value: string) => {
    const next = { ...filters, category: value || undefined, page: 1 };
    onChange(next);
    onApply(next);
  };

  const toArr = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : [v]) : []);

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>

      {/* Search — Enter to submit */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'white', border: '1.5px solid var(--slate-200)',
        borderRadius: 9, padding: '7px 12px', flex: '1 1 200px', maxWidth: 340,
      }}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
          style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--slate-400)' }}>
          <circle cx="9" cy="9" r="6"/><path strokeLinecap="round" d="M15 15l3 3"/>
        </svg>
        <input
          ref={searchRef}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--font)', fontSize: '0.83rem',
            color: 'var(--slate-800)', width: '100%',
          }}
          placeholder="Search #, title, description… (Enter)"
          value={searchDraft}
          disabled={loading}
          onChange={e => setSearchDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitSearch(searchDraft);
              // keep cursor inside the input after search fires
              searchRef.current?.focus();
            }
          }}
        />
        {searchDraft && (
          <span
            onClick={() => { setSearchDraft(''); commitSearch(''); }}
            style={{ cursor: 'pointer', color: 'var(--slate-400)', fontSize: '1rem', lineHeight: 1 }}>
            ×
          </span>
        )}
      </div>

      {showStatus && (
        <MultiSelect label="Status" opts={STATUS_OPTS}
          selected={toArr(filters.status)}
          onChange={v => setAndApply({ status: v.length ? v : undefined })} />
      )}

      <MultiSelect label="Priority" opts={PRIORITY_OPTS}
        selected={toArr(filters.priority)}
        onChange={v => setAndApply({ priority: v.length ? v : undefined })} />

      <MultiSelect label="Severity" opts={SEVERITY_OPTS}
        selected={toArr(filters.severity)}
        onChange={v => setAndApply({ severity: v.length ? v : undefined })} />

      {/* Category — Enter to submit */}
      <input
        style={{ ...ctrl, minWidth: 130 }}
        placeholder="Category… (Enter)"
        value={categoryDraft}
        disabled={loading}
        onChange={e => setCategoryDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commitCategory(categoryDraft); }}
        onBlur={() => {
          // Also commit on blur so clicking away doesn't leave a stale draft
          if (categoryDraft !== (filters.category ?? '')) commitCategory(categoryDraft);
        }}
      />

      {/* Sort — pushed right, fires immediately */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', fontWeight: 600 }}>Sort</span>
        <select style={{ ...ctrl, cursor: 'pointer' }}
          value={filters.sort_by ?? 'created_at'}
          disabled={loading}
          onChange={e => setAndApply({ sort_by: e.target.value as TicketFilters['sort_by'] })}>
          {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <button
          disabled={loading}
          onClick={() => setAndApply({ sort_dir: filters.sort_dir === 'asc' ? 'desc' : 'asc' })}
          style={{ ...ctrl, cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', padding: '6px 10px' }}
          title={filters.sort_dir === 'asc' ? 'Ascending' : 'Descending'}>
          {filters.sort_dir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
    </div>
  );
}