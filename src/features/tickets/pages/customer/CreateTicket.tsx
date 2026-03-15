import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { submitTicket } from '@/features/tickets/slices/ticketSlice';
import { ticketApi } from '@/lib/fetchClient';
import { BackIcon } from '@/components/icons';

interface Issue {
  id:          number;
  name:        string;
  category:    string;
  description: string | null;
  is_active:   boolean;
}

interface FormState {
  issue_id:    string;
  title:       string;
  description: string;
  priority:    string;
}

const INIT: FormState = { issue_id: '', title: '', description: '', priority: 'p2' };

function validate(f: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!f.issue_id)           e.issue_id    = 'Please select a category.';
  if (!f.title.trim())       e.title       = 'Subject is required.';
  if (!f.description.trim()) e.description = 'Description is required.';
  return e;
}

const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--slate-600)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 13px', border: '1.5px solid var(--slate-200)', borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.9rem', color: 'var(--slate-900)', background: 'var(--slate-50)', outline: 'none', boxSizing: 'border-box' };
const errStyle: React.CSSProperties  = { fontSize: '0.78rem', color: '#DC2626', marginTop: 3 };

const UploadIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a1 1 0 001 1h10a1 1 0 001-1v-1M12 8l-2-2-2 2M10 6v8" />
  </svg>
);

export default function CreateTicket() {
  const navigate    = useNavigate();
  const dispatch    = useAppDispatch();
  const loading     = useAppSelector((s) => s.tickets.submitLoading);
  const submitError = useAppSelector((s) => s.tickets.error);

  const [issues,        setIssues]        = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError,   setIssuesError]   = useState<string | null>(null);
  const [form,    setForm]    = useState<FormState>(INIT);
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormState, string>>>({});
  const [files,   setFiles]   = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Use centralized ticketApi — no raw fetch, no manual auth header
    ticketApi.get<Issue[]>('/issues/?active_only=true')
      .then((data) => {
        setIssues(data);
        if (data.length) setForm((p) => ({ ...p, issue_id: String(data[0].id) }));
      })
      .catch((e: Error) => setIssuesError(e.message))
      .finally(() => setIssuesLoading(false));
  }, []);

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setErrors((p) => ({ ...p, [k]: undefined }));
    };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await dispatch(submitTicket({
      issue_id:    Number(form.issue_id),
      title:       form.title,
      description: form.description,
      priority:    form.priority,
      attachments: files,
    }));

    if (submitTicket.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate('/customer/tickets'), 1800);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" style={{ width: 28, height: 28 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L15 7" /></svg>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--slate-800)' }}>Ticket submitted!</h2>
        <p style={{ color: 'var(--slate-500)', margin: 0 }}>Redirecting to your tickets…</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <button className="btn btn--outline btn--sm" style={{ marginBottom: 12 }} onClick={() => navigate(-1)}>
          <BackIcon /> Back
        </button>
        <h1 className="dash-page-title">Submit a Ticket</h1>
        <p className="dash-page-sub">Describe your issue and we'll assign an agent right away.</p>
      </div>

      <div style={{ maxWidth: 620, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, padding: 28 }}>
        {submitError && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#B91C1C', marginBottom: 18, fontSize: '0.85rem' }}>
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Issue Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Issue Category <span style={{ color: '#EF4444' }}>*</span></label>
            {issuesLoading ? (
              <div style={{ ...inputStyle, color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, border: '2px solid var(--slate-300)', borderTopColor: '#2563EB', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Loading categories…
              </div>
            ) : issuesError ? (
              <div style={{ ...inputStyle, color: '#B91C1C', borderColor: '#FCA5A5', background: '#FEF2F2' }}>
                {issuesError} — <button style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', padding: 0 }} onClick={() => window.location.reload()}>retry</button>
              </div>
            ) : (
              <select style={{ ...inputStyle, borderColor: errors.issue_id ? '#EF4444' : 'var(--slate-200)' }} value={form.issue_id} onChange={set('issue_id')}>
                <option value="" disabled>Select a category…</option>
                {issues.map((o) => <option key={o.id} value={o.id}>{o.name}{o.category ? ` — ${o.category}` : ''}</option>)}
              </select>
            )}
            {errors.issue_id && <span style={errStyle}>{errors.issue_id}</span>}
          </div>

          {/* Subject */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Subject <span style={{ color: '#EF4444' }}>*</span></label>
            <input style={{ ...inputStyle, borderColor: errors.title ? '#EF4444' : 'var(--slate-200)' }} placeholder="Brief description of your issue" value={form.title} onChange={set('title')} />
            {errors.title && <span style={errStyle}>{errors.title}</span>}
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Description <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea style={{ ...inputStyle, height: 130, resize: 'vertical', paddingTop: 10, borderColor: errors.description ? '#EF4444' : 'var(--slate-200)' }} placeholder="What happened? What did you expect? Steps to reproduce…" value={form.description} onChange={set('description')} />
            {errors.description && <span style={errStyle}>{errors.description}</span>}
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Priority</label>
            <select style={inputStyle} value={form.priority} onChange={set('priority')}>
              <option value="p1">Critical</option>
              <option value="p2">High</option>
              <option value="p3">Medium</option>
              <option value="p4">Low</option>
            </select>
          </div>

          {/* Attachments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Attachments <span style={{ color: 'var(--slate-400)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <div style={{ border: '1.5px dashed var(--slate-300)', borderRadius: 9, padding: '18px 14px', textAlign: 'center', cursor: 'pointer', background: 'var(--slate-50)' }} onClick={() => fileRef.current?.click()}>
              <UploadIcon />
              <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {files.length ? files.map((f) => f.name).join(', ') : 'Click to upload screenshots or logs'}
              </p>
            </div>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn--primary" onClick={handleSubmit} disabled={loading || issuesLoading}>
              {loading ? 'Submitting…' : 'Submit Ticket'}
            </button>
            <button className="btn btn--outline" onClick={() => navigate('/customer/tickets')} disabled={loading}>Cancel</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
