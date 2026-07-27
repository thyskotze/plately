# Real calendar dates, history & rollover — design spec

**Date:** 2026-07-27
**Branch:** `v2` (ships as part of the v2 release, on top of meal edit/delete, library
sharing, update warnings, and save-as-meal)
**Status:** approved design, pending spec review → implementation plan

## Problem

The app has no concept of a real day. `mealsByDay` and `eaten` are keyed by fixed
integers `0–6` (a Mon–Sun *template* week), `Home` is hardcoded to `TODAY = 1`, and the
`DAYS` array is static strings. Only the header label reads the real clock. As a result:

- Nothing rolls over at midnight — today's logged meals stay "today" forever, and the
  header date drifts out of sync with the meals shown below it.
- There is no history (yesterday) and no way to genuinely plan a specific future day.
- The `streak` field is stored but never computed — a dead number.

## Goals

1. Key each day by **real local date** so rollover is automatic and history is free.
2. **Home** stays today-only and near-unchanged, but reads the real today and rolls over.
3. **Calendar** becomes the rich, real-date planner: a real week strip with prev/next
   navigation across all of history and the future, and per-day cards showing the **same
   ingredient detail as Home**. Plan any day, including tomorrow.
4. **History** is retained forever (each day is tiny) and browsable by week.
5. **Streak** becomes real: consecutive days where **eaten kcal ≥ 80% of the calorie
   goal**, up to today.
6. **Existing v1 users keep everything** via a one-time migration (persist + backup).

## Non-goals (deliberately deferred)

- Weight entries stay label-based (`'Start'`, `'Today'`), not date-keyed.
- No analytics/charts over history beyond the Calendar week strip.
- No recurring meals / auto-copy of a day forward.
- No change to XP/level mechanics.

## Design

### 1. Date utilities — `src/lib/dates.ts` (new)

All dates are **local** `YYYY-MM-DD` strings. Never use `toISOString()` for day keys (it
is UTC and causes off-by-one near midnight).

```ts
export type ISODate = string // "2026-07-27", always local

export const todayISO = (): ISODate => toISO(new Date())
export const toISO = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const addDays = (iso: ISODate, n: number): ISODate  // calendar-safe
export const startOfWeek = (iso: ISODate): ISODate         // Monday of that week
export const weekDates = (iso: ISODate): ISODate[]         // 7 dates Mon..Sun
export const parseISO = (iso: ISODate): Date               // local midnight
export const weekdayShort = (iso: ISODate): string         // "Mon"
export const dayOfMonth = (iso: ISODate): string           // "27"
export const longLabel = (iso: ISODate): string            // "Monday, Jul 27"
export const relativeLabel = (iso: ISODate): string        // "Today"/"Tomorrow"/"Yesterday"/longLabel
```

`addDays` / `startOfWeek` operate on local `Date` objects (add/subtract days on a real
`Date`, then re-serialize) so month, year, and DST boundaries are handled by the platform.

### 2. Data model changes — `src/types.ts`, `src/store.ts`

- `MealsByDay = Record<ISODate, DayMeals>` (was `Record<number, DayMeals>`).
- `eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>` (was `Record<number, …>`).
- Days are created **on demand**; there is no pre-seeded week. All reads already use
  `mealsByDay[key]?.[slot] || []`, so absent days are safe.
- Remove `emptyWeek()` and the seed `DAYS` / `SEED_MEALS` (template day-plan) usage.
  `SEED_FOODS`, `EXTRA_FOODS`, and `SEED_MEALS_LIB` (recipe library) are unchanged.
- New-user init: `mealsByDay: {}`, `eaten: {}`.

**`PersistState`:** `mealsByDay`/`eaten` value types change (keys become strings);
`selDay: number` is **removed**; `streak: number` is **removed** (now computed — see §6).

**Ephemeral state:**
- `pickDay: number` → `pickDate: ISODate`.
- `editRef: { day: number; … }` → `{ date: ISODate; … }`.
- Add `selDate: ISODate` (Calendar's selected day, default `todayISO()`), **not persisted**.
- `selDay` removed.

**Store action signatures** change `day: number` → `date: ISODate`:
`openPick(date, slot)`, `openEditItem(date, slot, idx)`, `removeItem(date, slot, idx)`,
`toggleEaten(date, slot)`, `addMeal(date, slot, mealId, servings)`,
`saveSlotAsMeal(date, slot)`, and internals `confirmGrams`/`confirmMeal` (use `pickDate`
and `editRef.date`). Add Calendar nav: `selectDate(date)`, `shiftWeek(dir: -1 | 1)`
(sets `selDate = addDays(selDate, 7*dir)`). **Every `for (i = 0; i < 7; i++)`
loop over `mealsByDay`** — currently in `deleteFood`, `deleteMeal`, and `removeSlot`
(which purge logged portions / slots across all days) — must become
`Object.keys(mealsByDay)`, or dated days would be silently skipped.

### 3. Migration (v1 users keep their data)

Bump zustand persist `version` from 0 → 1 and add a `migrate(persisted, version)`:

- If `version < 1`: convert integer-keyed `mealsByDay`/`eaten` to date keys **anchored to
  today** — old index `1` (the previous "today") → `todayISO()`, and index `i` →
  `addDays(todayISO(), i - 1)` (so `0`→yesterday, `2`→tomorrow, … `6`→today+5). Drop
  `selDay` and `streak`.
- Rationale: most real usage lived in index `1`; anchoring it to the real today is the
  least surprising outcome (their logged "today" stays today). Weekday labels shift, but
  the template week was never tied to real weekdays anyway.

**Backup import** (`importBackup`): detect an old-format backup (numeric top-level keys in
`mealsByDay`, or presence of `selDay`) and run the same remap before merge/replace, so
importing a v1 backup into the new app never loses days. **Export** (`exportBackup`,
`exportLibrary`) needs no shape work beyond the fields that already changed; bump the
backup to carry the new shape implicitly (it serializes current state).

### 4. Home — `src/components/screens/Home.tsx`

- Replace `const TODAY = 1` with `const today = todayISO()`; read `mealsByDay[today]` and
  `eaten[today]`. All existing behavior (ring, macros, check-off, per-slot cards,
  save-as-a-meal) is unchanged.
- Render the per-slot cards via the shared `DaySlots` component (§7) with today's date and
  check-off enabled.
- **Rollover while open:** a `visibilitychange` listener (added in `App.tsx`, alongside the
  existing update check) bumps a lightweight `dayTick` so Home re-derives `today` when the
  app returns to the foreground after midnight.
- Optional: a subtle "Plan ahead →" affordance that navigates to the Calendar.

### 5. Calendar — `src/components/screens/Planner.tsx` (rewrite)

- **Week strip:** `weekDates(startOfWeek(selDate))` → 7 real dates, each showing weekday +
  day-of-month + a kcal dot; the real today is highlighted distinctly from the selected
  day. `‹ ›` arrows call `shiftWeek(±1)`; a header shows the week range and a "This week"
  reset when `selDate` is off the current week.
- **Selected-day header:** `relativeLabel(selDate)` (e.g. "Tomorrow, Jul 28") + eaten/planned
  vs goal.
- **Day view:** renders the shared `DaySlots` component (§7) for `selDate`. Full parity
  with Home's ingredient cards: per-slot lines, kcal, add (＋), tap-to-edit item, and
  "Save as a meal." Check-off is shown for `selDate <= today` and hidden for future days.
- Plan any day exactly as you log today; "Shopping" button still routes to Shopping.

### 6. Streak — `src/lib/streak.ts` (new), computed everywhere

Remove the stored `streak`. Compute on demand:

```ts
export const STREAK_THRESHOLD = 0.8
export function computeStreak(foods, meals, mealsByDay, eaten, goalKcal, today): number
```

Algorithm: if `goalKcal <= 0` return 0. A date **qualifies** when
`eatenTotals(foods, meals, mealsByDay[date], eaten[date]).kcal >= STREAK_THRESHOLD * goalKcal`.
Start at `today`; if today does **not** yet qualify, start at `yesterday` (today is
"in progress" and must not zero the streak). Walk backward counting consecutive qualifying
days; stop at the first non-qualifying completed day. Cap iterations (e.g. 400) for safety.

Consumers compute it inline and pass it where needed: `Home` (streak chip + share card),
`Stats` (streak tile + "7-day streak" badge = `streak >= 7`), and `openShare` (fills
`card.streak`). No persisted field; it can never desync.

### 7. Shared slot cards — `src/components/DaySlots.tsx` (new)

Extract Home's per-slot card list into one component so Home and Calendar cannot drift:

```ts
<DaySlots date={ISODate} showCheckoff={boolean} />
```

It reads `mealSlots`, `mealsByDay[date]`, `eaten[date]`, `foods`, `meals` from the store
and renders each slot: eaten check-off (when `showCheckoff` and `date <= today`), label,
ingredient summary, kcal, add (＋ → `openPick(date, key)`), item lines (→ `openEditItem`),
and the "Save as a meal" link (→ `saveSlotAsMeal(date, key)`). Home passes
`showCheckoff` true for today; Calendar passes `showCheckoff = date <= today`.

### 8. Shopping — `src/components/screens/Shopping.tsx`, `src/lib/calc.ts`

`aggregateWeek` / `weekMealIngredients` take an explicit list of dates instead of "all
keys." Shopping aggregates `weekDates(startOfWeek(selDate))` — the week currently in view
in the Calendar — so "plan next week → shop next week" works. Default (`selDate = today`)
= the current real week.

## Edge cases

- **Timezone/DST/midnight:** all keys are local dates; `addDays` uses real `Date` math.
- **Empty days:** absent date keys render as empty slots (existing null-safe reads).
- **`goalKcal = 0`:** streak is 0; Home ring already guards divide-by-zero.
- **Future check-off:** hidden, so you can't mark unlived days eaten.
- **Week starts Monday**, matching the current DAYS ordering.
- **Migration idempotency:** guarded by persist `version`; runs once per client.

## Verification

No test runner is configured and dependency installs are network-restricted, so:

- **Pure functions** (`dates`, `computeStreak`, the migration remap) are validated with a
  throwaway Node script (`node --input-type=module`) covering: local `todayISO`,
  `addDays` across a month/year boundary, `startOfWeek` on each weekday, streak with
  in-progress today / a break / goal 0, and the int→date remap.
- **In-browser** (dev + built preview, same as prior features): roll a seeded old-format
  `plately-v1` state through the migration and confirm days land on the right real dates;
  log/plan across today, tomorrow, and a past day; verify check-off hidden on future days;
  verify the streak ticks at 80% and resets on a gap; verify Shopping follows the week.
- **Staging** (`plately-staging`, its own key → starts fresh): confirm no regressions;
  separately inject an old-format state under the staging key to exercise the migration.
- If the team later wants a real runner, adding `vitest` is a clean follow-up.

## Rollout

Build on `v2`; verify on staging; then promote `v2` → live `plately` `main` (one release).
The migration runs for existing users on first load of the new build; recommend they
export a backup first (the new update banner nudges this).

## File-by-file summary

- **new** `src/lib/dates.ts`, `src/lib/streak.ts`, `src/components/DaySlots.tsx`
- **edit** `src/types.ts` (key types), `src/store.ts` (state shape, migration,
  action signatures, selDate/pickDate/editRef, remove streak/selDay/emptyWeek),
  `src/components/screens/Home.tsx` (today via date + DaySlots + rollover),
  `src/components/screens/Planner.tsx` (real-week rewrite + DaySlots),
  `src/components/screens/Shopping.tsx` + `src/lib/calc.ts` (week-scoped aggregation),
  `src/components/screens/Stats.tsx` (computed streak),
  `src/components/overlays/MealDetailSheet.tsx` (`TODAY` → `todayISO()`),
  `src/lib/share.ts` consumers (computed streak), `src/seed.ts` (drop DAYS/SEED_MEALS),
  `HANDOFF.md` (document the date model).
```
