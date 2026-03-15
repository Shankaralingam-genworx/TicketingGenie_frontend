import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionEvents } from '@/lib/sessionEvents';

/**
 * useSessionExpiry
 * Mount this once inside a dashboard shell.
 * When the fetchClient fires 'expired' (refresh failed),
 * this hook shows a toast and redirects to /login.
 *
 * Pass addToast from useToasts() if available, otherwise
 * falls back to a browser alert.
 */
export function useSessionExpiry(addToast?: (msg: string, ok?: boolean) => void) {
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = sessionEvents.on('expired', () => {
      const msg = 'Your session has expired. Please sign in again.';
      if (addToast) {
        addToast(msg, false);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else {
        navigate('/login', { replace: true });
      }
    });
    return unsub;
  }, [navigate, addToast]);
}
