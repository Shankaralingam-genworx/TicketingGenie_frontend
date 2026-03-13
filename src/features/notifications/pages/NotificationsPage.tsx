/**
 * NotificationsPage — full list of all notifications.
 * File: src/features/notifications/pages/NotificationsPage.tsx
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../hooks/useAppDispatch";
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationType } from "../services/notificationApi";
import { BackIcon } from "@/components/icons";

const TYPE_META: Record<NotificationType, { icon: string; label: string }> = {
  ticket_created: { icon: "🎫", label: "Ticket received" },
  ticket_assigned: { icon: "🧑‍💻", label: "Agent assigned" },
  status_changed: { icon: "🔄", label: "Status updated" },
  comment_received: { icon: "💬", label: "New comment" },
  sla_breached: { icon: "🚨", label: "SLA Breach" },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const ACCENT = "#1D4ED8";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const token = useAppSelector((s: any) => s.auth.token);
  const {
    notifications,
    unreadCount,
    loading,
    handleMarkRead,
    handleMarkAllRead,
  } = useNotifications(token);

  return (
    <>
      <div
        className="dash-page-hdr"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <button
            className="btn btn--outline btn--sm"
            style={{ marginBottom: 12 }}
            onClick={() => navigate(-1)}
          >
            <BackIcon /> Back
          </button>
          <h1 className="dash-page-title">Notifications</h1>
          <p className="dash-page-sub">All your recent alerts and updates.</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="btn btn--outline btn--sm"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </button>
        )}
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid var(--slate-200)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              color: "var(--slate-400)",
            }}
          >
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
            <p style={{ color: "var(--slate-400)", margin: 0 }}>
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? {
              icon: "🔔",
              label: "Notification",
            };
            const isSLA = n.type === "sla_breached";
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: n.is_read
                    ? "transparent"
                    : isSLA
                      ? "#FEF2F2"
                      : `${ACCENT}08`,
                  borderBottom: "1px solid #F1F5F9",
                  padding: "14px 20px",
                  transition: "background 0.15s",
                }}
              >
                {/* Type icon */}
                <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.icon}</span>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: isSLA ? "#DC2626" : ACCENT,
                      }}
                    >
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: n.is_read ? 400 : 600,
                      color: "#0F172A",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.title}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 13,
                      color: "#64748B",
                      lineHeight: 1.5,
                    }}
                  >
                    {n.message}
                  </p>
                  {n.ticket_number && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: 5,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#2563EB",
                        background: "#EFF6FF",
                        padding: "1px 7px",
                        borderRadius: 4,
                        fontFamily: "monospace",
                      }}
                    >
                      {n.ticket_number}
                    </span>
                  )}
                </div>

                {/* Mark as read button — only shown when unread, disappears once read */}
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    style={{
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      color: ACCENT,
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      borderRadius: 6,
                      padding: "5px 10px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#DBEAFE";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#EFF6FF";
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
