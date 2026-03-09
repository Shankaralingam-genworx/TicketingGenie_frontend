const env = {
  API_BASE_URL: import.meta.env.VITE_API_AUTH_URL ?? 'http://127.0.0.1:8001/api/v1/',  // update it for docker.
  // API_TICKET_URL : import.meta.env.VITE_API_TICKET_URL ?? 'http://127.0.0.1:8002/api/v1/',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Ticketing Genie',
  ENV: import.meta.env.MODE ?? 'development',
} as const;

export type Env = typeof env;
export default env;
