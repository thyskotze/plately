# Plately

A mobile-first, offline-first meal-planning PWA. Build a personal food library, set a
daily goal, log meals into fixed slots, plan the week, and get an auto-generated
shopping list. Gamified (streak / XP / levels) with weight tracking. **No account, no
server** — all data lives on the device and it ships as a static site on GitHub Pages.

This is the shippable implementation of the design handoff in
`../design_handoff_plately/` (that folder is the source-of-truth spec + the original
non-runnable design-tool prototype).

## Stack
- **React + Vite + TypeScript** (static bundle)
- **Zustand** with the `persist` middleware → `localStorage` (key `plately-v1`)
- **vite-plugin-pwa** — web manifest + service worker (installable, offline)

## Run locally
```bash
npm install
npm run dev
```
Then open the printed URL. The app renders inside a phone frame on desktop and goes
full-bleed on narrow screens.

```bash
npm run build     # type-check + production build to dist/
npm run preview   # serve the built bundle
```

## Deploy to GitHub Pages (share a public URL)
1. Create a public repo named **`plately`** and push this folder to `main`.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys on every
   push to `main`.
4. Your shareable URL is `https://<username>.github.io/plately/`. Anyone who opens it
   gets their own private, on-device copy. No login, no cost.

> If you name the repo something other than `plately`, change `REPO_BASE` in
> `vite.config.ts` to `'/<your-repo>/'`. For a user/org root page or a custom domain,
> set it to `'/'`.

## What's implemented (v1)
- **Home** — calorie ring + macro mini-rings, today's meals, fast logging, and
  **per-meal check-off**: tap a meal's circle to mark it eaten. The ring's solid arc
  counts only eaten meals; a faint arc shows everything planned for the day, and the
  centre reads `X eaten · Y planned`.
- **Planner** — week strip, per-day meal planning.
- **Editing** — tap any logged meal line-item to change its portion or remove it
  (Grams sheet), and tap any Library food to edit or delete it (New Food sheet). Deleting
  a food also purges its logged portions so nothing dangles.
- **Achievement sharing** — when today's eaten total reaches ≥80% of goal, Home shows a
  tiered card (≥80% "Almost there", 100% "Goal smashed") with a **Share** button. Stats
  has a **Share week** button and a badges strip (Perfect day / 7-day streak / Perfect
  week / Level). Sharing draws a branded PNG on-canvas and hands it to the phone's native
  share sheet (Web Share API) with the app link; on desktop/unsupported it falls back to
  downloading the image. All client-side — no backend, no upload. See `src/lib/share.ts`.
- **Shopping** — one aggregated, checkable list grouped by aisle.
- **Stats** — weight sparkline + logging, streak & level tiles, recent entries.
- **Library** — a **Foods** tab (personal food DB with search; add via New Food or **Bulk
  import with AI**) and a **Meals** tab of saved recipes. Ships with 18 recipes from the
  *Coached by Vicks — BTC 2026* menu (per-serving macros, ingredients, method) plus ~50
  extra reference foods from the plan's portion tables (`src/seedMeals.ts`,
  `src/seedFoodsExtra.ts`).
- **Saved meals** — a `Meal` (per-serving macros) can be added to any day/slot in one tap
  from the picker's Meals tab or a recipe's detail sheet; logged as a `MealPortion`
  (`{ mealId, servings }`) alongside food portions. Servings are editable, and the recipe
  ingredients flow into the Shopping list under "From your meals".
- **Overlays** — food picker, grams/portion, new food, AI import (2-step), goals (TDEE),
  profile, info, toast.
- **v1 requirements** — localStorage persistence, **Export / Import backup** JSON,
  PWA install + `navigator.storage.persist()`, and a first-run intro (re-openable from
  Profile → How to use).

## Two intentional changes vs. the prototype
1. **Sex input in the TDEE calculator.** The prototype hard-coded male (`+5` in
   Mifflin–St Jeor). As the handoff README requested for production, the Goals sheet now
   has a Male/Female selector and female uses `−161`. See `suggestKcal()` in
   `src/lib/calc.ts`.
2. **Profile sheet.** The chosen design never drew a Profile screen, but the handoff
   lists Export/Import and "How to use" as mandatory v1 items under "Profile." Tapping the
   Home avatar now opens a Profile sheet holding **Goals, Export backup, Import backup,
   and How to use**. (Goals is therefore one tap deeper than in the prototype.)

## Backup format
Export writes `plately-backup-YYYY-MM-DD.json` — the exact persisted state slice
(`PersistState` in `src/store.ts`). Import offers **Merge** (add to what's here, foods
de-duped by `id`) or **Replace** (overwrite). This is the only way to move data between
devices/browsers, per the no-server constraint.

## Not yet built (deferred, per the handoff's build order)
- Meal library (save/reuse meals) + share-by-link import/export
- Live Open Food Facts (barcode) & USDA FoodData Central lookups — currently the
  Scan/USDA chips open an explanatory info modal
- Optional Supabase-backed community "Discover" page

The data model already carries stable food `id`s so those can be added without reshaping
state.

## Project layout
```
src/
  main.tsx            entry (+ storage.persist request)
  App.tsx             phone frame, screen switch, overlay mount
  store.ts            Zustand store + persist + all actions + backup
  seed.ts             24 starter foods, 7-day plan, weight history, AI prompt
  types.ts            shared types (Food, Portion, Goals, GoalsDraft…)
  tokens.ts           design tokens (colors, macros, category colors)
  icons.tsx           inline SVG line icons
  lib/calc.ts         TDEE, metrics, aggregation, sparkline, AI parser
  components/
    TabBar.tsx  Intro.tsx  Sheet.tsx
    screens/    Home Planner Shopping Stats Library
    overlays/   PickSheet GramsSheet NewFoodSheet AiImportSheet
                GoalsSheet ProfileSheet InfoModal Toast
```
