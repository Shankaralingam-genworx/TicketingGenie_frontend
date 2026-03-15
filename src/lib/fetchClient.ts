/**
 * lib/fetchClient.ts
 * Single centralized HTTP client for the entire app.
 * Two exported instances: authApi and ticketApi.
 * Token refresh is handled transparently on 401.
 */

import env from '@/config/env';
import { sessionEvents } from '@/lib/sessionEvents';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Pass null explicitly to skip auth header */
  token?: string | null;
  formData?: FormData;
}

// Singleton refresh promise — prevents parallel refresh races
let _refreshPromise: Promise<string> | null = null;

async function doRefresh(authBaseUrl: string): Promise<string> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const res = await fetch(`${authBaseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      // Clear token from Redux store — import lazily to avoid circular deps
      const { default: store } = await import('@/app/store');
      const { logout } = await import('@/features/auth/slices/authSlice');
      store.dispatch(logout());
      sessionEvents.emit('expired');
      throw new Error('Session expired. Please log in again.');
    }

    const data = await res.json();
    const { default: store } = await import('@/app/store');
    const { setAuth } = await import('@/features/auth/slices/authSlice');
    store.dispatch(setAuth({ access_token: data.access_token, user: data.user }));
    return data.access_token as string;
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

class FetchClient {
  private baseUrl: string;
  private authBaseUrl: string;

  constructor(baseUrl: string, authBaseUrl: string) {
    this.baseUrl = baseUrl;
    this.authBaseUrl = authBaseUrl;
  }

  private getToken(): string | null {
    try {
      // Read from Redux store (single source of truth for the access token)
      const storeModule = (window as any).__tg_store__;
      if (storeModule) {
        return storeModule.getState().auth?.token ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async request<T>(
    method: Method,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const token = options.token !== undefined ? options.token : this.getToken();

    const headers: Record<string, string> = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let body: BodyInit | undefined;
    if (options.formData) {
      body = options.formData;
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body,
      credentials: 'include',
    });

    // Transparent token refresh on 401
    if (res.status === 401 && options.token === undefined) {
      try {
        const newToken = await doRefresh(this.authBaseUrl);
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retryRes = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: retryHeaders,
          body,
          credentials: 'include',
        });
        return this.handleResponse<T>(retryRes);
      } catch {
        throw new Error('Session expired. Please log in again.');
      }
    }

    return this.handleResponse<T>(res);
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        if (Array.isArray(err?.detail)) {
          detail = err.detail
            .map((d: any) => `${d.loc?.join('.') ?? ''} — ${d.msg}`)
            .join('; ');
        } else {
          detail = err?.detail ?? err?.message ?? detail;
        }
      } catch {
        // non-JSON error body
      }
      throw new Error(detail);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  get<T>(path: string, opts?: RequestOptions) {
    return this.request<T>('GET', path, opts);
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return this.request<T>('POST', path, { ...opts, body });
  }

  put<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return this.request<T>('PUT', path, { ...opts, body });
  }

  patch<T>(path: string, body?: unknown, opts?: RequestOptions) {
    return this.request<T>('PATCH', path, { ...opts, body });
  }

  delete<T>(path: string, opts?: RequestOptions) {
    return this.request<T>('DELETE', path, opts);
  }
}

/** Auth-service client (→ VITE_API_AUTH_URL) */
export const authApi = new FetchClient(env.API_AUTH_URL, env.API_AUTH_URL);

/** Ticket-service client (→ VITE_API_TICKET_URL) */
export const ticketApi = new FetchClient(env.API_TICKET_URL, env.API_AUTH_URL);

export default FetchClient;
