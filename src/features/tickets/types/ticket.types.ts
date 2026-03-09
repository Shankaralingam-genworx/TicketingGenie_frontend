export enum TicketStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  ASSIGNED = 'assigned',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum Priority {
  P1 = 'p1',
  P2 = 'p2',
  P3 = 'p3',
  P4 = 'p4',
}

export enum TicketSource {
  WEB   = 'web',
  EMAIL = 'email',
}

export enum CustomerTier {
  ENTERPRISE = 'enterprise',
  SMB = 'smb',
}

export enum Severity {
  LOW      = 'low',
  MEDIUM   = 'medium',
  HIGH     = 'high',
  CRITICAL = 'critical',
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'New',
  [TicketStatus.ACKNOWLEDGED]: 'Acknowledged',
  [TicketStatus.ASSIGNED]: 'Assigned',
  [TicketStatus.OPEN]: 'Open',
  [TicketStatus.IN_PROGRESS]: 'In Progress',
  [TicketStatus.ON_HOLD]: 'On Hold',
  [TicketStatus.RESOLVED]: 'Resolved',
  [TicketStatus.CLOSED]: 'Closed',
  [TicketStatus.REOPENED]: 'Reopened',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.P1]: 'P1 — Critical',
  [Priority.P2]: 'P2 — High',
  [Priority.P3]: 'P3 — Medium',
  [Priority.P4]: 'P4 — Low',
};

export interface SLAResponse {
  id: number;
  name: string;
  response_time_hrs: number;
  resolution_time_hrs: number;
}

export interface IssueResponse {
  id: number;
  name: string;
  category?: string;
}

export interface TicketResponse {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  customer_id: number;
  customer_tier: string;
  issue_id: number | null;
  issue: IssueResponse | null;
  customer_priority: string;
  priority: string;
  priority_overridden: boolean;
  priority_override_justification: string | null;
  severity: string;
  status: TicketStatus;
  source: string;
  team_id: number | null;
  assigned_agent_id: number | null;
  sla_id: number | null;
  sla: SLAResponse | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  is_escalated: boolean;
  escalated_at: string | null;
  attachments: unknown[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketPayload {
  issue_id: number;
  title: string;
  description: string;
  priority: string;
  attachments?: File[];
}
