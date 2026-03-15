import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '@/types';
import { authService } from '../services/authService';
import type { LoginRequest } from '../types';
import { authApi } from '@/lib/fetchClient';

/* ── Bootstrap auth (refresh session on page reload) ────────────── */

export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.post<{ access_token: string; user: User }>(
        '/auth/refresh',
        undefined,
        { token: null }, // no bearer token — uses httpOnly cookie
      );
      return { access_token: data.access_token, user: data.user };
    } catch {
      return rejectWithValue(null);
    }
  },
);

/* ── Login ──────────────────────────────────────────────────────── */

export const loginThunk = createAsyncThunk<
  { access_token: string; user: User },
  LoginRequest,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Invalid credentials. Please try again.');
  }
});

/* ── Logout ─────────────────────────────────────────────────────── */

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch {
      return rejectWithValue('Logout failed');
    }
  },
);

/* ── Slice ──────────────────────────────────────────────────────── */

const initialState: AuthState = {
  user:            null,
  token:           null,
  isAuthenticated: false,
  isLoading:       false,
  isBootstrapping: true,
  error:           null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user           = null;
      state.token          = null;
      state.isAuthenticated = false;
      state.error          = null;
      state.isLoading      = false;
    },
    /** Called by fetchClient after a successful token refresh */
    setAuth(state, action: PayloadAction<{ access_token: string; user: User }>) {
      state.token          = action.payload.access_token;
      state.user           = action.payload.user;
      state.isAuthenticated = true;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Bootstrap
      .addCase(bootstrapAuth.pending,   (s) => { s.isBootstrapping = true; })
      .addCase(bootstrapAuth.fulfilled, (s, a) => {
        s.isBootstrapping = false;
        s.isAuthenticated = true;
        s.token           = a.payload.access_token;
        s.user            = a.payload.user;
      })
      .addCase(bootstrapAuth.rejected,  (s) => {
        s.isBootstrapping = false;
        s.isAuthenticated = false;
        s.user            = null;
        s.token           = null;
      })
      // Login
      .addCase(loginThunk.pending,   (s) => { s.isLoading = true; s.error = null; })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.isLoading       = false;
        s.isAuthenticated = true;
        s.token           = a.payload.access_token;
        s.user            = a.payload.user;
      })
      .addCase(loginThunk.rejected,  (s, a) => {
        s.isLoading = false;
        s.error     = a.payload ?? 'Login failed';
      })
      // Logout
      .addCase(logoutThunk.pending,   (s) => { s.isLoading = true; })
      .addCase(logoutThunk.fulfilled, (s) => {
        s.user           = null;
        s.token          = null;
        s.isAuthenticated = false;
        s.isLoading      = false;
        s.error          = null;
      })
      .addCase(logoutThunk.rejected,  (s) => { s.isLoading = false; });
  },
});

export const { logout, setAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
