import React, { useEffect } from 'react';
import { ToastDef } from '../types';
import { CheckIcon, AlertTriIcon, CloseIcon } from './Icons';

/* ── Spinner ─────────────────────────────────────────────────────────────── */
export const Spinner = ({
  size = 18,
  color = '#2563EB',
}: {
  size?: number;
  color?: string;
}) => (
  <span
    className="adm-spin"
    style={{ width: size, height: size, borderTopColor: color }}
  />
);

/* ── Severity badge ──────────────────────────────────────────────────────── */
export const SevBadge = ({ sev }: { sev: string }) => (
  <span className={`badge badge--dot badge--${sev.toLowerCase()}`}>{sev}</span>
);

/* ── Tier badge ──────────────────────────────────────────────────────────── */
const TIER_META: Record<string, { bg: string; color: string; border: string }> = {
  premium:     { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  standard:   { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  basic:   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
};

export const TierBadge = ({ tier }: { tier: string }) => {
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

/* ── Active/Inactive pill ────────────────────────────────────────────────── */
export const ActivePill = ({ on }: { on: boolean }) => (
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

/* ── Toast bar ───────────────────────────────────────────────────────────── */
export const ToastBar = ({
  t,
  onDone,
}: {
  t: ToastDef;
  onDone: () => void;
}) => {
  useEffect(() => {
    const h = setTimeout(onDone, 3200);
    return () => clearTimeout(h);
  }, [onDone]);

  return (
    <div className={`adm-toast${t.ok ? '' : ' adm-toast--err'}`}>
      {t.ok ? <CheckIcon /> : <AlertTriIcon />}
      {t.msg}
    </div>
  );
};

/* ── Confirm dialog ──────────────────────────────────────────────────────── */
export const ConfirmDlg = ({
  msg,
  onOk,
  onCancel,
}: {
  msg: string;
  onOk: () => void;
  onCancel: () => void;
}) => (
  <div className="adm-overlay">
    <div className="adm-dlg">
      <div className="adm-dlg-icon">
        <AlertTriIcon />
      </div>
      <h3>Confirm delete</h3>
      <p>{msg}</p>
      <div className="adm-dlg-btns">
        <button className="btn btn--outline" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn--primary adm-btn-danger"
          onClick={onOk}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ── Modal shell ─────────────────────────────────────────────────────────── */
export const Modal = ({
  title,
  sub,
  onClose,
  children,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="adm-overlay" onClick={onClose}>
    <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
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

/* ── Form helpers ────────────────────────────────────────────────────────── */
export const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
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

export const Select = (
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    children: React.ReactNode;
  }
) => <select className="adm-input" {...props} />;

export const Textarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) => <textarea className="adm-input adm-textarea" {...props} />;

/* ── Tab row ─────────────────────────────────────────────────────────────── */
export const Tabs = <T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) => (
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