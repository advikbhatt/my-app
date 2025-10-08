// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_FUNCTION_URL: string;
  // Add other VITE_ env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
