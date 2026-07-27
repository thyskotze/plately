# Plately — handoff for v2

Read this first, then `README.md`. The app is **built and live**; v2 is iteration, not a rewrite.

## What & where
- **What:** mobile-first, offline-first meal-planning PWA. All data on-device, no backend, no accounts.
- **Project dir:** `Plately App/plately/` (this folder). It's a **git repo**; the design spec lives in `../design_handoff_plately/`.
- **Live URL:** https://thyskotze.github.io/plately/
- **GitHub:** https://github.com/thyskotze/plately (public — required for free Pages). Authed locally as `thyskotze` via `gh`.

## Run / build / deploy
```bash
npm install
npm run dev        # local dev (opens at /plately/)
npm run build      # tsc -b && vite build  → always run before deploy
```
- **Deploy = commit + push to `main`.** GitHub Actions (`.github/workflows/deploy.yml`) builds and publishes to Pages automatically. URL never changes.
- **Staging repo:** `thyskotze/plately-staging` → https://thyskotze.github.io/plately-staging/ is a throwaway test deploy. `vite.config.ts` derives the base path **and** storage key from `GITHUB_REPOSITORY`, so the same code deployed there uses base `/plately-staging/` + an isolated key `plately-staging` (can't touch live users' `plately-v1` data, even on the same github.io origin). Live repo `plately` → `/plately/` + `plately-v1` automatically.
- **Promote staging → live:** merge the tested branch into `plately`'s `main` and push to `origin` (the live remote). Same code, live env auto-applies. Test on staging first; never push straight to `origin/main` unverified.
- After each change I run `npx tsc -b --noEmit` then `npm run build`, then push. tsconfig is strict (`noUnusedLocals`/`noUnusedParameters`) — no dead imports.
- `vite.config.ts` `REPO_BASE = '/plately/'` — must match the repo name. PWA via `vite-plugin-pwa` (autoUpdate).

## Stack & architecture
- **React 18 + Vite + TypeScript + Zustand** (`persist` → localStorage key `plately-v1`).
- **One store** (`src/store.ts`) holds a persisted `PersistState` slice + ephemeral UI state + all actions. UI reads via `useStore(s => s.x)`.
- **Overlays pattern:** a single `overlay` string in the store; each sheet component returns `null` unless its key is active; all sheets are always mounted in `App.tsx`.
- **Derived math** is all in `src/lib/calc.ts` (TDEE, macro derive, totals, sparkline, AI parser, `toNum` comma-decimal parser). Totals iterate a day's *actual* slot keys, not a fixed list.
- **Layout:** everything renders inside a phone frame; on ≤400px it goes full-bleed and hides the mock status bar (`src/index.css`).

### Key files
```
src/store.ts             state shape, persistence, every action (start here)
src/lib/calc.ts          all calculations + toNum()
src/lib/cnf.ts usda.ts off.ts   external food data clients
src/types.ts             Food, Meal, Portion (union), MealSlot, Bio, Goals…
src/seed.ts              starter foods; seedMeals.ts = coach recipes; seedFoodsExtra.ts
src/components/screens/  Home Planner Shopping Stats Library
src/components/overlays/ Pick Grams MealAmount MealDetail MealBuilder MealSlots
                         Goals Profile Share Cnf(+USDA) Barcode Info Help Toast
src/components/Onboarding.tsx  first-run setup
```

## Data model notes (important for v2)
- **`PersistState`** (in store.ts) is also the **backup JSON shape**. If you add/rename a persisted field, update: the `PersistState` interface, `initialPersist`, `partialize`, `exportBackup`, `importBackup` (merge branch). Consider bumping the `persist` `version` + adding a migration if you change shape incompatibly.
- **Portion is a union:** `{foodId,grams}` (food) OR `{mealId,servings}` (saved meal). Use `isMealPortion()`. `itemMetrics(foods, meals, portion)` handles both.
- **`Meal.items?: {foodId,grams}[]`** — structured foods a *user-built* meal came from. Set by the meal builder; enables re-editing with live macro recalc (`updateBuiltMeal`). Seed recipes (Vicky's) have no `items` and carry a `source`, so `!meal.source` = user-built = editable; those are view-only. Built meals saved before this field existed are reconstructed on edit by parsing their `"<g> g <name>"` ingredient lines back to library foods (`itemsForMeal` in `MealBuilderSheet`). Optional field → no persist migration.
- **Meal actions:** `deleteMeal(id)` (purges logged MealPortions too, like `deleteFood`), `openEditMeal(id)`/`updateBuiltMeal(id, meal)` (builder doubles as create+edit via ephemeral `editMealId`). Delete/edit live in `MealDetailSheet`. `saveSlotAsMeal(day, slot)` turns a logged day-slot's foods into a new meal: it collapses the slot's portions to food→grams (expanding item-bearing meal portions) and opens the builder pre-filled via ephemeral `builderSeed` (a create, not an edit — no `editMealId`). Non-destructive; the logged slot is untouched. The **"Save as a meal"** link on each non-empty Home slot triggers it. The builder has three open modes now: edit (`editMealId`), from-slot (`builderSeed`), or blank.
- **`exportLibrary()`** writes a shareable `plately-library-*.json` = `{plately:'library', exportedAt, foods, meals:(built only)}` — no personal data. Recipient uses **Import backup → Merge** (unchanged; merges `foods`+`meals` by id). Distinct from the parked share-*by-link* idea.
- **Meal slots are dynamic:** `mealSlots: {key,label}[]` (defaults breakfast/lunch/dinner/snacks). Days & `eaten` are keyed by slot `key`. Iterate `store.mealSlots` in UI; iterate day keys in calc. Never hardcode the 4 slots.
- **Goals = calories + protein**; carbs & fat are auto-derived (`deriveMacros`, fat ≈30% of kcal). `bio` stores weight/height/age/sex/activity/goalDir and prefills the Goals sheet.
- **Real calendar dates.** `mealsByDay` and `eaten` are keyed by **local `YYYY-MM-DD`** strings (`src/lib/dates.ts` — always local, never `toISOString()`). Home reads `todayISO()` and rolls over automatically (App re-renders on foreground). The **Calendar** (`Planner.tsx`) navigates real weeks via ephemeral `selDate` + `shiftWeek`, and both Home and Calendar render the shared `src/components/DaySlots.tsx` (future days hide the eaten check-off). **Streak is computed**, not stored (`src/lib/streak.ts`: consecutive days eaten kcal ≥ 80% of goal, up to today). Persist `version: 1` migrates old integer-keyed data → dates anchored to today (old index 1 → today); `importBackup` remaps old backups the same way. Shopping aggregates the selected week's dates.
- All number inputs accept comma decimals via `toNum` ("100,8" → 100.8). Keep using it for any new numeric field.

## External integrations (all CORS-open, called live from the browser)
- **CNF** (Canadian Nutrient File): keyless live API, per-100g. **Do NOT host a copy** — Health Canada terms require permission to redistribute; live API reuse is fine. Attribution shown in the sheet.
- **USDA FoodData Central:** `src/lib/usda.ts` uses `USDA_KEY = 'DEMO_KEY'` (rate-limited ~10/hr). **v2 TODO:** get a free key at fdc.nal.usda.gov/api-key-signup and paste it in.
- **Open Food Facts:** keyless barcode lookup. Barcode scanning uses `@zxing/browser` on the camera + manual entry fallback. Camera needs HTTPS (Pages ✓) + permission; can't be tested in a headless preview.

## Constraints & gotchas
- **No backend / static only.** Anything needing a server (usage analytics, a live shared leaderboard, hosting CNF) is out unless the user opts into a service (e.g. Supabase, Cloudflare). Live third-party APIs are fine.
- **Coach Vicky's recipes** are bundled with permission (she OK'd it). Keep the "by Coached by Vicks" byline.
- **PWA updates are sticky** on installed apps — that's why there's a **Profile → Check for updates** (clears SW cache + reloads, keeps data). When testing, unregister SW + clear caches, but never clear localStorage unless intentionally resetting.
- **Version strategy = update-in-place (decided).** There is no separate "v2" site: new releases ship to the same `/plately/` URL on the same `plately-v1` storage key, so existing users keep all data and gain features. This is only safe while changes stay backward-compatible — **do not** change the storage key or make breaking `PersistState` changes without a migration, or existing users' data will appear lost.
- **New-version detection** (`src/lib/update.ts`): every build bakes a `__BUILD_ID__` (a timestamp, set in `vite.config.ts`) and emits an un-precached `version.json` with the same id. The running app fetches `version.json` (no-store) on load + on foreground; if it differs from `__BUILD_ID__` it shows the `UpdateBanner` ("export first, then update"). **Profile → Check for updates** does the same check on demand and shows an export-first dialog when a new build exists, else toasts "up to date". `forceUpdate()` (SW unregister + cache clear + reload, keeps localStorage) is the actual updater. Because `version.json` is JSON it's outside the workbox globs, so it's never precached/stale.
- **iCloud path:** the project lives in an iCloud-synced folder; `node_modules` is gitignored. Builds work fine locally.
- Verify in-browser with the preview tools; to reach a specific app state fast, inject `localStorage['plately-v1'] = JSON.stringify({state:{…}, version:0})` then reload (missing keys fall back to defaults).

## Ideas parked for v2 (not yet built)
- ~~Real calendar/dates~~ — **done** (v2): local date keys, rollover, history, real-week Calendar, computed streak.
- Meal-library **share-by-link** (serialize a meal to a URL/JSON to send to a friend) — data model already carries stable ids.
- Optional Supabase-backed **community "Discover"** meals + a real leaderboard (needs the no-backend decision revisited).
- USDA real API key; Open Food Facts write-back; per-food category mapping for CNF/USDA/OFF imports (currently 'Other').
- Privacy-friendly usage analytics (Cloudflare Web Analytics) if the owner wants install/activation counts.

## How to start the v2 chat
Open a new chat **in this folder** and say something like:
> "Read HANDOFF.md and README.md. We're iterating Plately for v2. First up: <thing>."
The working dir + these docs give the new session everything it needs.
