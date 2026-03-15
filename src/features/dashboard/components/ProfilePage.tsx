/**
 * ProfilePage — shared profile page used by all four roles.
 * Displays account info, role-specific stats, and an inline ChangePassword form.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { BackIcon } from '@/components/icons';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';
import { useToasts, ToastStack } from '@/components/ui/Toast';
import type { UserRole } from '@/types';

/* ── Role config ─────────────────────────────────────────────────── */
const ROLE_LABEL: Record<UserRole, string> = {
  admin:         'Administrator',
  team_lead:     'Team Lead',
  support_agent: 'Support Agent',
  customer:      'Customer',
};

const ROLE_GRADIENT: Record<UserRole, string> = {
  admin:         'linear-gradient(135deg,#A78BFA,#7C3AED)',
  team_lead:     'linear-gradient(135deg,#A78BFA,#6D28D9)',
  support_agent: 'linear-gradient(135deg,#34D399,#059669)',
  customer:      'linear-gradient(135deg,#60A5FA,#1D4ED8)',
};

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  admin:         { bg: '#F5F3FF', color: '#6D28D9' },
  team_lead:     { bg: '#F5F3FF', color: '#5B21B6' },
  support_agent: { bg: '#ECFDF5', color: '#065F46' },
  customer:      { bg: '#EFF6FF', color: '#1D4ED8' },
};

/* ── Stat card ───────────────────────────────────────────────────── */
interface StatItem { label: string; value: number | string; color: string }

function StatCard({ label, value, color }: StatItem) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 10px', background: 'var(--slate-50)', borderRadius: 10 }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ── Detail row ──────────────────────────────────────────────────── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--slate-100)' }}>
      <span style={{ minWidth: 140, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--slate-800)', fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}

/* ── Props ───────────────────────────────────────────────────────── */
export interface ProfileStats { label: string; value: number | string; color: string }

interface Props {
  /** Optional stats to show in the Summary card — pass [] to hide */
  stats?:       ProfileStats[];
  /** Label for the stats card header, e.g. "Support Summary" */
  statsTitle?:  string;
  /** Extra rows to show in Account Details card */
  extraDetails?: { label: string; value: string }[];
  /** Extra content rendered below the grid (e.g. agents list) */
  children?: React.ReactNode;
}

/* ── Component ───────────────────────────────────────────────────── */
export default function ProfilePage({ stats, statsTitle, extraDetails, children }: Props) {
  const navigate = useNavigate();
  const user     = useAppSelector((s) => s.auth.user);
  const [showPwd, setShowPwd] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  if (!user) return null;

  const initials  = user.email.slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABEL[user.role];
  const gradient  = ROLE_GRADIENT[user.role];
  const badge     = ROLE_BADGE[user.role];

  const accountRows: { label: string; value: string }[] = [
    { label: 'Email', value: user.email },
    { label: 'Role',  value: roleLabel  },
    ...(extraDetails ?? []),
  ];

  return (
    <>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <div>
        <button className="btn btn--outline btn--sm" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}>
          <BackIcon /> Back
        </button>
        <h1 className="dash-page-title">My Profile</h1>
        <p className="dash-page-sub">Your account information and activity summary.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Identity card ── */}
        <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--slate-800)' }}>{user.email}</p>
            <span style={{ ...badge, padding: '3px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, marginTop: 6, display: 'inline-block' }}>
              {roleLabel}
            </span>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid var(--slate-100)', paddingTop: 14 }}>
            <button
              className="btn btn--outline"
              style={{ width: '100%', gap: 8 }}
              onClick={() => setShowPwd((v) => !v)}
            >
              🔒 {showPwd ? 'Cancel' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats card */}
          {stats && stats.length > 0 && (
            <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {statsTitle ?? 'Summary'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`, gap: 14 }}>
                {stats.map((s) => <StatCard key={s.label} {...s} />)}
              </div>
            </div>
          )}

          {/* Account details card */}
          <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Account Details
            </h3>
            {accountRows.map((r) => <DetailRow key={r.label} label={r.label} value={r.value} />)}
          </div>

          {/* Inline change-password form */}
          {showPwd && (
            <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Change Password
              </h3>
              <ChangePasswordForm
                onSuccess={() => { addToast('Password changed successfully'); setShowPwd(false); }}
                onCancel={() => setShowPwd(false)}
                onError={(msg) => addToast(msg, false)}
              />
            </div>
          )}

          {/* Extra content (e.g. agents list for team lead) */}
          {children}
        </div>
      </div>
    </>
  );
}
