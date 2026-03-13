import env from "@/config/env";

// env.API_TICKET_URL and env.API_AUTH_URL already include /api/v1
export const TICKET_API = env.API_TICKET_URL;
export const AUTH_API   = env.API_AUTH_URL;

export const SEVERITIES     = ["critical", "high", "medium", "low"] as const;
export const CUSTOMER_TIERS = ["smb", "enterprise"] as const;

export enum IssueCategory {
  LOGINPROBLEM       = "login_problem",
  ACCESSISSUE        = "access_issue",
  BUGORERROR         = "bug_or_error",
  PERFORMANCEISSUE   = "performance_issue",
  FEATUREREQUEST     = "feature_request",
  BILLINGISSUE       = "billing_issue",
  ACCOUNTMANAGEMENT  = "account_management",
  DATAISSUE          = "data_issue",
  INTEGRATIONISSUE   = "integration_issue",
  SECURITYCONCERN    = "security_concern",
  OTHER              = "other",
}

export const NAV = [
  { label: "Overview",          id: "overview"  },
  { label: "Issue - Category",  id: "issues"    },
  { label: "SLA Config",        id: "sla"       },
  { label: "Skill Mapping",     id: "resolvers" },
  { label: "Staff",             id: "staff"     },
  { label: "Teams",             id: "teams"     },
  { label: 'Email Config', id: 'email' as const },

] as const;

export const STAFF_ROLES = ["support_agent", "team_lead"] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const ROLE_LABEL: Record<string, string> = {
  support_agent: "Support Agent",
  team_lead:     "Team Lead",
};