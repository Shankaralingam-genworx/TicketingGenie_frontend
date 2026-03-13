/**
 * features/auth/services/authService.ts
 * Uses the centralized fetchClient instead of a separate axios instance.
 */

import { authApi } from '@/lib/fetchClient';
import type { LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    authApi.post<LoginResponse>('/auth/login', credentials),
};
