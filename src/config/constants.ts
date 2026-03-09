export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ssZ',
  SHORT: 'MM/DD/YYYY',
} as const;

export const TICKET_STATUS = {
  NEW: 'New',
  ACKNOWLEDGED: 'Acknowledged',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
} as const;

export const TICKET_PRIORITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPPORT_AGENT: 'support_agent',
  TEAM_LEAD: 'team_lead',
  CUSTOMER: 'customer',
} as const;

export const API_ROUTES = {
  AUTH: { LOGIN: '/auth/login' },
  TICKETS: {
    BASE: '/api/tickets',
    BY_ID: (id: string) => `/tickets/${id}`,
    STATUS: (id: string) => `/tickets/${id}/status`,
    ASSIGN: (id: string) => `/tickets/${id}/assign`,
    COMMENTS: (id: string) => `/tickets/${id}/comments`,
    SLA_BREACHED: '/tickets/sla-breached',
  },
  ADMIN: {
    SLA: '/admin/sla',
    DASHBOARD: '/admin/dashboard',
  },
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'tg_access_token',
  USER: 'tg_user',
} as const;
