import { authApi } from '@/lib/fetchClient';

export interface TeamMemberInfo {
  user_id: number;
  name:    string;
  email:   string;
  role:    string;
}

export interface TeamDetailResponse {
  id:           number;
  name:         string;
  team_lead_id: number;
  team_lead:    TeamMemberInfo | null;
  members:      TeamMemberInfo[];
  created_at:   string;
}

export interface CreateTeamRequest {
  name:          string;
  team_lead_id:  number;
  agent_ids:     number[];
}

export interface UpdateTeamRequest {
  name?:              string;
  team_lead_id?:      number;
  add_agent_ids?:     number[];
  remove_agent_ids?:  number[];
}

export const teamService = {
  fetchAll:  ():                          Promise<TeamDetailResponse[]> => authApi.get('/admin/teams'),
  fetchById: (id: number):               Promise<TeamDetailResponse>   => authApi.get(`/admin/teams/${id}`),
  create:    (d: CreateTeamRequest):     Promise<TeamDetailResponse>   => authApi.post('/admin/teams', d),
  update:    (id: number, d: UpdateTeamRequest): Promise<TeamDetailResponse> => authApi.patch(`/admin/teams/${id}`, d),
  remove:    (id: number):               Promise<void>                 => authApi.delete(`/admin/teams/${id}`),
};
