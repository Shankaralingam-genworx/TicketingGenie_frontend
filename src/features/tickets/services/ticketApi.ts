import type { TicketResponse, CreateTicketPayload } from '../types/ticket.types';
import store from '../../../app/store';

export type { TicketResponse, CreateTicketPayload };

const BASE = import.meta.env.VITE_API_TICKET_URL ?? '';

function authHeader(): HeadersInit {
  const token = (store.getState() as any).auth?.token ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

export async function fetchMyTickets(): Promise<TicketResponse[]> {
  const res = await fetch(`${BASE}/tickets/me`, { headers: authHeader() });
  return handleResponse<TicketResponse[]>(res);
}

export async function fetchTicketById(id: number): Promise<TicketResponse> {
  const res = await fetch(`${BASE}/tickets/${id}`, { headers: authHeader() });
  return handleResponse<TicketResponse>(res);
}

export async function createTicket(payload: CreateTicketPayload): Promise<TicketResponse> {
  const form = new FormData();
  form.append('issue_id',    String(payload.issue_id));
  form.append('title',       payload.title);
  form.append('description', payload.description);
  form.append('priority',    payload.priority);
  payload.attachments?.forEach((f) => form.append('attachments', f));
  const res = await fetch(`${BASE}/tickets/`, {
    method: 'POST',
    headers: authHeader(),
    body: form,
  });
  return handleResponse<TicketResponse>(res);
}
