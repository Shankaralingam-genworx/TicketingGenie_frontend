import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "@/types";
import { authService } from "../services/authService";
import type { LoginRequest } from "../types";
import { authApi } from "@/lib/fetchClient";
import { STORAGE_KEYS } from "@/config/constants";

/* ── Bootstrap auth (refresh session on page reload) ──────────── */

export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrap",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.post<{ access_token: string; user: User }>(
        "/auth/refresh",
        undefined,
        { token: null } // no bearer token for refresh (uses httpOnly cookie)
      );
      if (data.access_token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
      }
      return { access_token: data.access_token, user: data.user };
    } catch {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      return rejectWithValue(null);
    }
  }
);

/* ── Login ──────────────────────────────────────────────────────── */

export const loginThunk = createAsyncThunk<
  { access_token: string; user: User },
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const result = await authService.login(credentials);
    localStorage.setItem(STORAGE_KEYS.TOKEN, result.access_token);
    return result;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? "Invalid credentials. Please try again.");
  }
});

/* ── Logout ─────────────────────────────────────────────────────── */

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.post("/auth/logout");
    } catch {
      return rejectWithValue("Logout failed");
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }
);

/* ── Initial state ──────────────────────────────────────────────── */

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,
  error: null,
};

/* ── Slice ──────────────────────────────────────────────────────── */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    },
    setAuth(state, action: PayloadAction<{ access_token: string; user: User }>) {
      state.token = action.payload.access_token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem(STORAGE_KEYS.TOKEN, action.payload.access_token);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Bootstrap
      .addCase(bootstrapAuth.pending, (state) => { state.isBootstrapping = true; })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isBootstrapping = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.isBootstrapping = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Login
      .addCase(loginThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Login failed";
      })
      // Logout
      .addCase(logoutThunk.pending, (state) => { state.isLoading = true; })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => { state.isLoading = false; });
  },
});

export const { logout, setAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
