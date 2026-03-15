import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { loggerMiddleware } from './middleware';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
  devTools: import.meta.env.DEV,
});

// Expose store globally so fetchClient can read the token without circular imports
(window as any).__tg_store__ = store;

export type AppDispatch = typeof store.dispatch;
export default store;
