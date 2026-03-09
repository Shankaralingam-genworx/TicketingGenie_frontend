import React, { useEffect, useRef, useState } from 'react';
import { fetchComments, postComment, CommentResponse } from '../../services/commentApi';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  CUSTOMER:      { bg: '#EFF6FF', color: '#1D4ED8', label: 'Customer' },
  SUPPORT_AGENT: { bg: '#F0FDF4', color: '#15803D', label: 'Agent' },
  TEAM_LEAD:     { bg: '#FAF5FF', color: '#6D28D9', label: 'Team Lead' },
};

interface Props { ticketId: number; currentRole: string; }

export default function CommentThread({ ticketId, currentRole }: Props) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try { setLoading(true); setComments(await fetchComments(ticketId)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ticketId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const send = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      const c = await postComment(ticketId, { content: text.trim(), source: 'portal' });
      setComments((p) => [...p, c]);
      setText('');
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Comments</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
        {loading && <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Loading…</p>}
        {!loading && comments.length === 0 && <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>No comments yet.</p>}
        {comments.map((c) => {
          const rs = ROLE_STYLE[c.author_role] ?? { bg: '#F1F5F9', color: '#334155', label: c.author_role };
          return (
            <div key={c.id} style={{ background: rs.bg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rs.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{rs.label}</span>
                <span style={{ fontSize: '0.73rem', color: 'var(--slate-400)' }}>{fmt(c.created_at)}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.content}</p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {error && <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#B91C1C', fontSize: '0.82rem', marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
          placeholder="Write a reply… (Ctrl+Enter to send)"
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--slate-200)', borderRadius: 9, fontFamily: 'var(--font)', fontSize: '0.875rem', color: 'var(--slate-900)', background: 'var(--slate-50)', resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box' }}
        />
        <button onClick={send} disabled={sending || !text.trim()}
          style={{ alignSelf: 'flex-end', padding: '8px 20px', background: sending || !text.trim() ? 'var(--slate-200)' : '#2563EB', color: sending || !text.trim() ? 'var(--slate-400)' : 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: sending || !text.trim() ? 'not-allowed' : 'pointer' }}>
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}
