import { ticketApi } from '@/lib/fetchClient';
import type { TicketResponse, CreateTicketPayload } from '../types/ticket.types';

export const ticketService = {
  getMyTickets: (): Promise<TicketResponse[]> =>
    ticketApi.get<TicketResponse[]>('/tickets/me'),

  getById: (id: number): Promise<TicketResponse> =>
    ticketApi.get<TicketResponse>(`/tickets/${id}`),

  create: (payload: CreateTicketPayload): Promise<TicketResponse> => {
    const form = new FormData();
    form.append('issue_id',    String(payload.issue_id));
    form.append('title',       payload.title);
    form.append('description', payload.description);
    form.append('priority',    payload.priority);
    payload.attachments?.forEach((f) => form.append('attachments', f));
    return ticketApi.post<TicketResponse>('/tickets/', undefined, { formData: form });
  },
};
