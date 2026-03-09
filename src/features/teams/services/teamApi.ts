import { apiGet, apiPost, apiPatch, apiDelete } from '../../../services/fetchClient';

const A = import.meta.env.VITE_API_AUTH_URL ?? '';

export interface StaffResponse {
  id: number; name: string; email: string; role: string;
  is_active: boolean; team_id: number | null; team_name: string | null; created_at: string;
}

export interface UserResponse {
  id: number; name: string; email: string; role: string;
  is_active: boolean; created_at: string;
}

export interface TeamMemberInfo {
  user_id: number; name: string; email: string; role: string;
}

export interface TeamDetailResponse {
  id: number; name: string; team_lead_id: number;
  team_lead: TeamMemberInfo | null; members: TeamMemberInfo[]; created_at: string;
}

export interface CreateStaffRequest { name: string; email: string; role: 'SUPPORT_AGENT' | 'TEAM_LEAD'; }
export interface CreateTeamRequest  { name: string; team_lead_id: number; agent_ids: number[]; }
export interface UpdateTeamRequest  { name?: string; team_lead_id?: number; add_agent_ids?: number[]; remove_agent_ids?: number[]; }

export const fetchAllStaff  = ()                             => apiGet<StaffResponse[]>(`${A}/admin/staff`);
export const fetchStaff     = (id: number)                   => apiGet<StaffResponse>(`${A}/admin/staff/${id}`);
export const createStaff    = (d: CreateStaffRequest)        => apiPost<StaffResponse>(`${A}/admin/staff`, d);
export const fetchAllUsers  = ()                             => apiGet<{ users: UserResponse[]; total: number }>(`${A}/users/`);
export const fetchAllTeams  = ()                             => apiGet<TeamDetailResponse[]>(`${A}/admin/teams`);
export const fetchTeam      = (id: number)                   => apiGet<TeamDetailResponse>(`${A}/admin/teams/${id}`);
export const createTeam     = (d: CreateTeamRequest)         => apiPost<TeamDetailResponse>(`${A}/admin/teams`, d);
export const updateTeam     = (id: number, d: UpdateTeamRequest) => apiPatch<TeamDetailResponse>(`${A}/admin/teams/${id}`, d);
export const deleteTeam     = (id: number)                   => apiDelete(`${A}/admin/teams/${id}`);
