/**
 * src/features/users/services/userApi.ts
 */

import { apiGet, apiPatch, apiPost } from '../../../services/fetchClient';
import type { TicketResponse } from '../../tickets/types/ticket.types';

const BASE = import.meta.env.VITE_API_TICKET_URL ?? '';
const AUTH = import.meta.env.VITE_API_AUTH_URL ?? '';

/* ── Types ───────────────────────────────────────────────────────────── */

export interface AgentUser {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  team_id?: number;
  team_name?: string;
}

export interface PaginatedTickets {
  items: TicketResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface AgentStatusCount {
  status: string;
  count: number;
}

export interface AgentWorkload {
  agent_id: number;
  agent_name: string;
  agent_email: string;
  total: number;
  by_status: AgentStatusCount[];
  tickets: TicketResponse[];
}

export interface TicketFilters {
  search?: string;
  status?: string | string[];
  priority?: string | string[];
  severity?: string | string[];
  category?: string;
  sort_by?: 'remaining_time' | 'priority' | 'severity' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

/* ── Escalation Payload ───────────────────────────────────────────────── */

export interface EscalationReassignPayload {
  new_agent_id: number;
  escalated_response_mins: number | null;
  escalated_resolution_mins: number | null;
}

/* ── Query builder ───────────────────────────────────────────────────── */

function buildQuery(f: TicketFilters): string {
  const p = new URLSearchParams();

  if (f.search) p.append('search', f.search);
  if (f.category) p.append('category', f.category);
  if (f.sort_by) p.append('sort_by', f.sort_by);
  if (f.sort_dir) p.append('sort_dir', f.sort_dir);
  if (f.page) p.append('page', String(f.page));
  if (f.per_page) p.append('per_page', String(f.per_page));

  const arr = (v?: string | string[]) =>
    v ? (Array.isArray(v) ? v : [v]) : [];

  arr(f.status).forEach(s => p.append('status', s));
  arr(f.priority).forEach(s => p.append('priority', s));
  arr(f.severity).forEach(s => p.append('severity', s));

  const q = p.toString();
  return q ? `?${q}` : '';
}

/* ── Shared ──────────────────────────────────────────────────────────── */

export async function fetchTicketById(id: number): Promise<TicketResponse> {
  return apiGet<TicketResponse>(`${BASE}/tickets/${id}`);
}

export async function updateTicketStatus(
  ticketId: number,
  status: string
): Promise<TicketResponse> {
  return apiPatch<TicketResponse>(
    `${BASE}/tickets/${ticketId}/status`,
    { status }
  );
}

/* ── Agent ───────────────────────────────────────────────────────────── */

export async function fetchAssignedTickets(): Promise<TicketResponse[]> {
  return apiGet<TicketResponse[]>(`${BASE}/tickets/assigned`);
}

export async function fetchAgentAllTickets(
  filters: TicketFilters = {}
): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(
    `${BASE}/tickets/assigned/all${buildQuery(filters)}`
  );
}

/* ── Team Lead ───────────────────────────────────────────────────────── */

export async function fetchMyAgents(): Promise<AgentUser[]> {
  return apiGet<AgentUser[]>(`${AUTH}/teams/my-agents`);
}

export async function assignTicket(
  ticketId: number,
  agentId: number
): Promise<TicketResponse> {
  return apiPatch<TicketResponse>(
    `${BASE}/tickets/${ticketId}/assign`,
    { agent_id: agentId }
  );
}

/** @deprecated use fetchTeamAllTickets instead */
export async function fetchTeamTickets(
  filters: TicketFilters = {}
): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(
    `${BASE}/tickets/team/all${buildQuery(filters)}`
  );
}

export async function fetchTeamQueue(
  filters: TicketFilters = {}
): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(
    `${BASE}/tickets/team/queue${buildQuery(filters)}`
  );
}

export async function fetchTeamAllTickets(
  filters: TicketFilters = {}
): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(
    `${BASE}/tickets/team/all${buildQuery(filters)}`
  );
}

export async function fetchAgentWorkload(
  filters: TicketFilters = {},
  detail = false
): Promise<AgentWorkload[]> {

  const q = buildQuery(filters);
  const sep = q ? '&' : '?';

  return apiGet<AgentWorkload[]>(
    `${BASE}/tickets/team/agents${q}${sep}detail=${detail}`
  );
}

/* ── Escalation reassignment request ─────────────────────────────────── */

export async function reassignEscalatedTicket(
  ticketId: number,
  payload: EscalationReassignPayload
): Promise<TicketResponse> {

  return apiPost<TicketResponse>(
    `${BASE}/tickets/${ticketId}/escalation/reassign`,
    payload
  );
}

/* ── Fetch escalated tickets ─────────────────────────────────────────── */

export async function fetchEscalatedTickets(
  filters: TicketFilters = {}
): Promise<PaginatedTickets> {

  const params = new URLSearchParams();

  params.set('is_escalated', 'true');

  if (filters.search) params.set('search', filters.search);
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_dir) params.set('sort_dir', filters.sort_dir);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));

  const toArr = (v?: string | string[]) =>
    v ? (Array.isArray(v) ? v : [v]) : [];

  toArr(filters.priority).forEach(v => params.append('priority', v));
  toArr(filters.severity).forEach(v => params.append('severity', v));

  return apiGet<PaginatedTickets>(
    `${BASE}/tickets/team?${params.toString()}`
  );
}


/**
 * POST /tickets/{id}/start-working
 * Agent clicks "Start Working" on an ASSIGNED ticket.
 * Backend sets: work_started_at, first_response_at, resolution_due_at
 * Transitions ticket: ASSIGNED → OPEN
 */
export async function startWorkingOnTicket(ticketId: number): Promise<TicketResponse> {
  return apiPost<TicketResponse>(
    `${BASE}/tickets/${ticketId}/start-working`,
    {},
  );
}
