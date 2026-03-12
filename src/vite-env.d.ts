/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_AUTH_URL: string
  readonly VITE_API_TICKET_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}