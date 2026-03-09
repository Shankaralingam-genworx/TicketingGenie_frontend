/**
 * src/features/users/services/userApi.ts
 * Complete replacement.
 *
 * Adds:
 *   TicketFilters / buildQuery helpers
 *   PaginatedTickets, AgentWorkload, AgentStatusCount types
 *   fetchTeamQueue()      → GET /tickets/team/queue
 *   fetchTeamAllTickets() → GET /tickets/team/all
 *   fetchAgentWorkload()  → GET /tickets/team/agents
 *
 * All original exports kept.
 */
import { apiGet, apiPatch } from '../../../services/fetchClient';
import type { TicketResponse } from '../../tickets/types/ticket.types';

const BASE = import.meta.env.VITE_API_TICKET_URL ?? '';
const AUTH = import.meta.env.VITE_API_AUTH_URL   ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentUser {
  id:         number;
  user_id?:   number;
  name:       string;
  email:      string;
  role:       string;
  is_active:  boolean;
  team_id?:   number;
  team_name?: string;
}

export interface PaginatedTickets {
  items:    TicketResponse[];
  total:    number;
  page:     number;
  per_page: number;
  pages:    number;
}

export interface AgentStatusCount {
  status: string;
  count:  number;
}

export interface AgentWorkload {
  agent_id:    number;
  agent_name:  string;
  agent_email: string;
  total:       number;
  by_status:   AgentStatusCount[];
  tickets:     TicketResponse[];
}

export interface TicketFilters {
  search?:   string;
  status?:   string | string[];
  priority?: string | string[];
  severity?: string | string[];
  category?: string;
  sort_by?:  'remaining_time' | 'priority' | 'severity' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  page?:     number;
  per_page?: number;
}

// ── Query builder ─────────────────────────────────────────────────────────────

function buildQuery(f: TicketFilters): string {
  const p = new URLSearchParams();
  if (f.search)   p.append('search',   f.search);
  if (f.category) p.append('category', f.category);
  if (f.sort_by)  p.append('sort_by',  f.sort_by);
  if (f.sort_dir) p.append('sort_dir', f.sort_dir);
  if (f.page)     p.append('page',     String(f.page));
  if (f.per_page) p.append('per_page', String(f.per_page));
  const arr = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : [v]) : []);
  arr(f.status).forEach(s   => p.append('status',   s));
  arr(f.priority).forEach(s => p.append('priority', s));
  arr(f.severity).forEach(s => p.append('severity', s));
  const q = p.toString();
  return q ? `?${q}` : '';
}

// ── Existing exports (all unchanged) ─────────────────────────────────────────

export async function fetchAssignedTickets(): Promise<TicketResponse[]> {
  return apiGet<TicketResponse[]>(`${BASE}/tickets/assigned`);
}

export async function fetchTicketById(id: number): Promise<TicketResponse> {
  return apiGet<TicketResponse>(`${BASE}/tickets/${id}`);
}

export async function updateTicketStatus(ticketId: number, status: string): Promise<TicketResponse> {
  return apiPatch<TicketResponse>(`${BASE}/tickets/${ticketId}/status`, { status });
}

export async function fetchMyAgents(): Promise<AgentUser[]> {
  return apiGet<AgentUser[]>(`${AUTH}/teams/my-agents`);
}

export async function assignTicket(ticketId: number, agentId: number): Promise<TicketResponse> {
  return apiPatch<TicketResponse>(`${BASE}/tickets/${ticketId}/assign`, { agent_id: agentId });
}

/** @deprecated kept for LeadProfile; prefer fetchTeamAllTickets */
export async function fetchTeamTickets(filters: TicketFilters = {}): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(`${BASE}/tickets/team/all${buildQuery(filters)}`);
}

export async function fetchSlaDashboard(): Promise<TicketResponse[]> {
  return apiGet<TicketResponse[]>(`${BASE}/tickets/team/sla-dashboard`);
}

// ── New team-lead endpoints ───────────────────────────────────────────────────

/** Assignment Queue: NEW + ACKNOWLEDGED unassigned tickets */
export async function fetchTeamQueue(filters: TicketFilters = {}): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(`${BASE}/tickets/team/queue${buildQuery(filters)}`);
}

/** All Tickets: every status, full filter/search/sort/pagination */
export async function fetchTeamAllTickets(filters: TicketFilters = {}): Promise<PaginatedTickets> {
  return apiGet<PaginatedTickets>(`${BASE}/tickets/team/all${buildQuery(filters)}`);
}

/** Agent Workload summary; detail=true includes ticket list per agent */
export async function fetchAgentWorkload(
  filters: TicketFilters = {}, detail = false,
): Promise<AgentWorkload[]> {
  const q   = buildQuery(filters);
  const sep = q ? '&' : '?';
  return apiGet<AgentWorkload[]>(`${BASE}/tickets/team/agents${q}${sep}detail=${detail}`);
}