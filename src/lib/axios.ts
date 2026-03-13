/**
 * lib/axios.ts
 * @deprecated This file is kept only for backward compatibility.
 * Use `authApi` or `ticketApi` from `@/lib/fetchClient` directly.
 *
 * The old axiosInstance.post('/auth/login', ...) is now:
 *   authApi.post('/auth/login', ...)
 */

export { authApi as default } from './fetchClient';
