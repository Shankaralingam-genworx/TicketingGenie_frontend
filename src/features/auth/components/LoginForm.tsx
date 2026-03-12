import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../hooks/useAppDispatch';
import { loginThunk, clearError } from '../slices/authSlice';
import './LoginForm.css';
import env from '@/config/env';  

/* ─────────────────────────────────────────────────────────────────
   Register Modal
───────────────────────────────────────────────────────────────── */
const RegisterModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

const [form, setForm] = useState({
  name: '',
  email: '',
  password: '',
  phone: '',
  customer_tier: '',       // New field
  preferred_contact: '',   // New field
});

  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  };

  const emailErr = touched.email && form.email.length > 0 && !form.email.includes('@') ? 'Enter a valid email.' : '';
  const passErr  = touched.password && form.password.length > 0 && form.password.length < 6 ? 'At least 6 characters.' : '';
  const phoneErr = touched.phone && form.phone.length > 0 && !/^\+?[\d\s\-()]{7,}$/.test(form.phone) ? 'Enter a valid phone number.' : '';
  const tierErr  = touched.customer_tier && !form.customer_tier ? 'Select a tier.' : '';
  const contactErr = touched.preferred_contact && !form.preferred_contact ? 'Select a preferred contact method.' : '';
  const canSubmit = form.name.trim() && form.email.includes('@') && form.password.length >= 6
                  && form.customer_tier && form.preferred_contact;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();setTouched({name: true,email: true,password: true,phone: true,customer_tier: true,preferred_contact: true,});
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${env.API_AUTH_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Registration failed. Please try again.');
      }

      //  Get the TokenResponse directly
      const data: {
        access_token: string;
        token_type: string;
        user: { id: string; email: string; role: string };
      } = await res.json();

      // Store token & user info in Redux (or localStorage)
      dispatch({
        type: 'auth/loginSuccess',
        payload: { token: data.access_token, user: data.user },
      });

      // Redirect based on role
      switch (data.user.role) {
        case 'ADMIN': navigate('/admin', { replace: true }); break;
        case 'TEAM_LEAD': navigate('/lead', { replace: true }); break;
        case 'SUPPORT_AGENT': navigate('/agent', { replace: true }); break;
        case 'CUSTOMER': navigate('/customer', { replace: true }); break;
        default: navigate('/', { replace: true }); break;
      }

      onClose(); // close the modal if still open

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="lgp-modal-backdrop" onClick={onClose}>
      <div className="lgp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reg-title">

        <button className="lgp-modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {success ? (
          <div className="lgp-modal-success">
            <div className="lgp-modal-success-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="url(#sg)" fillOpacity=".12" />
                <path d="M10 20l7 7L30 13" stroke="url(#sg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="sg"  x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#9D65F5" /><stop offset="1" stopColor="#3D1F8C" /></linearGradient>
                  <linearGradient id="sg2" x1="10" y1="13" x2="30" y2="27" gradientUnits="userSpaceOnUse"><stop stopColor="#9D65F5" /><stop offset="1" stopColor="#3D1F8C" /></linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="lgp-modal-success-title">Account created!</h2>
            <p className="lgp-modal-success-sub">Welcome aboard. You can now sign in with your credentials.</p>
            <button className="lgp-submit" style={{ marginTop: 8 }} onClick={onClose}>Go to Sign In <ArrowIcon /></button>
          </div>
        ) : (
          <>
            <div className="lgp-modal-hdr">
              <h2 className="lgp-title" id="reg-title">Create account</h2>
              <p className="lgp-subtitle">Join Ticketing Genie — it's free to start</p>
            </div>

            <form className="lgp-form" onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="lgp-error-banner" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                  <button type="button" className="lgp-error-close" onClick={() => setError('')}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
              )}

              <div className="lgp-modal-grid">

                {/* Full Name */}
                <div className={`lgp-field lgp-modal-col-full${touched.name && !form.name.trim() ? ' lgp-field--err' : ''}${form.name.trim() ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="reg-name">Full name <span className="lgp-required">*</span></label>
                  <div className="lgp-input-wrap">
                    <span className="lgp-input-icon">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input id="reg-name" type="text" className="lgp-input" placeholder="Jane Smith"
                      value={form.name} onChange={(e) => set('name', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                      disabled={isLoading} autoComplete="name" />
                    {form.name.trim() && <span className="lgp-input-check"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" /></svg></span>}
                  </div>
                  {touched.name && !form.name.trim() && <span className="lgp-err-msg">Name is required.</span>}
                </div>

                {/* Email */}
                <div className={`lgp-field${emailErr ? ' lgp-field--err' : ''}${form.email && !emailErr ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="reg-email">Email address <span className="lgp-required">*</span></label>
                  <div className="lgp-input-wrap">
                    <span className="lgp-input-icon">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </span>
                    <input id="reg-email" type="email" className="lgp-input" placeholder="you@gmail.com"
                      value={form.email} onChange={(e) => set('email', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      disabled={isLoading} autoComplete="email" />
                    {form.email && !emailErr && <span className="lgp-input-check"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" /></svg></span>}
                  </div>
                  {emailErr && <span className="lgp-err-msg">{emailErr}</span>}
                </div>

                {/* Phone */}
                <div className={`lgp-field${phoneErr ? ' lgp-field--err' : ''}${form.phone && !phoneErr ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="reg-phone">Phone number</label>
                  <div className="lgp-input-wrap">
                    <span className="lgp-input-icon">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V17a2 2 0 01-2 2h-1C9.716 19 3 12.284 3 4V5z" />
                      </svg>
                    </span>
                    <input id="reg-phone" type="tel" className="lgp-input" placeholder="+1 555 000 0000"
                      value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      disabled={isLoading} autoComplete="tel" />
                    {form.phone && !phoneErr && <span className="lgp-input-check"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" /></svg></span>}
                  </div>
                  {phoneErr && <span className="lgp-err-msg">{phoneErr}</span>}
                </div>

                {/* Customer Tier */}
                <div className={`lgp-field${tierErr ? ' lgp-field--err' : ''}${form.customer_tier ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="reg-tier">Customer Tier <span className="lgp-required">*</span></label>
                  <select
                    id="reg-tier"
                    className="lgp-input"
                    value={form.customer_tier}
                    onChange={(e) => set('customer_tier', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, customer_tier: true }))}
                    disabled={isLoading}
                  >
                    <option value="">Select tier</option>
                    <option value="smb">SMB</option>
                    <option value="enterprise">ENTERPRISE</option>
                  </select>
                  {tierErr && <span className="lgp-err-msg">{tierErr}</span>}
                </div>

                {/* Preferred Contact */}
                <div className={`lgp-field${contactErr ? ' lgp-field--err' : ''}${form.preferred_contact ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="reg-contact">Preferred Contact <span className="lgp-required">*</span></label>
                  <select
                    id="reg-contact"
                    className="lgp-input"
                    value={form.preferred_contact}
                    onChange={(e) => set('preferred_contact', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, preferred_contact: true }))}
                    disabled={isLoading}
                  >
                    <option value="">Select contact method</option>
                    <option value="email">Email</option>
                    <option value="web">Web</option>
                  </select>
                  {contactErr && <span className="lgp-err-msg">{contactErr}</span>}
                </div>

                {/* Password */}
                <div className={`lgp-field lgp-modal-col-full${passErr ? ' lgp-field--err' : ''}${form.password && !passErr ? ' lgp-field--ok' : ''}`}>
                  <label className="lgp-label" htmlFor="reg-pass">Password <span className="lgp-required">*</span></label>
                  <div className="lgp-input-wrap">
                    <span className="lgp-input-icon">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm5 3v2" />
                      </svg>
                    </span>
                    <input id="reg-pass" type={showPass ? 'text' : 'password'} className="lgp-input" placeholder="Min. 6 characters"
                      value={form.password} onChange={(e) => set('password', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      disabled={isLoading} autoComplete="new-password" />
                    <button type="button" className="lgp-show-pass" onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}>
                      {showPass ? (
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passErr && <span className="lgp-err-msg">{passErr}</span>}
                </div>

              </div>{/* /grid */}

              <button type="submit"
                className={`lgp-submit${isLoading ? ' lgp-submit--loading' : ''}`}
                disabled={isLoading || !canSubmit}
                style={{ marginTop: 4 }}>
                {isLoading ? <><span className="lgp-spinner" /> Creating account…</> : <>Create Account <ArrowIcon /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Forgot Password Modal
───────────────────────────────────────────────────────────────── */
const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail]         = useState('');
  const [touched, setTouched]     = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [sent, setSent]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const emailErr = touched && email.length > 0 && !email.includes('@') ? 'Enter a valid email.' : '';
  const canSubmit = email.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Request failed. Please try again.');
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lgp-modal-backdrop" onClick={onClose}>
      <div className="lgp-modal lgp-modal--sm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fp-title">

        <button className="lgp-modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        {sent ? (
          <div className="lgp-modal-success">
            <div className="lgp-modal-success-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="url(#fpg)" fillOpacity=".12" />
                <path d="M10 20l7 7L30 13" stroke="url(#fpg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="fpg"  x1="0" y1="0"  x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#9D65F5" /><stop offset="1" stopColor="#3D1F8C" /></linearGradient>
                  <linearGradient id="fpg2" x1="10" y1="13" x2="30" y2="27" gradientUnits="userSpaceOnUse"><stop stopColor="#9D65F5" /><stop offset="1" stopColor="#3D1F8C" /></linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="lgp-modal-success-title">Check your inbox</h2>
            <p className="lgp-modal-success-sub">
              If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
            </p>
            <button className="lgp-submit" style={{ marginTop: 8 }} onClick={onClose}>Back to Sign In</button>
          </div>
        ) : (
          <>
            <div className="lgp-modal-hdr">
              <div className="lgp-modal-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="lgp-title" id="fp-title">Reset password</h2>
              <p className="lgp-subtitle">Enter your email and we'll send you a secure reset link.</p>
            </div>

            <form className="lgp-form" onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="lgp-error-banner" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                  <button type="button" className="lgp-error-close" onClick={() => setError('')}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
              )}

              <div className={`lgp-field${emailErr ? ' lgp-field--err' : ''}${email && !emailErr ? ' lgp-field--ok' : ''}`}>
                <label className="lgp-label" htmlFor="fp-email">Email address</label>
                <div className="lgp-input-wrap">
                  <span className="lgp-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  <input
                    ref={inputRef}
                    id="fp-email" type="email" className="lgp-input" placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    onBlur={() => setTouched(true)}
                    disabled={isLoading} autoComplete="email"
                  />
                  {email && !emailErr && (
                    <span className="lgp-input-check">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" />
                      </svg>
                    </span>
                  )}
                </div>
                {emailErr && <span className="lgp-err-msg">{emailErr}</span>}
              </div>

              <button type="submit"
                className={`lgp-submit${isLoading ? ' lgp-submit--loading' : ''}`}
                disabled={isLoading || !canSubmit}>
                {isLoading ? <><span className="lgp-spinner" /> Sending link…</> : <>Send Reset Link <ArrowIcon /></>}
              </button>

              <button type="button" className="lgp-modal-back-link" onClick={onClose}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 7H3M6 3L2 7l4 4" />
                </svg>
                Back to Sign In
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   LoginPage
───────────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const navigate   = useNavigate();
  const dispatch   = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [touched,    setTouched]    = useState({ email: false, password: false });
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [showRegister,   setShowRegister]   = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const emailErr = touched.email && email.length > 0 && !email.includes('@')
    ? 'Enter a valid email address.' : '';
  const passErr  = touched.password && password.length > 0 && password.length < 6
    ? 'Password must be at least 6 characters.' : '';
  const canSubmit = email.includes('@') && password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) return;
    dispatch(loginThunk({ email, password }));
  };

  return (
    <>
      <div className="lgp">

        {/* ── Left decorative panel ── */}
        <aside className="lgp-left" aria-hidden="true">
          <div className="lgp-left-bg" />
          <div className="lgp-left-content">
            <h2 className="lgp-left-headline">
              Resolve every ticket.<br /><em>Miss nothing.</em>
            </h2>
            <p className="lgp-left-sub">
              Ticketing Genie gives your support team complete visibility and
              control — from AI-classified intake to SLA-enforced resolutions.
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

          <button className="lgp-back" onClick={() => navigate('/')}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 7H3M6 3L2 7l4 4" />
            </svg>
            Back to home
          </button>

          <div className="lgp-card">

            <a className="lgp-mobile-logo" href="/">
              <LogoIcon size={30} />
              Ticketing<em>Genie</em>
            </a>

            <div className="lgp-card-hdr">
              <h1 className="lgp-title">Welcome back</h1>
              <p className="lgp-subtitle">Sign in to your support portal</p>
            </div>

            <form className="lgp-form" onSubmit={handleSubmit} noValidate>

              {error && (
                <div className="lgp-error-banner" role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                  <button type="button" className="lgp-error-close" onClick={() => dispatch(clearError())}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Email field */}
              <div className={`lgp-field${emailErr ? ' lgp-field--err' : ''}${email && !emailErr ? ' lgp-field--ok' : ''}`}>
                <label className="lgp-label" htmlFor="lg-email">Email address</label>
                <div className="lgp-input-wrap">
                  <span className="lgp-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </span>
                  <input
                    ref={emailRef}
                    id="lg-email" type="email" className="lgp-input" placeholder="you@gmail   .com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setActiveRole(null); }}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    autoComplete="email" disabled={isLoading}
                  />
                  {email && !emailErr && (
                    <span className="lgp-input-check">
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l4 4 6-6" />
                      </svg>
                    </span>
                  )}
                </div>
                {emailErr && <span className="lgp-err-msg">{emailErr}</span>}
              </div>

              {/* Password field */}
              <div className={`lgp-field${passErr ? ' lgp-field--err' : ''}${password && !passErr ? ' lgp-field--ok' : ''}`}>
                <div className="lgp-label-row">
                  <label className="lgp-label" htmlFor="lg-pass">Password</label>
                  {/* ── Forgot password now opens modal ── */}
                  <button type="button" className="lgp-forgot" onClick={() => setShowForgotPass(true)}>
                    Forgot password?
                  </button>
                </div>
                <div className="lgp-input-wrap">
                  <span className="lgp-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm5 3v2" />
                    </svg>
                  </span>
                  <input
                    id="lg-pass" type={showPass ? 'text' : 'password'} className="lgp-input" placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setActiveRole(null); }}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    autoComplete="current-password" disabled={isLoading}
                  />
                  <button type="button" className="lgp-show-pass" onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passErr && <span className="lgp-err-msg">{passErr}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`lgp-submit${isLoading ? ' lgp-submit--loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><span className="lgp-spinner" /> Signing in…</>
                ) : (
                  <>Sign In <ArrowIcon /></>
                )}
              </button>

              {/* ── New: Create account ── */}
              <div className="lgp-signup-row">
                <span className="lgp-signup-text">Don't have an account?</span>
                <button type="button" className="lgp-signup-btn" onClick={() => setShowRegister(true)}>
                  Create account
                </button>
              </div>

            </form>

            <p className="lgp-secure-note">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="6" width="10" height="7" rx="1.5" />
                <path strokeLinecap="round" d="M5 6V4.5a2 2 0 014 0V6" />
              </svg>
              JWT secured · HTTPS enforced · All roles supported
            </p>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {showRegister   && <RegisterModal      onClose={() => setShowRegister(false)}   />}
      {showForgotPass && <ForgotPasswordModal onClose={() => setShowForgotPass(false)} />}
    </>
  );
};

/* ── Icons ── */
const LogoIcon: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="url(#llg)" />
    <path d="M12 20H28M12 14H22M12 26H20" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    <defs>
      <linearGradient id="llg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9D65F5" />
        <stop offset="1" stopColor="#3D1F8C" />
      </linearGradient>
    </defs>
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7h10M8 3l4 4-4 4" />
  </svg>
);

export default LoginPage;