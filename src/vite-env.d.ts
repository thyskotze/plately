/// <reference types="vite/client" />

/** Build stamp injected by vite.config.ts (see the emit-version plugin). */
declare const __BUILD_ID__: string

/** localStorage key, injected by vite.config.ts (live: plately-v1; staging: isolated). */
declare const __STORAGE_KEY__: string

/** App version from package.json, injected by vite.config.ts. Shown in Profile. */
declare const __APP_VERSION__: string
