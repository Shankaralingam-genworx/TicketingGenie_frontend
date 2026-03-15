import { ticketApi, authApi } from '@/lib/fetchClient';
import type { TicketResponse } from '@/features/tickets/types/ticket.types';

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

export interface EscalationReassignPayload {
  new_agent_id:              number;
  escalated_response_mins?:  number;
  escalated_resolution_mins?: number;
}

export interface StaffResponse {
  id:         number;
  name:       string;
  email:      string;
  role:       string;
  is_active:  boolean;
  team_id:    number | null;
  team_name:  string | null;
  created_at: string;
}

function buildQuery(filters: TicketFilters): string {
  const params = new URLSearchParams();
  if (filters.search)   params.set('search',   filters.search);
  if (filters.sort_by)  params.set('sort_by',  filters.sort_by);
  if (filters.sort_dir) params.set('sort_dir', filters.sort_dir);
  if (filters.page)     params.set('page',     String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));

  const toArr = (v?: string | string[]) =>
    v ? (Array.isArray(v) ? v : [v]) : [];

  toArr(filters.status).forEach(v   => params.append('status',   v));
  toArr(filters.priority).forEach(v => params.append('priority', v));
  toArr(filters.severity).forEach(v => params.append('severity', v));

  const q = params.toString();
  return q ? `?${q}` : '';
}

export const userService = {
  // ── Agent ──────────────────────────────────────────────────────────────
  fetchAssignedTickets: (filters: TicketFilters = {}): Promise<TicketResponse[]> =>
    ticketApi.get<TicketResponse[]>(`/tickets/assigned${buildQuery(filters)}`),

  fetchTicketById: (id: number): Promise<TicketResponse> =>
    ticketApi.get<TicketResponse>(`/tickets/${id}`),

  updateTicketStatus: (id: number, status: string, notes?: string): Promise<TicketResponse> =>
    ticketApi.patch<TicketResponse>(`/tickets/${id}/status`, { status, notes }),

  startWorkingOnTicket: (ticketId: number): Promise<TicketResponse> =>
    ticketApi.post<TicketResponse>(`/tickets/${ticketId}/start-working`, {}),

  // ── Team Lead ──────────────────────────────────────────────────────────
  fetchTeamQueue: (filters: TicketFilters = {}): Promise<PaginatedTickets> =>
    ticketApi.get<PaginatedTickets>(`/tickets/team/queue${buildQuery(filters)}`),

  fetchTeamAllTickets: (filters: TicketFilters = {}): Promise<PaginatedTickets> =>
    ticketApi.get<PaginatedTickets>(`/tickets/team/all${buildQuery(filters)}`),

  fetchAgentWorkload: (filters: TicketFilters = {}, detail = false): Promise<AgentWorkload[]> => {
    const q   = buildQuery(filters);
    const sep = q ? '&' : '?';
    return ticketApi.get<AgentWorkload[]>(`/tickets/team/agents${q}${sep}detail=${detail}`);
  },

  fetchMyAgents: async (): Promise<AgentUser[]> => {
  const res = await ticketApi.get<AgentWorkload[]>('/tickets/team/agents');

  return res.map((a) => ({
    id: a.agent_id,
    name: a.agent_name,
    email: a.agent_email,
    role: "agent",
    is_active: true
  }));
},

  assignTicket: (ticketId: number, agentId: number): Promise<TicketResponse> =>
    ticketApi.patch<TicketResponse>(`/tickets/${ticketId}/assign`, { agent_id: agentId }),

  reassignEscalatedTicket: (
    ticketId: number,
    payload:  EscalationReassignPayload,
  ): Promise<TicketResponse> =>
    ticketApi.post<TicketResponse>(`/tickets/${ticketId}/escalation/reassign`, payload),

  fetchEscalatedTickets: (filters: TicketFilters = {}): Promise<PaginatedTickets> => {
    const params = new URLSearchParams({ is_escalated: 'true' });
    if (filters.search)   params.set('search',   filters.search);
    if (filters.sort_by)  params.set('sort_by',  filters.sort_by);
    if (filters.sort_dir) params.set('sort_dir', filters.sort_dir);
    if (filters.page)     params.set('page',     String(filters.page));
    if (filters.per_page) params.set('per_page', String(filters.per_page));
    const toArr = (v?: string | string[]) => v ? (Array.isArray(v) ? v : [v]) : [];
    toArr(filters.priority).forEach(v => params.append('priority', v));
    toArr(filters.severity).forEach(v => params.append('severity', v));
    return ticketApi.get<PaginatedTickets>(`/tickets/team?${params.toString()}`);
  },

  // ── Profile ────────────────────────────────────────────────────────────
  fetchAllStaff: (): Promise<StaffResponse[]> =>
    authApi.get<StaffResponse[]>('/admin/staff'),
};

// Named exports for backward compat with old direct imports
export const {
  fetchAssignedTickets,
  fetchTicketById,
  updateTicketStatus,
  startWorkingOnTicket,
  fetchTeamQueue,
  fetchTeamAllTickets,
  fetchAgentWorkload,
  fetchMyAgents,
  assignTicket,
  reassignEscalatedTicket,
  fetchEscalatedTickets,
} = userService;

// Legacy alias kept for old imports
export const fetchTeamTickets = userService.fetchTeamAllTickets;
