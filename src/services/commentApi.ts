import { apiGet, apiPost } from './fetchClient';

const BASE = import.meta.env.VITE_API_TICKET_URL ?? '';

export interface CommentResponse {
  id:          number;
  ticket_id:   number;
  author_id:   number;
  author_role: string;
  content:     string;
  source:      string;
  created_at:  string;
}

export interface CommentCreateRequest {
  content: string;
  source?: string;
}

export async function fetchComments(ticketId: number): Promise<CommentResponse[]> {
  return apiGet<CommentResponse[]>(`${BASE}/tickets/${ticketId}/comments`);
}

export async function postComment(ticketId: number, data: CommentCreateRequest): Promise<CommentResponse> {
  return apiPost<CommentResponse>(`${BASE}/tickets/${ticketId}/comments`, data);
}
