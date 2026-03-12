/**
 * Notification API service.
 * File: src/features/notifications/services/notificationApi.ts
 */

import store from '../../../app/store';
import env from "../../../config/env";

const BASE = `${env.API_TICKET_URL}`;

export type NotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'status_changed'
  | 'comment_received'
  | 'sla_breached';

export type NotificationActor = 'customer' | 'support_agent' | 'team_lead' | 'system';

export interface NotificationItem {
  id: number;
  recipient_id: number;
  recipient_role: NotificationActor;
  ticket_id: number | null;
  ticket_number: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total_unread: number;
  total: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

function authHeader(): HeadersInit {
  const token = (store.getState() as any).auth?.token ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err?.detail ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function fetchNotifications(
  unreadOnly = false,
  limit = 30,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (unreadOnly) params.set('unread_only', 'true');
  const res = await fetch(`${BASE}/notifications/?${params}`, {
    headers: authHeader(),
  });
  return handle<NotificationListResponse>(res);
}

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const res = await fetch(`${BASE}/notifications/unread-count`, {
    headers: authHeader(),
  });
  return handle<UnreadCountResponse>(res);
}

export async function markOneRead(id: number): Promise<NotificationItem> {
  const res = await fetch(`${BASE}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  return handle<NotificationItem>(res);
}

export async function markAllRead(): Promise<UnreadCountResponse> {
  const res = await fetch(`${BASE}/notifications/read-all`, {
    method: 'PATCH',
    headers: authHeader(),
  });
  return handle<UnreadCountResponse>(res);
}

/**
 * Opens an SSE connection to the notification stream.
 * Returns a cleanup function — call it on component unmount.
 *
 * Usage:
 *   const cleanup = openNotificationStream(token, (payload) => { ... });
 *   return () => cleanup();
 */
export function openNotificationStream(
  token: string,
  onNotification: (payload: { unread_count: number; notification: NotificationItem }) => void,
  onConnected?: (unread_count: number) => void,
): () => void {
  // EventSource doesn't support custom headers, so we pass the token as a
  // query param. Your backend nginx/FastAPI should accept ?token= as well,
  // OR you can use a cookie-based auth strategy.
  // If your backend reads Authorization header only, use a polyfill like
  // `extended-eventsource` and swap this block accordingly.
  const url = `${BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
  const es = new EventSource(url);

  es.addEventListener('connected', (e) => {
    try {
      const data = JSON.parse(e.data);
      onConnected?.(data.unread_count ?? 0);
    } catch {}
  });

  es.addEventListener('notification', (e) => {
    try {
      const data = JSON.parse(e.data);
      onNotification(data);
    } catch {}
  });

  // 'ping' events are silently ignored

  es.onerror = () => {
    // Browser will auto-reconnect on network errors
  };

  return () => es.close();
}