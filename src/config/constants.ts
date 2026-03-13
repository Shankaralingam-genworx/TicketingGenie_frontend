/**
 * src/config/constants.ts
 *
 * env.API_AUTH_URL   already includes /api/v1  (e.g. /api/auth/api/v1)
 * env.API_TICKET_URL already includes /api/v1  (e.g. /api/tickets/api/v1)
 *
 * So routes are just: `${env.API_AUTH_URL}/auth/login`  ✓
 */

export const DATE_FORMATS = {
  DISPLAY:      "MMM DD, YYYY",
  DISPLAY_TIME: "MMM DD, YYYY HH:mm",
  ISO:          "YYYY-MM-DDTHH:mm:ssZ",
  SHORT:        "MM/DD/YYYY",
} as const;

export const TICKET_STATUS = {
  NEW:          "New",
  ACKNOWLEDGED: "Acknowledged",
  OPEN:         "Open",
  IN_PROGRESS:  "In Progress",
  ON_HOLD:      "On Hold",
  RESOLVED:     "Resolved",
  CLOSED:       "Closed",
  REOPENED:     "Reopened",
} as const;

export const TICKET_PRIORITY = {
  CRITICAL: "Critical",
  HIGH:     "High",
  MEDIUM:   "Medium",
  LOW:      "Low",
} as const;

export const USER_ROLES = {
  ADMIN:         "admin",
  SUPPORT_AGENT: "support_agent",
  TEAM_LEAD:     "team_lead",
  CUSTOMER:      "customer",
} as const;

import env from "./env";

export const API_ROUTES = {

  AUTH: {
    LOGIN:   `${env.API_AUTH_URL}/auth/login`,
    LOGOUT:  `${env.API_AUTH_URL}/auth/logout`,
    REFRESH: `${env.API_AUTH_URL}/auth/refresh`,
    ME:      `${env.API_AUTH_URL}/auth/me`,
  },

  TICKETS: {
    LIST:   `${env.API_TICKET_URL}/tickets`,
    MY:     `${env.API_TICKET_URL}/tickets/me`,
    CREATE: `${env.API_TICKET_URL}/tickets`,
    BY_ID:  (id: string | number) => `${env.API_TICKET_URL}/tickets/${id}`,
  },

  ISSUES: {
    LIST: `${env.API_TICKET_URL}/issues`,
  },

  SLA: {
    LIST: `${env.API_TICKET_URL}/sla`,
  },

  NOTIFICATIONS: {
    LIST:   `${env.API_TICKET_URL}/notifications`,
    STREAM: `${env.API_TICKET_URL}/notifications/stream`,
  },

} as const;

export const STORAGE_KEYS = {
  TOKEN: "tg_access_token",
  USER:  "tg_user",
} as const;