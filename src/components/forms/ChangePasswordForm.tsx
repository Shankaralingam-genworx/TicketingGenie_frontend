/**
 * ChangePasswordForm — inline password-change form embedded in ProfilePage.
 * No overlay/modal; renders as a plain form card section.
 */
import React, { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import { EyeOpenIcon, EyeClosedIcon } from '@/components/icons';

interface Props {
  onSuccess: () => void;
  onCancel:  () => void;
  onError:   (msg: string) => void;
}

const getStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

function PasswordField({
  label, value, onChange, placeholder, hint, hintError,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; hintError?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="adm-input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: 40 }}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', padding: 0 }}
        >
          {show ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      </div>
      {hint && <span className={`adm-hint${hintError ? ' adm-hint--err' : ''}`}>{hint}</span>}
    </div>
  );
}

export default function ChangePasswordForm({ onSuccess, onCancel, onError }: Props) {
  const [oldPwd,     setOldPwd]     = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  const mismatch  = confirmPwd.length > 0 && newPwd !== confirmPwd;
  const tooShort  = newPwd.length > 0 && newPwd.length < 8;
  const sameAsOld = newPwd.length > 0 && newPwd === oldPwd;
  const score     = getStrength(newPwd);
  const strengthLabel = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong';
  const strengthColor = score <= 1 ? '#EF4444' : score <= 2 ? '#F59E0B' : score <= 3 ? '#3B82F6' : '#22C55E';

  const valid = oldPwd.trim().length > 0 && newPwd.length >= 8 && newPwd === confirmPwd && !sameAsOld;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await authService.changePassword(oldPwd, newPwd);
      setDone(true);
      setTimeout(onSuccess, 1200);
    } catch (e: any) {
      onError(e.message ?? 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} style={{ width: 24, height: 24 }}>
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--slate-800)' }}>Password updated successfully!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
      <PasswordField label="Current password" value={oldPwd} onChange={setOldPwd} placeholder="Enter your current password" />

      <PasswordField
        label="New password" value={newPwd} onChange={setNewPwd} placeholder="Min 8 characters"
        hint={tooShort ? 'Minimum 8 characters required' : sameAsOld ? 'New password must differ from current' : undefined}
        hintError={tooShort || sameAsOld}
      />

      {/* Strength bar */}
      {newPwd.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3, flex: 1 }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 9999, background: i <= score ? strengthColor : 'var(--slate-200)', transition: 'background 0.25s' }} />
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: strengthColor, minWidth: 42 }}>{strengthLabel}</span>
        </div>
      )}

      <PasswordField
        label="Confirm new password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Re-enter new password"
        hint={mismatch ? 'Passwords do not match' : undefined}
        hintError={mismatch}
      />

      {/* Requirements checklist */}
      <div style={{ padding: '12px 14px', background: 'var(--slate-50)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'At least 8 characters', ok: newPwd.length >= 8 },
          { label: 'Uppercase letter',       ok: /[A-Z]/.test(newPwd) },
          { label: 'Number',                 ok: /[0-9]/.test(newPwd) },
          { label: 'Passwords match',        ok: newPwd.length > 0 && newPwd === confirmPwd },
        ].map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.ok ? '#22C55E' : 'var(--slate-300)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: r.ok ? 'var(--slate-700)' : 'var(--slate-400)' }}>{r.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn--outline" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button className="btn btn--primary" disabled={!valid || submitting} onClick={handleSubmit}>
          {submitting ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
