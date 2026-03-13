import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketDetail } from '../../../../hooks/useTickets';
import { STATUS_LABEL, PRIORITY_LABEL, TicketStatus, AttachmentMeta } from '../../types/ticket.types';
import CommentThread from '../../../../components/common/CommentThread';
import SlaCountdown from '../../components/SlaCountdown';
import { BackIcon } from '@/components/icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Status colours ────────────────────────────────────────────────────────────

export const STATUS_COLOR: Record<TicketStatus, { bg: string; color: string }> = {
  [TicketStatus.NEW]:          { bg: '#F1F5F9', color: '#475569' },
  [TicketStatus.ACKNOWLEDGED]: { bg: '#E0F2FE', color: '#0284C7' },
  [TicketStatus.ASSIGNED]:     { bg: '#F5F3FF', color: '#7C3AED' },
  [TicketStatus.OPEN]:         { bg: '#EFF6FF', color: '#2563EB' },
  [TicketStatus.IN_PROGRESS]:  { bg: '#FFF7ED', color: '#D97706' },
  [TicketStatus.ON_HOLD]:      { bg: '#FAF5FF', color: '#7C3AED' },
  [TicketStatus.RESOLVED]:     { bg: '#F0FDF4', color: '#16A34A' },
  [TicketStatus.CLOSED]:       { bg: '#F8FAFC', color: '#64748B' },
  [TicketStatus.REOPENED]:     { bg: '#FEF2F2', color: '#DC2626' },
};

// ── Row ───────────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: '1px solid var(--slate-100)',
    }}>
      <span style={{
        minWidth: 160,
        fontSize: '0.78rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--slate-500)',
        paddingTop: 2,
      }}>
        {label}
      </span>
      <span style={{ color: 'var(--slate-800)', fontSize: '0.9rem' }}>
        {children}
      </span>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 22, height: 22 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ width: 20, height: 20 }}>
    {dir === 'left'
      ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    }
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// ── Lightbox ──────────────────────────────────────────────────────────────────

interface LightboxProps {
  attachments: AttachmentMeta[];
  index:       number;
  onClose:     () => void;
  onNavigate:  (i: number) => void;
}

function Lightbox({ attachments, index, onClose, onNavigate }: LightboxProps) {
  const current = attachments[index];
  const hasPrev = index > 0;
  const hasNext = index < attachments.length - 1;
  const apiBase = import.meta.env.VITE_API_TICKET_URL ?? '';
  const imgUrl  = `${apiBase}${current.url}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')                onClose();
      if (e.key === 'ArrowLeft'  && hasPrev) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, hasPrev, hasNext, onClose, onNavigate]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(2, 6, 23, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.18s ease',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
        >
          {/* Top bar */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 16,
          }}>
            <div>
              <p style={{ margin: 0, color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>
                {current.original_name}
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>
                {fmtBytes(current.size_bytes)} · {current.content_type}
                {attachments.length > 1 && ` · ${index + 1} / ${attachments.length}`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href={imgUrl}
                download={current.original_name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <DownloadIcon /> Download
              </a>
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Image + prev/next */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            {hasPrev && (
              <button
                onClick={() => onNavigate(index - 1)}
                style={{
                  position: 'absolute',
                  left: -56,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                <ChevronIcon dir="left" />
              </button>
            )}

            <img
              key={current.stored_name}
              src={imgUrl}
              alt={current.original_name}
              style={{
                maxWidth: '80vw',
                maxHeight: 'calc(90vh - 100px)',
                objectFit: 'contain',
                borderRadius: 10,
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                animation: 'scaleIn 0.2s ease',
                display: 'block',
              }}
            />

            {hasNext && (
              <button
                onClick={() => onNavigate(index + 1)}
                style={{
                  position: 'absolute',
                  right: -56,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                <ChevronIcon dir="right" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {attachments.length > 1 && (
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
              maxWidth: '80vw',
              overflowX: 'auto',
              padding: '4px 0',
            }}>
              {attachments.map((a, i) => (
                <button
                  key={a.stored_name}
                  onClick={() => onNavigate(i)}
                  style={{
                    flexShrink: 0,
                    width: 60,
                    height: 60,
                    padding: 0,
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    outline: i === index ? '2px solid #3b82f6' : '2px solid transparent',
                    outlineOffset: 2,
                    opacity: i === index ? 1 : 0.5,
                    transition: 'opacity 0.15s, outline-color 0.15s',
                  }}
                >
                  <img
                    src={`${apiBase}${a.url}`}
                    alt={a.original_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }                       to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </>
  );
}

// ── Attachment gallery card ───────────────────────────────────────────────────

function AttachmentGallery({ attachments }: { attachments: AttachmentMeta[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const apiBase = import.meta.env.VITE_API_TICKET_URL ?? '';

  return (
    <>
      <div style={{
        background: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '0.85rem',
          color: 'var(--slate-600)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          Attachments
          <span style={{
            marginLeft: 8,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--slate-400)',
            textTransform: 'none',
            letterSpacing: 0,
          }}>
            {attachments.length} file{attachments.length !== 1 ? 's' : ''}
          </span>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {attachments.map((a, i) => (
            <button
              key={a.stored_name}
              onClick={() => setLightboxIndex(i)}
              title={`${a.original_name} · ${fmtBytes(a.size_bytes)}`}
              style={{
                padding: 0,
                border: '1px solid var(--slate-200)',
                borderRadius: 10,
                overflow: 'hidden',
                background: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform  = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform  = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '4/3',
                overflow: 'hidden',
                background: '#e2e8f0',
              }}>
                <img
                  src={`${apiBase}${a.url}`}
                  alt={a.original_name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--slate-700)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {a.original_name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                  {fmtBytes(a.size_bytes)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          attachments={attachments}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={i => setLightboxIndex(i)}
        />
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TicketDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ticket, loading, error } = useTicketDetail(id ? Number(id) : null);

  useEffect(() => {
    const main = document.querySelector('.dash-main') as HTMLElement | null;
    if (main) main.scrollTop = 0;
  }, [id]);

  if (loading)
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
        Loading ticket…
      </div>
    );

  if (error)
    return (
      <div style={{
        padding: '14px 18px',
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: 10,
        color: '#B91C1C',
      }}>
        {error}
      </div>
    );

  if (!ticket) return null;

 const statusStyle = STATUS_COLOR[ticket.status as TicketStatus] ?? {
  bg: '#F1F5F9',
  color: '#334155'
};
  const hasAttachments = Array.isArray(ticket.attachments) && ticket.attachments.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header */}
      <div>
        <button
          className="btn btn--outline btn--sm"
          style={{ marginBottom: 12 }}
          onClick={() => navigate(-1)}
        >
          <BackIcon /> Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 className="dash-page-title" style={{ margin: 0 }}>{ticket.title}</h1>
          <span style={{
            background: statusStyle.bg,
            color: statusStyle.color,
            padding: '3px 12px',
            borderRadius: 99,
            fontSize: '0.78rem',
            fontWeight: 700,
          }}>
            {STATUS_LABEL[ticket.status as TicketStatus] ?? ticket.status}
          </span>
          {ticket.is_escalated && (
            <span style={{
              background: '#FFF1F2',
              color: '#E11D48',
              padding: '3px 12px',
              borderRadius: 99,
              fontSize: '0.78rem',
              fontWeight: 700,
            }}>
              ⚡ Escalated
            </span>
          )}
        </div>

        <p style={{ color: 'var(--slate-400)', fontSize: '0.82rem', margin: '6px 0 0' }}>
          Ticket #{ticket.ticket_number} · Opened {fmt(ticket.created_at)}
        </p>
      </div>

      {/* 1. Ticket Details */}
      <div style={{
        background: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: '0.85rem',
          color: 'var(--slate-600)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          Ticket Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 32px' }}>
          <div>
            <Row label="Ticket #">{ticket.ticket_number}</Row>
            <Row label="Priority">
              <span className={`badge badge--dot badge--${ticket.priority.toLowerCase()}`}>
                {PRIORITY_LABEL[ticket.priority as keyof typeof PRIORITY_LABEL] ?? ticket.priority}
              </span>
            </Row>
            <Row label="Severity">{ticket.severity}</Row>
            <Row label="Source">{ticket.source}</Row>
          </div>
          <div>
            <Row label="Issue Category">
              {ticket.issue?.name ?? ticket.issue_id ?? '—'}
            </Row>
            <Row label="Assigned Agent">
              {ticket.assigned_agent_id ? `Agent #${ticket.assigned_agent_id}` : 'Unassigned'}
            </Row>
            <Row label="First Response">{fmt(ticket.first_response_at)}</Row>
            <Row label="Resolved At">{fmt(ticket.resolved_at)}</Row>
          </div>
          <div>
            <Row label="Response Due">
              <SlaCountdown due={ticket.response_due_at} status={ticket.status} />
            </Row>
            <Row label="Resolution Due">
              <SlaCountdown due={ticket.resolution_due_at} status={ticket.status} />
            </Row>
            <Row label="Created">{fmt(ticket.created_at)}</Row>
            <Row label="Last Updated">{fmt(ticket.updated_at)}</Row>
          </div>
        </div>
      </div>

      {/* 2. Description */}
      <div style={{
        background: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: 12,
        padding: 24,
      }}>
        <h3 style={{
          margin: '0 0 12px',
          fontSize: '0.85rem',
          color: 'var(--slate-600)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          Description
        </h3>
        <p style={{ margin: 0, color: 'var(--slate-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {ticket.description}
        </p>
      </div>

      {/* 3. Attachments */}
      {hasAttachments && (
        <AttachmentGallery attachments={ticket.attachments!} />
      )}

      {/* 4. Comments */}
      <div style={{
        background: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: 12,
        padding: 24,
      }}>
        <CommentThread ticketId={ticket.id} currentRole="CUSTOMER" allowAttachments />
      </div>

    </div>
  );
}