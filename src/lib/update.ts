// App-update helpers: detect when a newer build is live, and force the current
// device onto it. All client-side — no backend. See vite.config.ts for how
// BUILD_ID is baked in and written to version.json.

/** The build this running bundle was compiled from. */
export const BUILD_ID: string = __BUILD_ID__

/** App version from package.json (bumped on notable releases). Shown in Profile. */
export const APP_VERSION: string = __APP_VERSION__

/** "Jul 28, 2026" — a human-readable stamp of BUILD_ID for display. */
export function buildDateLabel(): string {
  const d = new Date(BUILD_ID)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Fetch the buildId of whatever is currently deployed. Returns null if it can't
 * be reached (offline, or dev where version.json isn't emitted) so callers
 * never show a false "update available".
 */
export async function fetchDeployedBuildId(): Promise<string | null> {
  try {
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data?.buildId === 'string' ? data.buildId : null
  } catch {
    return null
  }
}

/** True when the deployed build differs from the one we're running. */
export async function isUpdateAvailable(): Promise<boolean> {
  const deployed = await fetchDeployedBuildId()
  return !!deployed && deployed !== BUILD_ID
}

/**
 * Force-fetch the latest deployed version. Unregisters the service worker and
 * clears its caches, then reloads — this keeps localStorage, so no user data is
 * lost. Needed for the installed (home-screen) PWA where pull-to-refresh isn't
 * available and the service worker can otherwise serve a stale bundle.
 */
export async function forceUpdate(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if (window.caches) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    /* best effort */
  }
  window.location.reload()
}
