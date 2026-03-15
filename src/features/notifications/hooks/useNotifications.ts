import { useCallback, useEffect, useRef, useState } from 'react';
import {
  notificationService,
  type NotificationItem,
} from '../services/notificationService';

interface UseNotificationsReturn {
  notifications:    NotificationItem[];
  unreadCount:      number;
  loading:          boolean;
  handleMarkRead:   (id: number) => Promise<void>;
  handleMarkAllRead: () => Promise<void>;
  refresh:          () => Promise<void>;
}

export function useNotifications(token: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await notificationService.fetchAll(false, 30);
      setNotifications(data.items);
      setUnreadCount(data.total_unread);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    refresh();

    const cleanup = notificationService.openStream(
      token,
      ({ unread_count, notification }) => {
        setUnreadCount(unread_count);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev].slice(0, 50);
        });
      },
      (unread_count) => setUnreadCount(unread_count),
    );

    cleanupRef.current = cleanup;
    return () => { cleanup(); cleanupRef.current = null; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkRead = useCallback(async (id: number) => {
    try {
      await notificationService.markOneRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return { notifications, unreadCount, loading, handleMarkRead, handleMarkAllRead, refresh };
}
