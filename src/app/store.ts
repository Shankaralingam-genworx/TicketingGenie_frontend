import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { loggerMiddleware, authMiddleware } from './middleware';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware, authMiddleware),
  devTools: import.meta.env.DEV,
});

export type AppDispatch = typeof store.dispatch;
export default store;
