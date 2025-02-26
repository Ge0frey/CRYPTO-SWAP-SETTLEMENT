/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIUS_API_KEY: string
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
