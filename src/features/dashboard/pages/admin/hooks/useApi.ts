/**
 * hooks/useApi.ts (admin)
 * Thin wrapper around the centralized fetchClient, scoped to the admin section.
 * Kept for backward compatibility with existing section components.
 */

import { useMemo } from 'react';
import { authApi, ticketApi } from '@/lib/fetchClient';

export function useApi(_token: string | null) {
  return useMemo(
    () => ({
      /** service: 'ticket' (default) | 'auth' */
      get: <T = unknown>(path: string, service: 'auth' | 'ticket' = 'ticket') =>
        service === 'auth' ? authApi.get<T>(path) : ticketApi.get<T>(path),

      post: <T = unknown>(path: string, body?: unknown, service: 'auth' | 'ticket' = 'ticket') =>
        service === 'auth' ? authApi.post<T>(path, body) : ticketApi.post<T>(path, body),

      put: <T = unknown>(path: string, body?: unknown, service: 'auth' | 'ticket' = 'ticket') =>
        service === 'auth' ? authApi.put<T>(path, body) : ticketApi.put<T>(path, body),

      patch: <T = unknown>(path: string, body?: unknown, service: 'auth' | 'ticket' = 'ticket') =>
        service === 'auth' ? authApi.patch<T>(path, body) : ticketApi.patch<T>(path, body),

      delete: <T = unknown>(path: string, service: 'auth' | 'ticket' = 'ticket') =>
        service === 'auth' ? authApi.delete<T>(path) : ticketApi.delete<T>(path),
    }),
    [] // no deps — clients are singletons, token comes from localStorage
  );
}
