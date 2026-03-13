export interface Issue {
  id: number;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at?: string;
}

// types.ts
export interface IssueResolver {
  id: number;
  issue_id: number;
  team_id: number;
  team_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SLA {
  id: number;
  name:string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  customer_tier: 'smb' | 'enterprise';
  response_time_mins: number;
  resolution_time_mins: number;
  additional_response_mins: number;
  additional_resolution_mins: number;
  is_active: boolean;
}

export interface ToastDef {
  id: number;
  msg: string;
  ok: boolean;
}

export type IssueFilter = 'all' | 'active' | 'inactive';
export type SLAView = 'list' | 'matrix';
// ── Staff & Teams ─────────────────────────────────────────────────────────────

export interface StaffMember {
  id:         number;
  name:       string;
  email:      string;
  role:       'support_agent' | 'team_lead';
  is_active:  boolean;
  team_id:    number | null;
  team_name:  string | null;
  created_at: string;
}

export interface TeamMemberInfo {
  user_id: number;
  name:    string;
  email:   string;
  role:    string;
}

export interface TeamDetail {
  id:           number;
  name:         string;
  team_lead_id: number;
  team_lead:    TeamMemberInfo | null;
  members:      TeamMemberInfo[];
  created_at:   string;
}

export interface TeamDropdown {
  id:           number;
  name:         string;
  team_lead_id: number;
}
