/**
 * useNotifications — shared hook for all dashboard roles.
 * File: src/features/notifications/hooks/useNotifications.ts
 *
 * Manages:
 *   - SSE connection for real-time pushes
 *   - In-memory notification list
 *   - Unread badge count
 *   - mark-read / mark-all-read actions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchNotifications,
  markAllRead,
  markOneRead,
  openNotificationStream,
  type NotificationItem,
} from '../services/notificationApi';

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  handleMarkRead: (id: number) => Promise<void>;
  handleMarkAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(token: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchNotifications(false, 30);
      setNotifications(data.items);
      setUnreadCount(data.total_unread);
    } catch {
      // silent — badge just stays at last known value
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── SSE connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    refresh();

    const cleanup = openNotificationStream(
      token,
      // onNotification — new push received
      ({ unread_count, notification }) => {
        setUnreadCount(unread_count);
        setNotifications((prev) => {
          // Avoid duplicates
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev].slice(0, 50);
        });
      },
      // onConnected — SSE handshake, sync badge immediately
      (unread_count) => {
        setUnreadCount(unread_count);
      },
    );

    cleanupRef.current = cleanup;
    return () => {
      cleanup();
      cleanupRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async (id: number) => {
    try {
      await markOneRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return { notifications, unreadCount, loading, handleMarkRead, handleMarkAllRead, refresh };
}