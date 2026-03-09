import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from './rootReducer';

export const loggerMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    if (import.meta.env.DEV) {
      console.group(`[Action] ${(action as any).type}`);
      console.log("User:", action.payload?.user);
      console.log('Prev:', store.getState());
      const result = next(action);
      console.log('Next:', store.getState());
      console.groupEnd();
      return result;
    }
    return next(action);
  };

export const authMiddleware: Middleware<{}, RootState> =
  (_store) => (next) => (action) => next(action);
