export { default as ticketsReducer } from './slices/ticketSlice';
export {
  loadMyTickets,
  loadTicketById,
  submitTicket,
  clearSelected,
  clearError,
} from './slices/ticketSlice';
export { ticketService } from './services/ticketService';
export { useMyTickets, useTicketDetail } from './hooks/useTickets';
export type { TicketResponse, CreateTicketPayload } from './types/ticket.types';
