import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

// The version shown in Profile ("Plately v2.0.0"). Bump this in package.json
// on notable releases.
const APP_VERSION = pkg.version

// GitHub Pages serves the app from https://<user>.github.io/<repo>/.
// In GitHub Actions, GITHUB_REPOSITORY is "owner/repo"; derive the base path and
// storage key from the repo name so the SAME code deploys correctly to either:
//   - live repo `plately`         -> base /plately/,         key plately-v1
//   - a staging repo `plately-*`  -> base /plately-*/,       key plately-*  (isolated)
// Locally (no env) it falls back to the live values. For a custom domain / root
// page, hardcode REPO_BASE to '/'.
const ENV =
  (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env ?? {}
const REPO = (ENV.GITHUB_REPOSITORY ?? '').split('/')[1] || ''
const REPO_BASE = REPO ? `/${REPO}/` : '/plately/'
// Live keeps the original key so existing users' data is preserved; any other
// repo (staging) gets its own key so testing can never touch real user data —
// even though it shares the github.io origin.
const STORAGE_KEY = !REPO || REPO === 'plately' ? 'plately-v1' : REPO

// A unique id per production build. Baked into the bundle as `__BUILD_ID__` and
// written to `version.json`; the running app compares the two to detect that a
// newer build is live (see src/lib/update.ts). Changes on every `npm run build`.
const BUILD_ID = new Date().toISOString()

// Emit a tiny, un-precached version.json next to index.html so a stale client
// can fetch it fresh (no-store) and notice a new build without downloading the
// whole bundle. JSON is excluded from the workbox globs, so it's never cached.
const emitVersion = {
  name: 'plately-emit-version',
  generateBundle() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this as any).emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId: BUILD_ID }),
    })
  },
}

export default defineConfig({
  base: REPO_BASE,
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
    __STORAGE_KEY__: JSON.stringify(STORAGE_KEY),
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    emitVersion,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Plately — meal planning',
        short_name: 'Plately',
        description: 'Plan meals, hit your goals, and shop smarter — all on your phone.',
        theme_color: '#2E9E5B',
        background_color: '#FBF9F3',
        display: 'standalone',
        orientation: 'portrait',
        scope: REPO_BASE,
        start_url: REPO_BASE,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
      },
    }),
  ],
})
