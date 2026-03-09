// ─── Role enum — must match backend RoleName exactly ─────────────────────────
export type UserRole =
  | 'customer'
  | 'support_agent'
  | 'team_lead'
  | 'admin';

// ─── User from login response ─────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// ─── Login API response ───────────────────────────────────────────────────────
export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

// ─── Redux auth state ─────────────────────────────────────────────────────────
export interface AuthState {
  user:             User | null;
  token:            string | null;
  isAuthenticated:  boolean;
  isLoading:        boolean;
  isBootstrapping:  boolean;  // ← new
  error:            string | null;
}

// ─── API error shape ──────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}