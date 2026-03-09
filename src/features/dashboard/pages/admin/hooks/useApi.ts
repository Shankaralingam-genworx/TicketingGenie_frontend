import { useCallback, useMemo } from 'react';
import { TICKET_API, AUTH_API } from '../constants';

export interface ApiClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get:     (path: string, baseUrl?: 'ticket' | 'auth') => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post:    (path: string, body: unknown, baseUrl?: 'ticket' | 'auth') => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put:     (path: string, body: unknown, baseUrl?: 'ticket' | 'auth') => Promise<any>;
  del:     (path: string, baseUrl?: 'ticket' | 'auth') => Promise<void>;
}

/**
 * Provides stable API helpers for the admin panel.
 *
 * Supports two base URLs:
 *  - 'ticket' (default) → TICKET_API  e.g. http://127.0.0.1:8002/api/v1
 *  - 'auth'             → AUTH_API    e.g. http://127.0.0.1:8001/api/v1
 *
 * Usage:
 *   api.get('/issues/')                          // → TICKET_API/issues/
 *   api.get('/admin/teams_dropdown', 'auth')     // → AUTH_API/admin/teams_dropdown
 *
 * ⚠️ BUG FIX — why useMemo is required here:
 *
 * Without it, `useApi` returned a brand-new `{ get, post, put, del }` object
 * on *every* render.  The load callbacks (`loadIssues` etc.) listed `api` in
 * their `useCallback` dependency array, so they were recreated every render.
 * The root `useEffect([loadIssues, loadSLAs, loadResolvers])` then fired again,
 * triggering fresh fetches → state updates → re-renders → new `api` object →
 * repeat — an infinite fetch loop (hundreds of identical GET requests per
 * second, visible in both the backend terminal and browser console).
 *
 * Wrapping the returned object in `useMemo` ensures the object reference is
 * only replaced when one of the underlying callbacks actually changes (i.e.
 * only when `token` changes), which breaks the cycle entirely.
 */
export function useApi(token: string | null): ApiClient {
  const makeHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  // Resolves which base URL to use — defaults to TICKET_API
  const resolveBase = useCallback(
    (baseUrl?: 'ticket' | 'auth') =>
      baseUrl === 'auth' ? AUTH_API : TICKET_API,
    [],
  );

  const get = useCallback(
    (path: string, baseUrl?: 'ticket' | 'auth'): Promise<any> =>
      fetch(`${resolveBase(baseUrl)}${path}`, { headers: makeHeaders() }).then((r) => {
        if (!r.ok)
          return r
            .json()
            .catch(() => ({}))
            .then((e: any) => {
              throw new Error(e.detail ?? `GET ${path} failed (${r.status})`);
            });
        return r.json();
      }),
    [makeHeaders, resolveBase],
  );

  const post = useCallback(
    (path: string, body: unknown, baseUrl?: 'ticket' | 'auth'): Promise<any> =>
      fetch(`${resolveBase(baseUrl)}${path}`, {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok)
          return r
            .json()
            .catch(() => ({}))
            .then((e: any) => {
              throw new Error(e.detail ?? `POST ${path} failed (${r.status})`);
            });
        return r.json();
      }),
    [makeHeaders, resolveBase],
  );

  const put = useCallback(
    (path: string, body: unknown, baseUrl?: 'ticket' | 'auth'): Promise<any> =>
      fetch(`${resolveBase(baseUrl)}${path}`, {
        method: 'PUT',
        headers: makeHeaders(),
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok)
          return r
            .json()
            .catch(() => ({}))
            .then((e: any) => {
              throw new Error(e.detail ?? `PUT ${path} failed (${r.status})`);
            });
        return r.json();
      }),
    [makeHeaders, resolveBase],
  );

  const del = useCallback(
    (path: string, baseUrl?: 'ticket' | 'auth'): Promise<void> =>
      fetch(`${resolveBase(baseUrl)}${path}`, {
        method: 'DELETE',
        headers: makeHeaders(),
      }).then((r) => {
        if (!r.ok)
          return r
            .json()
            .catch(() => ({}))
            .then((e: any) => {
              throw new Error(
                e.detail ?? `DELETE ${path} failed (${r.status})`,
              );
            });
      }),
    [makeHeaders, resolveBase],
  );

  // ✅ THE FIX: memoize the returned object so its reference only changes
  // when one of the underlying functions actually changes (i.e. when `token`
  // changes).  Without this, a new object is created every render, which
  // causes load callbacks to be re-created and the initial useEffect to fire
  // again → infinite loop.
  return useMemo(() => ({ get, post, put, del }), [get, post, put, del]);
}