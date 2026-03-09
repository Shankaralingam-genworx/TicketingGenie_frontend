import { setAuth, logout } from '../features/auth/slices/authSlice';
import store from '../app/store';

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const authBase = import.meta.env.VITE_API_AUTH_URL ?? '';
    const res = await fetch(`${authBase}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      store.dispatch(logout());
      throw new Error('Session expired. Please log in again.');
    }
    const data = await res.json();
    store.dispatch(setAuth({ access_token: data.access_token, user: data.user }));
    return data.access_token;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = store.getState().auth?.token ?? null;
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    try {
      const newToken = await doRefresh();
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(url, { ...init, headers });
    } catch {
      throw new Error('Session expired. Please log in again.');
    }
  }
  return res;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    console.error(`[API ${res.status}]`, JSON.stringify(err, null, 2));
    const msg = Array.isArray(err?.detail)
      ? err.detail.map((d: any) => `${d.loc?.join('.')} — ${d.msg}`).join('; ')
      : (err?.detail ?? 'Request failed');
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(url: string): Promise<T> {
  return handleResponse<T>(await apiFetch(url));
}
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  return handleResponse<T>(await apiFetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
}
export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return handleResponse<T>(await apiFetch(url, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
}
export async function apiDelete(url: string): Promise<void> {
  await handleResponse<void>(await apiFetch(url, { method: 'DELETE' }));
}
export async function apiPostForm<T>(url: string, form: FormData): Promise<T> {
  return handleResponse<T>(await apiFetch(url, { method: 'POST', body: form }));
}
