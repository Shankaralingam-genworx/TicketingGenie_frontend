const env = {
  API_AUTH_URL:   import.meta.env.VITE_API_AUTH_URL   ?? 'http://localhost:8001/api/v1',
  API_TICKET_URL: import.meta.env.VITE_API_TICKET_URL ?? 'http://localhost:8002/api/v1',
  APP_NAME:       import.meta.env.VITE_APP_NAME       ?? 'Ticketing Genie',
  ENV:            import.meta.env.MODE                 ?? 'development',
} as const;

export type Env = typeof env;
export default env;
