/**
 * src/config/env.ts
 *
 * In Docker (served via Nginx proxy):
 *   VITE_API_AUTH_URL   = /api/auth/api/v1   → proxied to http://auth-service:8001/api/v1
 *   VITE_API_TICKET_URL = /api/tickets/api/v1 → proxied to http://ticket-service:8002/api/v1
 *
 * In local dev (direct to services):
 *   VITE_API_AUTH_URL   = http://localhost:8001/api/v1
 *   VITE_API_TICKET_URL = http://localhost:8002/api/v1
 *
 * All API files just do: `${env.API_AUTH_URL}/auth/login` — no extra /api/v1 needed.
 */


const env = {
  API_AUTH_URL:   import.meta.env.VITE_API_AUTH_URL   ?? "http://localhost:8001/api/v1",
  API_TICKET_URL: import.meta.env.VITE_API_TICKET_URL ?? "http://localhost:8002/api/v1",
  APP_NAME:       import.meta.env.VITE_APP_NAME       ?? "Ticketing Genie",
  ENV:            import.meta.env.MODE                 ?? "development",
} as const;

export type Env = typeof env;
export default env;