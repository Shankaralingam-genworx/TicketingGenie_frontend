/**
 * components/ui/index.tsx
 * Shared UI primitives: Modal, ConfirmDlg, Spinner, Field, Input, Select, Textarea, Tabs.
 * Used by Admin, Agent, TeamLead sections instead of each having their own copies.
 */

import React, { useEffect } from 'react';
import { CloseIcon, AlertTriIcon, CheckIcon } from '@/components/icons';

// ── Spinner ──────────────────────────────────────────────────────────────────

export const Spinner: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#2563EB',
}) => (
  <span
    className="adm-spin"
    style={{ width: size, height: size, borderTopColor: color }}
  />
);

// ── Badges ───────────────────────────────────────────────────────────────────

export const SevBadge: React.FC<{ sev: string }> = ({ sev }) => (
  <span className={`badge badge--dot badge--${sev.toLowerCase()}`}>{sev}</span>
);

const TIER_META: Record<string, { bg: string; color: string; border: string }> = {
  premium:  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  standard: { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  basic:    { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  smb:      { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  enterprise: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
};

export const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const m = TIER_META[tier?.toLowerCase()] ?? TIER_META.basic;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '2px 9px',
        borderRadius: 100,
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
      }}
    >
      {tier}
    </span>
  );
};

export const ActivePill: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '2px 9px',
      borderRadius: 100,
      background: on ? '#F0FDF4' : '#F1F5F9',
      color: on ? '#15803D' : '#64748B',
      border: `1px solid ${on ? '#BBF7D0' : '#E2E8F0'}`,
    }}
  >
    {on ? <CheckIcon /> : '—'}
    {on ? 'Active' : 'Inactive'}
  </span>
);

// ── Confirm dialog ────────────────────────────────────────────────────────────

export const ConfirmDlg: React.FC<{
  msg: string;
  onOk: () => void;
  onCancel: () => void;
}> = ({ msg, onOk, onCancel }) => (
  <div className="adm-overlay">
    <div className="adm-dlg">
      <div className="adm-dlg-icon">
        <AlertTriIcon />
      </div>
      <h3>Confirm delete</h3>
      <p>{msg}</p>
      <div className="adm-dlg-btns">
        <button className="btn btn--outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary adm-btn-danger" onClick={onOk}>Delete</button>
      </div>
    </div>
  </div>
);

// ── Modal shell ───────────────────────────────────────────────────────────────

export const Modal: React.FC<{
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}> = ({ title, sub, onClose, children, maxWidth }) => {
  // Escape key support
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div
        className="adm-modal"
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adm-modal-hdr">
          <div>
            <div className="adm-modal-title">{title}</div>
            {sub && <div className="adm-modal-sub">{sub}</div>}
          </div>
          <button className="adm-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ── Form primitives ───────────────────────────────────────────────────────────

export const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="adm-field">
    <label className="adm-label">
      {label}
      {required && <span className="adm-req">*</span>}
    </label>
    {children}
  </div>
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input ref={ref} className="adm-input" {...props} />);
Input.displayName = 'Input';

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
> = (props) => <select className="adm-input" {...props} />;

export const Textarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => <textarea className="adm-input adm-textarea" {...props} />;

// ── Tab row ───────────────────────────────────────────────────────────────────

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="adm-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`adm-tab${value === t.id ? ' adm-tab--on' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
}> = ({ icon, title, description }) => (
  <div className="adm-empty">
    {icon}
    <p>{title}</p>
    {description && <span>{description}</span>}
  </div>
);
