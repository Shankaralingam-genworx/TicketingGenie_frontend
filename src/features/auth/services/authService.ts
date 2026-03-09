import axiosInstance from '../../../lib/axios';
import { API_ROUTES } from '../../../config/constants';
import type { LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<LoginResponse>(
      API_ROUTES.AUTH.LOGIN,
      credentials
    );
    return data;
  },
};
