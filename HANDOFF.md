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
- **Meal slots are dynamic:** `mealSlots: {key,label}[]` (defaults breakfast/lunch/dinner/snacks). Days & `eaten` are keyed by slot `key`. Iterate `store.mealSlots` in UI; iterate day keys in calc. Never hardcode the 4 slots.
- **Goals = calories + protein**; carbs & fat are auto-derived (`deriveMacros`, fat ≈30% of kcal). `bio` stores weight/height/age/sex/activity/goalDir and prefills the Goals sheet.
- **Home is fixed to `TODAY = 1`** (the "Tuesday" index of a Mon–Sun template week). The header shows the *real* date but the week model is a fixed template — a real calendar/date system is a known v2 candidate.
- All number inputs accept comma decimals via `toNum` ("100,8" → 100.8). Keep using it for any new numeric field.

## External integrations (all CORS-open, called live from the browser)
- **CNF** (Canadian Nutrient File): keyless live API, per-100g. **Do NOT host a copy** — Health Canada terms require permission to redistribute; live API reuse is fine. Attribution shown in the sheet.
- **USDA FoodData Central:** `src/lib/usda.ts` uses `USDA_KEY = 'DEMO_KEY'` (rate-limited ~10/hr). **v2 TODO:** get a free key at fdc.nal.usda.gov/api-key-signup and paste it in.
- **Open Food Facts:** keyless barcode lookup. Barcode scanning uses `@zxing/browser` on the camera + manual entry fallback. Camera needs HTTPS (Pages ✓) + permission; can't be tested in a headless preview.

## Constraints & gotchas
- **No backend / static only.** Anything needing a server (usage analytics, a live shared leaderboard, hosting CNF) is out unless the user opts into a service (e.g. Supabase, Cloudflare). Live third-party APIs are fine.
- **Coach Vicky's recipes** are bundled with permission (she OK'd it). Keep the "by Coached by Vicks" byline.
- **PWA updates are sticky** on installed apps — that's why there's a **Profile → Check for updates** (clears SW cache + reloads, keeps data). When testing, unregister SW + clear caches, but never clear localStorage unless intentionally resetting.
- **iCloud path:** the project lives in an iCloud-synced folder; `node_modules` is gitignored. Builds work fine locally.
- Verify in-browser with the preview tools; to reach a specific app state fast, inject `localStorage['plately-v1'] = JSON.stringify({state:{…}, version:0})` then reload (missing keys fall back to defaults).

## Ideas parked for v2 (not yet built)
- Real calendar/dates (today = actual day; history beyond the template week).
- Meal-library **share-by-link** (serialize a meal to a URL/JSON to send to a friend) — data model already carries stable ids.
- Optional Supabase-backed **community "Discover"** meals + a real leaderboard (needs the no-backend decision revisited).
- USDA real API key; Open Food Facts write-back; per-food category mapping for CNF/USDA/OFF imports (currently 'Other').
- Privacy-friendly usage analytics (Cloudflare Web Analytics) if the owner wants install/activation counts.

## How to start the v2 chat
Open a new chat **in this folder** and say something like:
> "Read HANDOFF.md and README.md. We're iterating Plately for v2. First up: <thing>."
The working dir + these docs give the new session everything it needs.
