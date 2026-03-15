import type { UserRole } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
  };
}
