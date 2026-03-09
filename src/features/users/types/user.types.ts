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
