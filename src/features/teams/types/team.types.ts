export interface TeamMemberInfo { user_id: number; name: string; email: string; role: string; }
export interface TeamDetailResponse {
  id: number; name: string; team_lead_id: number;
  team_lead: TeamMemberInfo | null; members: TeamMemberInfo[]; created_at: string;
}
export interface CreateTeamRequest  { name: string; team_lead_id: number; agent_ids: number[]; }
export interface UpdateTeamRequest  { name?: string; team_lead_id?: number; add_agent_ids?: number[]; remove_agent_ids?: number[]; }
