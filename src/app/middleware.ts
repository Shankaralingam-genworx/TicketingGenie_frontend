import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from './rootReducer';

export const loggerMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    if (import.meta.env.DEV) {
      const type =
        typeof action === 'object' && action && 'type' in action
          ? (action as any).type
          : 'unknown';
      console.group(`[Action] ${type}`);
      console.log('Prev:', store.getState());
      const result = next(action);
      console.log('Next:', store.getState());
      console.groupEnd();
      return result;
    }
    return next(action);
  };
