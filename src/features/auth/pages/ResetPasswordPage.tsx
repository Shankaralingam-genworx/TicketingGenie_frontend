/**
 * ResetPasswordPage.tsx
 *
 * Landed on via the email link:
 *   https://your-app.com/reset-password?token=<token>
 *
 * Reads the token from the URL, lets the user pick a new password,
 * POSTs to /auth/reset-password, then shows a success state.
 *
 * Aesthetics: matches LoginPage (lgp-* CSS classes + LoginPage.css).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/features/auth/services/authService';
import './LoginPage.css'; // reuse the same stylesheet

/* ── password strength helper ─────────────────────────────────── */
function strength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)              score++;
  if (pw.length >= 12)             score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^A-Za-z0-9]/.test(pw))   score++;
  if (score <= 1) return { score, label: 'Weak',   color: '#ef4444' };
  if (score <= 3) return { score, label: 'Fair',   color: '#f59e0b' };
  if (score === 4) return { score, label: 'Good',  color: '#3b82f6' };
  return              { score, label: 'Strong', color: '#22c55e' };
}

/* ─────────────────────────────────────────────────────────────────
   ResetPasswordPage
───────────────────────────────────────────────────────────────── */
const ResetPasswordPage: React.FC = () => {
  const navigate          = useNavigate();
  const [params]          = useSearchParams();
  const token             = params.get('token');

  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [showCfm,  setShowCfm]  = useState(false);
  const [touched,  setTouched]  = useState({ newPass: false, confirm: false });
  const [isLoading, setLoading] = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const pw        = strength(newPass);
  const passErr   = touched.newPass  && newPass.length > 0  && newPass.length < 8
                    ? 'At least 8 characters required.' : '';
  const matchErr  = touched.confirm  && confirm.length > 0  && confirm !== newPass
                    ? 'Passwords do not match.' : '';
  const canSubmit = !!token && newPass.length >= 8 && newPass === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPass: true, confirm: true });
    if (!canSubmit) return;

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token!, newPass);
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Invalid / missing token ── */
  if (!token) {
    return (
      <div className="lgp">
        <aside className="lgp-left" aria-hidden="true">
          <div className="lgp-left-bg" />
          <div className="lgp-left-content">
            <h2 className="lgp-left-headline">
              Secure your account.<br /><em>Stay in control.</em>
            </h2>
            <p className="lgp-left-sub">
              Password resets are single-use, time-limited, and protected end-to-end.
            </p>
            <div className="lgp-left-deco" aria-hidden="true">
              <div className="lgp-deco-ring lgp-deco-ring-1" />
              <div className="lgp-deco-ring lgp-deco-ring-2" />
              <div className="lgp-deco-dots" />
            </div>
          </div>
        </aside>

        <main className="lgp-right">
          <div className="lgp-card">
            <div className="lgp-modal-success">
              <div className="lgp-modal-success-icon">
                <svg viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="#ef444420" />
                  <path d="M13 13l14 14M27 13L13 27"
                    stroke="#ef4444" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="lgp-modal-success-title">Invalid reset link</h2>
              <p className="lgp-modal-success-sub">
                This link is missing a reset token. Please request a new one from the login page.
              </p>
              <button className="lgp-submit" style={{ marginTop: 8 }}
                onClick={() => navigate('/login', { replace: true })}>
                Back to Sign In <ArrowIcon />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="lgp">

      {/* ── Left decorative panel ── */}
      <aside className="lgp-left" aria-hidden="true">
        <div className="lgp-left-bg" />
        <div className="lgp-left-content">
          <h2 className="lgp-left-headline">
            Secure your account.<br /><em>Stay in control.</em>
          </h2>
          <p className="lgp-left-sub">
            Password resets are single-use, time-limited, and protected end-to-end.
          </p>
          <div className="lgp-left-deco" aria-hidden="true">
            <div className="lgp-deco-ring lgp-deco-ring-1" />
            <div className="lgp-deco-ring lgp-deco-ring-2" />
            <div className="lgp-deco-dots" />
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <main className="lgp-right">
        <div className="lgp-card">

          <a className="lgp-mobile-logo" href="/">
            <LogoIcon size={30} />
            Ticketing<em>Genie</em>
          </a>

          {/* ── Success state ── */}
          {done ? (
            <div className="lgp-modal-success">
              <div className="lgp-modal-success-icon">
                <svg viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="url(#rsg)" fillOpacity=".12" />
                  <path d="M10 20l7 7L30 13"
                    stroke="url(#rsg2)" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="rsg"  x1="0" y1="0"  x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9D65F5" /><stop offset="1" stopColor="#3D1F8C" />
                    </linearGradient>
                    <linearGradient id="rsg2" x1="10" y1="13" x2="30" y2="27" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9D65F5" /><stop offset="1" stopColor="#3D1F8C" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2 className="lgp-modal-success-title">Password updated!</h2>
              <p className="lgp-modal-success-sub">
                Your password has been changed successfully. All active sessions have been signed out.
              </p>
              <button className="lgp-submit" style={{ marginTop: 8 }}
                onClick={() => navigate('/login', { replace: true })}>
                Sign In <ArrowIcon />
              </button>
            </div>
          ) : (
            <>
              <div className="lgp-card-hdr">
                {/* lock icon */}
                <div className="lgp-modal-icon-wrap" style={{ marginBottom: 12 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="1.5" style={{ width: 24, height: 24 }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25
                         2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25
                         2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h1 className="lgp-title">Set new password</h1>
                <p className="lgp-subtitle">Choose a strong password for your account.</p>
              </div>

              <form className="lgp-form" onSubmit={handleSubmit} noValidate>

                {/* ── Error banner ── */}
                {error && (
                  <div className="lgp-error-banner" role="alert">
                    <svg viewBox="0 0 20 20" fill="currentColor"
                      style={{ width: 16, height: 16, flexShrink: 0 }}>
                      <path fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0
                           1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0
                           00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                    <button type="button" className="lgp-error-close" onClick={() => setError('')}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* ── New password ── */}
                <div className={`lgp-field${passErr ? ' lgp-field--err' : ''}${newPass && !passErr ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="rp-new">
                    New password <span className="lgp-required">*</span>
                  </label>
                  <div className="lgp-input-wrap">
                    <span className="lgp-input-icon">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2
                             2 0 01-2-2v-5a2 2 0 012-2zm5 3v2" />
                      </svg>
                    </span>
                    <input
                      ref={inputRef}
                      id="rp-new"
                      type={showNew ? 'text' : 'password'}
                      className="lgp-input"
                      placeholder="Min. 8 characters"
                      value={newPass}
                      onChange={(e) => { setNewPass(e.target.value); setError(''); }}
                      onBlur={() => setTouched((t) => ({ ...t, newPass: true }))}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button type="button" className="lgp-show-pass"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Hide password' : 'Show password'}>
                      <EyeIcon open={showNew} />
                    </button>
                  </div>

                  {/* ── Strength bar ── */}
                  {newPass.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{
                        display: 'flex', gap: 4, marginBottom: 4,
                      }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 9999,
                            background: i <= pw.score ? pw.color : 'var(--lgp-border, #e5e7eb)',
                            transition: 'background 0.25s',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: pw.color, fontWeight: 600 }}>
                        {pw.label}
                      </span>
                    </div>
                  )}

                  {passErr && <span className="lgp-err-msg">{passErr}</span>}
                </div>

                {/* ── Confirm password ── */}
                <div className={`lgp-field${matchErr ? ' lgp-field--err' : ''}${confirm && !matchErr ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="rp-confirm">
                    Confirm password <span className="lgp-required">*</span>
                  </label>
                  <div className="lgp-input-wrap">
                    <span className="lgp-input-icon">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2
                             2 0 01-2-2v-5a2 2 0 012-2zm5 3v2" />
                      </svg>
                    </span>
                    <input
                      id="rp-confirm"
                      type={showCfm ? 'text' : 'password'}
                      className="lgp-input"
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                      onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button type="button" className="lgp-show-pass"
                      onClick={() => setShowCfm((v) => !v)}
                      aria-label={showCfm ? 'Hide password' : 'Show password'}>
                      <EyeIcon open={showCfm} />
                    </button>
                    {confirm && !matchErr && (
                      <span className="lgp-input-check">
                        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {matchErr && <span className="lgp-err-msg">{matchErr}</span>}
                </div>

                {/* ── Submit ── */}
                <button
                  type="submit"
                  className={`lgp-submit${isLoading ? ' lgp-submit--loading' : ''}`}
                  disabled={isLoading || !canSubmit}
                >
                  {isLoading
                    ? <><span className="lgp-spinner" /> Updating password…</>
                    : <>Reset Password <ArrowIcon /></>}
                </button>

                {/* ── Back link ── */}
                <button type="button" className="lgp-modal-back-link"
                  onClick={() => navigate('/login')}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
                    strokeWidth="2" style={{ width: 13, height: 13 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 7H3M6 3L2 7l4 4" />
                  </svg>
                  Back to Sign In
                </button>

              </form>

              <p className="lgp-secure-note">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="6" width="10" height="7" rx="1.5" />
                  <path strokeLinecap="round" d="M5 6V4.5a2 2 0 014 0V6" />
                </svg>
                One-time link · Expires in 15 min · All sessions revoked on reset
              </p>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

/* ── Icons ─────────────────────────────────────────────────────── */

const LogoIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="url(#rp-llg)" />
    <path d="M12 20H28M12 14H22M12 26H20"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <defs>
      <linearGradient id="rp-llg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9D65F5" />
        <stop offset="1" stopColor="#3D1F8C" />
      </linearGradient>
    </defs>
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor"
    strokeWidth="2" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h10M8 3l4 4-4 4" />
  </svg>
);

const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993
           0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773
           3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3
           3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0
           0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638
           0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5
           12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

export default ResetPasswordPage;