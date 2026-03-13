/**
 * lib/fetchClient.ts
 * Centralized HTTP client for all API calls.
 * Reads the token from Redux store on every request so it's always fresh.
 * Usage:
 *   import { authApi, ticketApi } from '@/lib/fetchClient';
 *   const data = await authApi.get('/auth/me');
 *   const result = await ticketApi.post('/tickets', body);
 */

import env from '@/config/env';
import { STORAGE_KEYS } from '@/config/constants';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Pass explicitly to override the token from localStorage */
  token?: string | null;
  /** Use multipart/form-data (skip JSON stringify) */
  formData?: FormData;
}

class FetchClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
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

    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let body: BodyInit | undefined;
    if (options.formData) {
      body = options.formData;
      // Don't set Content-Type — browser sets it with boundary automatically
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

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        detail = err?.detail ?? err?.message ?? detail;
      } catch {
        // non-JSON error body
      }
      throw new Error(detail);
    }

    // 204 No Content
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

/** Auth-service client  (→ VITE_API_AUTH_URL) */
export const authApi = new FetchClient(env.API_AUTH_URL);

/** Ticket-service client (→ VITE_API_TICKET_URL) */
export const ticketApi = new FetchClient(env.API_TICKET_URL);

export default FetchClient;
