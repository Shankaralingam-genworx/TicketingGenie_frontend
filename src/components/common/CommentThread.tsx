/**
 * components/common/CommentThread.tsx
 * Uses centralized ticketApi instead of a standalone commentApi import.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ticketApi } from '@/lib/fetchClient';
import { AttachIcon } from '@/components/icons';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  CUSTOMER:      { bg: '#EFF6FF', color: '#1D4ED8', label: 'Customer' },
  SUPPORT_AGENT: { bg: '#F0FDF4', color: '#15803D', label: 'Agent' },
  TEAM_LEAD:     { bg: '#FAF5FF', color: '#6D28D9', label: 'Team Lead' },
};

interface CommentResponse {
  id: number;
  content: string;
  author_role: string;
  created_at: string;
  attachments?: { filename?: string }[];
}

interface Props {
  ticketId: number;
  currentRole: string;
  allowAttachments?: boolean;
}

export default function CommentThread({ ticketId, allowAttachments = false }: Props) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [files, setFiles]       = useState<File[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await ticketApi.get<CommentResponse[]>(`/tickets/${ticketId}/comments`);
      setComments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [ticketId]);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    try {
      setSending(true);
      const formData = new FormData();
      formData.append('content', text.trim());
      formData.append('source', 'portal');
      files.forEach((f) => formData.append('attachments', f));

      const newComment = await ticketApi.post<CommentResponse>(
        `/tickets/${ticketId}/comments`,
        undefined,
        { formData },
      );
      setComments((p) => [...p, newComment]);
      setText('');
      setFiles([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const canSend = !sending && (text.trim().length > 0 || files.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Comments
      </h3>

      {/* Comment list */}
      <div
        ref={listRef}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}
      >
        {loading && <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Loading…</p>}
        {!loading && comments.length === 0 && (
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No comments yet.</p>
        )}
        {comments.map((c) => {
          const rs = ROLE_STYLE[c.author_role] ?? { bg: '#F1F5F9', color: '#334155', label: c.author_role };
          return (
            <div key={c.id} style={{ background: rs.bg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rs.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {rs.label}
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--slate-400)' }}>{fmt(c.created_at)}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {c.content}
              </p>
              {c.attachments && c.attachments.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.attachments.map((a, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>
                      📎 {a.filename ?? `File ${i + 1}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#B91C1C', fontSize: '0.82rem', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* Reply box */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          placeholder="Write a reply… (Ctrl+Enter to send)"
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.875rem', color: 'var(--slate-900)', background: 'var(--slate-50)', resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box' }}
        />

        {allowAttachments && (
          <>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {files.map((f, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 5, fontFamily: 'monospace' }}>
                    📎 {f.name}
                    <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, lineHeight: 1, fontSize: '0.8rem' }} title="Remove">✕</button>
                  </span>
                ))}
              </div>
            )}
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleFiles} />
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {allowAttachments ? (
            <button
              onClick={() => fileRef.current?.click()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'white', color: 'var(--slate-500)', border: '1.5px solid var(--slate-200)', borderRadius: 8, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              title="Attach files"
            >
              <AttachIcon /> Attach
            </button>
          ) : <span />}

          <button
            onClick={send}
            disabled={!canSend}
            style={{ padding: '8px 20px', background: canSend ? '#2563EB' : 'var(--slate-200)', color: canSend ? 'white' : 'var(--slate-400)', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: canSend ? 'pointer' : 'not-allowed' }}
          >
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
