import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "../../../types";
import { authService } from "../services/authService";
import type { LoginRequest } from "../types";

/* ───────────────────────────────────────────────────────────
   BOOTSTRAP AUTH (refresh session on page reload)
─────────────────────────────────────────────────────────── */

export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrap",
  async (_, { rejectWithValue }) => {
    try {
      const authBase = import.meta.env.VITE_API_AUTH_URL ?? "";

      const res = await fetch(`${authBase}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      

      // If user is not logged in, just return null
      if (res.status === 401) {
        return rejectWithValue(null);
      }

      if (!res.ok) {
        return rejectWithValue("Refresh failed");
      }

      const data = await res.json();

      return {
        access_token: data.access_token,
        user: data.user,
      };
    } catch {
      return rejectWithValue(null);
    }
  }
);

/* ───────────────────────────────────────────────────────────
   LOGIN
─────────────────────────────────────────────────────────── */

export const loginThunk = createAsyncThunk<
  { access_token: string; user: User },
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.detail ?? "Invalid credentials. Please try again."
    );
  }
});

/* ───────────────────────────────────────────────────────────
   LOGOUT
─────────────────────────────────────────────────────────── */

export const logoutThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    const authBase = import.meta.env.VITE_API_AUTH_URL ?? "";

    await fetch(`${authBase}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    return rejectWithValue("Logout failed");
  }
});

/* ───────────────────────────────────────────────────────────
   INITIAL STATE
─────────────────────────────────────────────────────────── */

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,
  error: null,
};

/* ───────────────────────────────────────────────────────────
   SLICE
─────────────────────────────────────────────────────────── */

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
    },

    setAuth(
      state,
      action: PayloadAction<{ access_token: string; user: User }>
    ) {
      state.token = action.payload.access_token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },

    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ───── Bootstrap ───── */

      .addCase(bootstrapAuth.pending, (state) => {
        state.isBootstrapping = true;
      })

      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        console.log("BOOTSTRAP SUCCESS", action.payload);

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

      /* ───── Login ───── */

      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

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

      /* ───── Logout ───── */

      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })

      .addCase(logoutThunk.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { logout, setAuth, clearError } = authSlice.actions;

export default authSlice.reducer;