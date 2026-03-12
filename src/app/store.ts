import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { loggerMiddleware } from './middleware';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
  devTools: import.meta.env.DEV,
});

export type AppDispatch = typeof store.dispatch;
export default store;
