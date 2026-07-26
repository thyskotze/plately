import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from https://<user>.github.io/<repo>/
// Set base to the repo name so asset URLs resolve. Change 'plately' if you
// name the repo differently. For a custom domain or user/org root page, use '/'.
const REPO_BASE = '/plately/'

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    react(),
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
