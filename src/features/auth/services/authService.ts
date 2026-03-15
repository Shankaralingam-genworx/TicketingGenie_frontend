import { authApi } from '@/lib/fetchClient';
import type { LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    authApi.post<LoginResponse>('/auth/login', credentials),

  logout: (): Promise<void> =>
    authApi.post('/auth/logout'),

  changePassword: (oldPassword: string, newPassword: string): Promise<void> =>
    authApi.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  forgotPassword: (email: string): Promise<void> =>
    authApi.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string): Promise<void> =>
    authApi.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    customer_tier: string;
    preferred_contact: string;
  }): Promise<LoginResponse> =>
    authApi.post<LoginResponse>('/auth/register', data, { token: null }),
};
