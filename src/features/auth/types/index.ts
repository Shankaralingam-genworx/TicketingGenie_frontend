import type { UserRole } from '../../../types';

export interface LoginRequest {
  email: string;
  password: string;
}

// Re-exported here so authService can import from a single place
export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}