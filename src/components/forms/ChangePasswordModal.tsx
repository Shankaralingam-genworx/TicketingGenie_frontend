/**
 * components/forms/ChangePasswordModal.tsx
 * Shared password-change modal for Admin, TeamLead, and Agent.
 * Now uses the centralized authApi instead of raw fetch.
 */

import React, { useState } from 'react';
import { authApi } from '@/lib/fetchClient';
import { EyeOpenIcon, EyeClosedIcon } from '@/components/icons';

interface Props {
  token: string | null;
  onClose: () => void;
  onToast: (msg: string, ok?: boolean) => void;
}

const PasswordField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  hintError?: boolean;
}> = ({ label, value, onChange, placeholder, hint, hintError }) => {
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
      {hint && (
        <span className={`adm-hint${hintError ? ' adm-hint--err' : ''}`}>{hint}</span>
      )}
    </div>
  );
};

const getStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;
  const score = getStrength(password);
  const label = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong';
  const color = score <= 1 ? 'var(--red-500)' : score <= 2 ? '#F59E0B' : score <= 3 ? '#3B82F6' : '#22C55E';
  return (
    <div className="pwd-strength">
      <div className="pwd-strength-bar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="pwd-strength-segment" style={{ background: i <= score ? color : 'var(--slate-200)' }} />
        ))}
      </div>
      <span className="pwd-strength-label" style={{ color }}>{label}</span>
    </div>
  );
};

const ChangePasswordModal: React.FC<Props> = ({ onClose, onToast }) => {
  const [oldPwd,     setOldPwd]     = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);

  const mismatch  = confirmPwd.length > 0 && newPwd !== confirmPwd;
  const tooShort  = newPwd.length > 0 && newPwd.length < 8;
  const sameAsOld = newPwd.length > 0 && newPwd === oldPwd;

  const valid =
    oldPwd.trim().length > 0 &&
    newPwd.length >= 8 &&
    newPwd === confirmPwd &&
    !sameAsOld;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    try {
      await authApi.post('/auth/change-password', {
        old_password: oldPwd,
        new_password: newPwd,
      });
      setDone(true);
      onToast('Password changed successfully');
      setTimeout(onClose, 1800);
    } catch (e: any) {
      onToast(e.message, false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-overlay">
      <div className="adm-modal" style={{ maxWidth: 440 }}>
        <div className="adm-modal-hdr">
          <div>
            <div className="adm-modal-title">Change password</div>
            <div className="adm-modal-sub">Enter your current password and choose a new one</div>
          </div>
          <button className="adm-modal-close" onClick={onClose}>
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="pwd-success">
            <div className="pwd-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>Password updated!</h3>
            <p>Your password has been changed successfully.</p>
          </div>
        ) : (
          <div className="adm-form">
            <PasswordField label="Current password" value={oldPwd} onChange={setOldPwd} placeholder="Enter your current password" />
            <PasswordField
              label="New password" value={newPwd} onChange={setNewPwd} placeholder="Min 8 characters"
              hint={tooShort ? 'Minimum 8 characters required' : sameAsOld ? 'New password must differ from current' : undefined}
              hintError={tooShort || sameAsOld}
            />
            <StrengthBar password={newPwd} />
            <PasswordField
              label="Confirm new password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Re-enter new password"
              hint={mismatch ? 'Passwords do not match' : undefined}
              hintError={mismatch}
            />

            <div className="pwd-requirements">
              <div className="pwd-req-title">Requirements</div>
              {[
                { label: 'At least 8 characters', ok: newPwd.length >= 8 },
                { label: 'Uppercase letter',       ok: /[A-Z]/.test(newPwd) },
                { label: 'Number',                 ok: /[0-9]/.test(newPwd) },
                { label: 'Passwords match',        ok: newPwd.length > 0 && newPwd === confirmPwd },
              ].map((r) => (
                <div key={r.label} className="pwd-req-row">
                  <span className={`pwd-req-dot ${r.ok ? 'pwd-req-dot--ok' : ''}`} />
                  <span style={{ color: r.ok ? 'var(--slate-700)' : 'var(--slate-400)', fontSize: '0.78rem' }}>{r.label}</span>
                </div>
              ))}
            </div>

            <div className="adm-form-actions">
              <button className="btn btn--outline" onClick={onClose} disabled={submitting}>Cancel</button>
              <button className="btn btn--primary" disabled={!valid || submitting} onClick={handleSubmit}>
                {submitting ? (
                  <>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'adm-spin 0.7s linear infinite', marginRight: 6 }} />
                    Updating…
                  </>
                ) : 'Update password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;
