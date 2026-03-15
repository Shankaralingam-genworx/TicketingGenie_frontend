import env from './env';

export const STORAGE_KEYS = {
  TOKEN: 'tg_access_token',
  USER:  'tg_user',
} as const;

export const DATE_FORMATS = {
  DISPLAY:      'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  ISO:          'YYYY-MM-DDTHH:mm:ssZ',
  SHORT:        'MM/DD/YYYY',
} as const;

export const TICKET_STATUS = {
  NEW:          'New',
  ACKNOWLEDGED: 'Acknowledged',
  OPEN:         'Open',
  IN_PROGRESS:  'In Progress',
  ON_HOLD:      'On Hold',
  RESOLVED:     'Resolved',
  CLOSED:       'Closed',
  REOPENED:     'Reopened',
} as const;

export const TICKET_PRIORITY = {
  CRITICAL: 'Critical',
  HIGH:     'High',
  MEDIUM:   'Medium',
  LOW:      'Low',
} as const;

export const USER_ROLES = {
  ADMIN:         'admin',
  SUPPORT_AGENT: 'support_agent',
  TEAM_LEAD:     'team_lead',
  CUSTOMER:      'customer',
} as const;

export const MAX_RETRY_COUNT = 3;

export const API_ROUTES = {
  AUTH: {
    LOGIN:           `${env.API_AUTH_URL}/auth/login`,
    LOGOUT:          `${env.API_AUTH_URL}/auth/logout`,
    REFRESH:         `${env.API_AUTH_URL}/auth/refresh`,
    ME:              `${env.API_AUTH_URL}/auth/me`,
    REGISTER:        `${env.API_AUTH_URL}/auth/register`,
    CHANGE_PASSWORD: `${env.API_AUTH_URL}/auth/change-password`,
    FORGOT_PASSWORD: `${env.API_AUTH_URL}/auth/forgot-password`,
    RESET_PASSWORD:  `${env.API_AUTH_URL}/auth/reset-password`,
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
  NOTIFICATIONS: {
    LIST:   `${env.API_TICKET_URL}/notifications`,
    STREAM: `${env.API_TICKET_URL}/notifications/stream`,
  },
} as const;
