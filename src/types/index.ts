export type UserRole =
  | 'customer'
  | 'support_agent'
  | 'team_lead'
  | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  customer_tier?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export interface AuthState {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isBootstrapping: boolean;
  error:           string | null;
}

export interface ApiError {
  message: string;
  status: number;
  detail?: string;
}
