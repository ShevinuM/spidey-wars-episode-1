/// <reference types="vite/client" />

declare const __TEST__: boolean;

interface Window {
  __READY__?: boolean;
  __TEST__?: import("./test-hooks.ts").TestHooks;
}
