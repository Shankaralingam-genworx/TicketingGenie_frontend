/**
 * NotificationBell — bell icon + dropdown panel.
 * File: src/features/notifications/components/NotificationBell.tsx
 *
 * Drop this into any dashboard topbar:
 *   <NotificationBell token={token} accentColor="#6D28D9" onNavigate={(ticketId) => navigate(`tickets/${ticketId}`)} />
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationItem, NotificationType } from '../services/notificationApi';

interface NotificationBellProps {
  token: string | null;
  accentColor: string;         // role brand colour for the badge + active states
  onNavigate?: (ticketId: number | null, ticketNumber: string | null) => void;
}

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { icon: string; label: string }> = {
  ticket_created:   { icon: '🎫', label: 'Ticket received'  },
  ticket_assigned:  { icon: '🧑‍💻', label: 'Agent assigned'   },
  status_changed:   { icon: '🔄', label: 'Status updated'   },
  comment_received: { icon: '💬', label: 'New comment'       },
  sla_breached:     { icon: '🚨', label: 'SLA Breach'        },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NotifRow({
  notif,
  accent,
  onRead,
  onNavigate,
}: {
  notif: NotificationItem;
  accent: string;
  onRead: (id: number) => void;
  onNavigate?: (ticketId: number | null, ticketNumber: string | null) => void;
}) {
  const meta = TYPE_META[notif.type] ?? { icon: '🔔', label: 'Notification' };
  const isSLA = notif.type === 'sla_breached';

  const handleClick = () => {
    if (!notif.is_read) onRead(notif.id);
    onNavigate?.(notif.ticket_id, notif.ticket_number);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: notif.is_read ? 'transparent' : isSLA ? '#FEF2F2' : `${accent}08`,
        border: 'none',
        borderBottom: '1px solid #F1F5F9',
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = notif.is_read
          ? 'transparent'
          : isSLA ? '#FEF2F2' : `${accent}08`;
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Dot */}
        <div style={{ paddingTop: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: isSLA ? '#DC2626' : accent,
            }}>
              {meta.label}
            </span>
            <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, marginLeft: 8 }}>
              {timeAgo(notif.created_at)}
            </span>
          </div>

          <p style={{
            margin: 0,
            fontSize: 13,
            fontWeight: notif.is_read ? 400 : 600,
            color: '#0F172A',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {notif.title}
          </p>

          <p style={{
            margin: '2px 0 0',
            fontSize: 12,
            color: '#64748B',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {notif.message}
          </p>

          {notif.ticket_number && (
            <span style={{
              display: 'inline-block',
              marginTop: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#2563EB',
              background: '#EFF6FF',
              padding: '1px 7px',
              borderRadius: 4,
              fontFamily: 'monospace',
            }}>
              {notif.ticket_number}
            </span>
          )}
        </div>

        {/* Unread dot */}
        {!notif.is_read && (
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isSLA ? '#DC2626' : accent,
            flexShrink: 0,
            marginTop: 5,
          }} />
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NotificationBell({
  token,
  accentColor,
  onNavigate,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef        = useRef<HTMLDivElement>(null);
  const btnRef          = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, loading, handleMarkRead, handleMarkAllRead } =
    useNotifications(token);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: open ? `2px solid ${accentColor}` : '2px solid #E2E8F0',
          background: open ? `${accentColor}12` : '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          outline: 'none',
        }}
        title="Notifications"
      >
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke={open ? accentColor : '#64748B'} strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6zM8.5 17.5a1.5 1.5 0 003 0" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 17,
            height: 17,
            borderRadius: 9,
            background: unreadCount > 0 && notifications.some(n => n.type === 'sla_breached' && !n.is_read)
              ? '#DC2626'
              : accentColor,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #fff',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 360,
            maxHeight: 480,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 40px rgba(15,23,42,0.14)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: accentColor,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 100,
                }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: 12,
                  color: accentColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 3).map((n) => (
                <NotifRow
                  key={n.id}
                  notif={n}
                  accent={accentColor}
                  onRead={handleMarkRead}
                  onNavigate={(tid, tnum) => {
                    setOpen(false);
                    onNavigate?.(tid, tnum);
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #F1F5F9',
              textAlign: 'center',
            }}>
              <button
                onClick={() => { setOpen(false); onNavigate?.(null, '__all_notifications__'); }}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: accentColor,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}