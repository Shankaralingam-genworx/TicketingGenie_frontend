import { combineReducers } from '@reduxjs/toolkit';
import { authReducer }    from '@/features/auth';
import { ticketsReducer } from '@/features/tickets';

const rootReducer = combineReducers({
  auth:    authReducer,
  tickets: ticketsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
