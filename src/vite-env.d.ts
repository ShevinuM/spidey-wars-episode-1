/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEST_HOOKS?: string;
}

interface Window {
  __READY__?: boolean;
}
