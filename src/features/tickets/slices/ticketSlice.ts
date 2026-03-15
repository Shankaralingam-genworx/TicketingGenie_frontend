import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ticketService } from '../services/ticketService';
import type { TicketResponse, CreateTicketPayload } from '../types/ticket.types';

export const loadMyTickets = createAsyncThunk(
  'tickets/loadMine',
  async (_, { rejectWithValue }) => {
    try { return await ticketService.getMyTickets(); }
    catch (e) { return rejectWithValue((e as Error).message); }
  },
);

export const loadTicketById = createAsyncThunk(
  'tickets/loadOne',
  async (id: number, { rejectWithValue }) => {
    try { return await ticketService.getById(id); }
    catch (e) { return rejectWithValue((e as Error).message); }
  },
);

export const submitTicket = createAsyncThunk(
  'tickets/create',
  async (payload: CreateTicketPayload, { rejectWithValue }) => {
    try { return await ticketService.create(payload); }
    catch (e) { return rejectWithValue((e as Error).message); }
  },
);

interface TicketsState {
  list:          TicketResponse[];
  selected:      TicketResponse | null;
  listLoading:   boolean;
  detailLoading: boolean;
  submitLoading: boolean;
  error:         string | null;
}

const initialState: TicketsState = {
  list: [], selected: null,
  listLoading: false, detailLoading: false, submitLoading: false,
  error: null,
};

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearSelected(state) { state.selected = null; },
    clearError(state)    { state.error    = null; },
  },
  extraReducers: (b) => {
    b.addCase(loadMyTickets.pending,   (s) => { s.listLoading = true;  s.error = null; });
    b.addCase(loadMyTickets.fulfilled, (s, a) => { s.listLoading = false; s.list = a.payload; });
    b.addCase(loadMyTickets.rejected,  (s, a) => { s.listLoading = false; s.error = a.payload as string; });

    b.addCase(loadTicketById.pending,   (s) => { s.detailLoading = true;  s.error = null; });
    b.addCase(loadTicketById.fulfilled, (s, a) => { s.detailLoading = false; s.selected = a.payload; });
    b.addCase(loadTicketById.rejected,  (s, a) => { s.detailLoading = false; s.error = a.payload as string; });

    b.addCase(submitTicket.pending,   (s) => { s.submitLoading = true;  s.error = null; });
    b.addCase(submitTicket.fulfilled, (s, a) => { s.submitLoading = false; s.list.unshift(a.payload); });
    b.addCase(submitTicket.rejected,  (s, a) => { s.submitLoading = false; s.error = a.payload as string; });
  },
});

export const { clearSelected, clearError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
