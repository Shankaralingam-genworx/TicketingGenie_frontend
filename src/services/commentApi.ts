import { apiGet, apiPostForm, apiPost } from './fetchClient';

const BASE = import.meta.env.VITE_API_TICKET_URL ?? '';

export interface CommentAttachment {
  filename: string;
  url?:     string;
}

export interface CommentResponse {
  id:          number;
  ticket_id:   number;
  author_id:   number;
  author_role: string;
  content:     string;
  source:      string;
  created_at:  string;
  attachments?: CommentAttachment[];
}

export interface CommentCreateRequest {
  content:      string;
  source?:      string;
  attachments?: File[];
}

export async function fetchComments(ticketId: number): Promise<CommentResponse[]> {
  return apiGet<CommentResponse[]>(`${BASE}/tickets/${ticketId}/comments`);
}

export async function postComment(
  ticketId: number,
  data: CommentCreateRequest,
): Promise<CommentResponse> {
  // If there are file attachments, send as multipart/form-data
  if (data.attachments && data.attachments.length > 0) {
    const form = new FormData();
    form.append('content', data.content);
    if (data.source) form.append('source', data.source);
    data.attachments.forEach((file) => form.append('attachments', file));
    return apiPostForm<CommentResponse>(`${BASE}/tickets/${ticketId}/comments`, form);
  }

  // No attachments — plain JSON post
  return apiPost<CommentResponse>(`${BASE}/tickets/${ticketId}/comments`, {
    content: data.content,
    source:  data.source,
  });
}