import { ticketApi } from '@/lib/fetchClient';
import env from '@/config/env';
import store from '@/app/store';

export type NotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'status_changed'
  | 'comment_received'
  | 'sla_breached';

export type NotificationActor = 'customer' | 'support_agent' | 'team_lead' | 'system';

export interface NotificationItem {
  id:             number;
  recipient_id:   number;
  recipient_role: NotificationActor;
  ticket_id:      number | null;
  ticket_number:  string | null;
  type:           NotificationType;
  title:          string;
  message:        string;
  is_read:        boolean;
  read_at:        string | null;
  created_at:     string;
}

export interface NotificationListResponse {
  items:         NotificationItem[];
  total_unread:  number;
  total:         number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export const notificationService = {
  fetchAll: (unreadOnly = false, limit = 30): Promise<NotificationListResponse> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (unreadOnly) params.set('unread_only', 'true');
    return ticketApi.get<NotificationListResponse>(`/notifications/?${params}`);
  },

  fetchUnreadCount: (): Promise<UnreadCountResponse> =>
    ticketApi.get<UnreadCountResponse>('/notifications/unread-count'),

  markOneRead: (id: number): Promise<NotificationItem> =>
    ticketApi.patch<NotificationItem>(`/notifications/${id}/read`),

  markAllRead: (): Promise<UnreadCountResponse> =>
    ticketApi.patch<UnreadCountResponse>('/notifications/read-all'),

  /**
   * Opens SSE stream. Returns a cleanup function to call on unmount.
   * Token is passed as query param (EventSource doesn't support headers).
   */
  openStream: (
    token: string,
    onNotification: (payload: { unread_count: number; notification: NotificationItem }) => void,
    onConnected?:   (unread_count: number) => void,
  ): () => void => {
    const url = `${env.API_TICKET_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);

    es.addEventListener('connected', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onConnected?.(data.unread_count ?? 0);
      } catch {}
    });

    es.addEventListener('notification', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data);
        onNotification(data);
      } catch {}
    });

    es.onerror = () => { /* browser auto-reconnects */ };

    return () => es.close();
  },
};
