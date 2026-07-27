# Real Calendar Dates, History & Rollover — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-key days by real local date so the app has automatic midnight rollover, browsable history, a real-date Calendar planner, and a computed 80%-goal streak — shipped as part of the `v2` release.

**Architecture:** `mealsByDay` and `eaten` move from integer (`0–6`) keys to local `YYYY-MM-DD` string keys. Home reads `todayISO()`; the Calendar navigates real weeks; a shared `DaySlots` component renders identical slot cards on Home and Calendar. The streak is derived, not stored. A persist `migrate` (and matching backup-import remap) converts existing v1 data with no loss.

**Tech Stack:** React 18 + Vite + TypeScript + Zustand (persist → localStorage). No test runner is configured and dependency installs are network-restricted, so pure functions are verified with a throwaway `esbuild`-bundle + `node` script, and integration is verified in-browser with injected state (the pattern used for prior v2 features) plus `npx tsc -b --noEmit`.

**Branch:** `v2` (continue on the existing branch; do not push to `origin`, only to `staging` for device testing).

---

## Conventions for every task

- After code changes: run `npx tsc -b --noEmit` from `plately/`. During the mid-refactor tasks (3–8) tsc may report errors in files updated by *later* tasks — each task notes the expected state. It must be **fully green after Task 9**.
- Pure-function verification helper (used in Tasks 1–2): bundle the module with the local esbuild and run assertions in node.
- Commit after each task with the message shown.
- All shell commands run from `plately/`:
  `cd "/Users/thys/Library/Mobile Documents/com~apple~CloudDocs/Claude_folder/Plately App/plately"`.

---

## Task 1: Date utilities (`src/lib/dates.ts`)

**Files:**
- Create: `src/lib/dates.ts`
- Test (throwaway): `/tmp/dates.test.mjs`

- [ ] **Step 1: Write the failing verification script**

Create `/tmp/dates.test.mjs`:

```js
import * as d from '/tmp/dates.bundle.mjs'
const eq = (a, b, m) => { if (a !== b) { console.error(`FAIL ${m}: ${a} !== ${b}`); process.exit(1) } }
eq(d.addDays('2026-01-31', 1), '2026-02-01', 'month boundary')
eq(d.addDays('2026-12-31', 1), '2027-01-01', 'year boundary')
eq(d.addDays('2026-07-27', -1), '2026-07-26', 'minus one')
eq(d.startOfWeek('2026-07-27'), '2026-07-27', 'monday is start') // 2026-07-27 is a Monday
eq(d.startOfWeek('2026-08-02'), '2026-07-27', 'sunday -> monday')
eq(d.weekDates('2026-07-27').length, 7, 'week has 7')
eq(d.weekDates('2026-07-27')[6], '2026-08-02', 'week ends sunday')
eq(d.weekdayShort('2026-07-27'), 'Mon', 'weekday short')
eq(d.dayOfMonth('2026-07-27'), '27', 'day of month')
eq(d.relativeLabel(d.todayISO()), 'Today', 'today label')
eq(d.relativeLabel(d.addDays(d.todayISO(), 1)), 'Tomorrow', 'tomorrow label')
eq(d.relativeLabel(d.addDays(d.todayISO(), -1)), 'Yesterday', 'yesterday label')
// remapWeekKeys: index 1 -> today, index 0 -> yesterday, index 2 -> tomorrow
const today = d.todayISO()
const remapped = d.remapWeekKeys({ '0': 'a', '1': 'b', '2': 'c' }, today)
eq(remapped[d.addDays(today, -1)], 'a', 'remap idx0')
eq(remapped[today], 'b', 'remap idx1')
eq(remapped[d.addDays(today, 1)], 'c', 'remap idx2')
eq(Object.keys(d.remapWeekKeys({ '2026-07-27': 'x' }, today))[0], '2026-07-27', 'passthrough date keys')
console.log('OK dates')
```

- [ ] **Step 2: Run it to confirm it fails**

Run:
```bash
./node_modules/.bin/esbuild src/lib/dates.ts --bundle --format=esm --platform=node --outfile=/tmp/dates.bundle.mjs && node /tmp/dates.test.mjs
```
Expected: FAIL — esbuild errors that `src/lib/dates.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/dates.ts`**

```ts
// Local calendar-date helpers. Day keys are local `YYYY-MM-DD` strings — never
// use toISOString() for keys (it is UTC and breaks near midnight).
export type ISODate = string

const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const toISO = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = (): ISODate => toISO(new Date())

/** Parse a local date string to a Date at local midnight. */
export const parseISO = (iso: ISODate): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso: ISODate, n: number): ISODate => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Monday of the week containing `iso`. */
export const startOfWeek = (iso: ISODate): ISODate => {
  const d = parseISO(iso)
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - dow)
  return toISO(d)
}

export const weekDates = (iso: ISODate): ISODate[] => {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const weekdayShort = (iso: ISODate): string => DOW[parseISO(iso).getDay()]
export const dayOfMonth = (iso: ISODate): string => String(parseISO(iso).getDate())

/** "Monday, Jul 27" */
export const longLabel = (iso: ISODate): string => {
  const d = parseISO(iso)
  const full = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
  return `${full}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "Today" / "Tomorrow" / "Yesterday" / else longLabel. */
export const relativeLabel = (iso: ISODate): string => {
  const t = todayISO()
  if (iso === t) return 'Today'
  if (iso === addDays(t, 1)) return 'Tomorrow'
  if (iso === addDays(t, -1)) return 'Yesterday'
  return longLabel(iso)
}

/**
 * Remap a map whose keys may be old integer strings ('0'..'6') to date keys,
 * anchored so index 1 (the old "today") = `today` and index i = today+(i-1).
 * Keys that are already dates pass through unchanged. Used by the persist
 * migration and by backup import.
 */
export const remapWeekKeys = <T>(obj: Record<string, T> | undefined, today: ISODate): Record<string, T> => {
  const out: Record<string, T> = {}
  Object.keys(obj || {}).forEach((k) => {
    const i = Number(k)
    const key = /^\d+$/.test(k) && Number.isInteger(i) ? addDays(today, i - 1) : k
    out[key] = (obj as Record<string, T>)[k]
  })
  return out
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run:
```bash
./node_modules/.bin/esbuild src/lib/dates.ts --bundle --format=esm --platform=node --outfile=/tmp/dates.bundle.mjs && node /tmp/dates.test.mjs
```
Expected: `OK dates`

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts
git commit -m "feat(dates): local date helpers + week-key remap for migration"
```

---

## Task 2: Streak computation (`src/lib/streak.ts`)

**Files:**
- Create: `src/lib/streak.ts`
- Test (throwaway): `/tmp/streak.test.mjs`

- [ ] **Step 1: Write the failing verification script**

Create `/tmp/streak.test.mjs`:

```js
import { computeStreak, STREAK_THRESHOLD } from '/tmp/streak.bundle.mjs'
const eq = (a, b, m) => { if (a !== b) { console.error(`FAIL ${m}: ${a} !== ${b}`); process.exit(1) } }
eq(STREAK_THRESHOLD, 0.8, 'threshold')
const foods = [{ id: 'x', name: 'X', cat: 'Other', kcal: 100, p: 0, c: 0, f: 0 }]
const meals = []
const goal = 1000 // 80% = 800 kcal = 800 g of food x
// helper to build a day at N grams of food x, all eaten
const day = (g) => ({ mealsByDay: { breakfast: [{ foodId: 'x', grams: g }] }, eaten: { breakfast: true } })
const iso = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); const p = (n)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` }
const today = iso(0)
// today 900 (qualifies), yesterday 850 (qualifies), 2 days ago 500 (fails) -> streak 2
let mbd = {}, eaten = {}
;[[0,900],[-1,850],[-2,500]].forEach(([o,g]) => { const d = day(g); mbd[iso(o)] = d.mealsByDay; eaten[iso(o)] = d.eaten })
eq(computeStreak(foods, meals, mbd, eaten, goal, today), 2, 'two-day streak, break at day -2')
// today in progress (0 eaten) but yesterday 900 -> streak 1 (today does not zero it)
mbd = {}; eaten = {}
;[[-1,900],[-2,900]].forEach(([o,g]) => { const d = day(g); mbd[iso(o)] = d.mealsByDay; eaten[iso(o)] = d.eaten })
eq(computeStreak(foods, meals, mbd, eaten, goal, today), 2, 'in-progress today, streak from yesterday')
// goal 0 -> 0
eq(computeStreak(foods, meals, mbd, eaten, 0, today), 0, 'goal zero')
// nothing -> 0
eq(computeStreak(foods, meals, {}, {}, goal, today), 0, 'empty')
console.log('OK streak')
```

- [ ] **Step 2: Run it to confirm it fails**

Run:
```bash
./node_modules/.bin/esbuild src/lib/streak.ts --bundle --format=esm --platform=node --outfile=/tmp/streak.bundle.mjs && node /tmp/streak.test.mjs
```
Expected: FAIL — `src/lib/streak.ts` does not exist.

- [ ] **Step 3: Implement `src/lib/streak.ts`**

```ts
import type { Food, Meal, MealsByDay, SlotKey } from '../types'
import { eatenTotals } from './calc'
import { addDays, type ISODate } from './dates'

export const STREAK_THRESHOLD = 0.8
const MAX_LOOKBACK = 400

/**
 * Consecutive days (up to today) where eaten kcal ≥ 80% of the calorie goal.
 * Today "in progress" does not break the streak: if today has not yet crossed
 * the threshold, counting starts at yesterday.
 */
export function computeStreak(
  foods: Food[],
  meals: Meal[],
  mealsByDay: MealsByDay,
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>,
  goalKcal: number,
  today: ISODate,
): number {
  if (!goalKcal || goalKcal <= 0) return 0
  const need = STREAK_THRESHOLD * goalKcal
  const qualifies = (date: ISODate) =>
    eatenTotals(foods, meals, mealsByDay[date], eaten[date]).kcal >= need

  let cursor = today
  if (!qualifies(today)) cursor = addDays(today, -1) // today still in progress
  let streak = 0
  for (let i = 0; i < MAX_LOOKBACK; i++) {
    if (!qualifies(cursor)) break
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run:
```bash
./node_modules/.bin/esbuild src/lib/streak.ts --bundle --format=esm --platform=node --outfile=/tmp/streak.bundle.mjs && node /tmp/streak.test.mjs
```
Expected: `OK streak`

- [ ] **Step 5: Commit**

```bash
git add src/lib/streak.ts
git commit -m "feat(streak): computed 80%-of-goal streak from eaten days"
```

---

## Task 3: Types — date-keyed week (`src/types.ts`)

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Change `MealsByDay` to date keys**

Replace:
```ts
export type DayMeals = Record<SlotKey, Portion[]>

/** mealsByDay is keyed 0..6 (Mon..Sun). */
export type MealsByDay = Record<number, DayMeals>
```
with:
```ts
export type DayMeals = Record<SlotKey, Portion[]>

/** mealsByDay is keyed by local date string "YYYY-MM-DD". */
export type MealsByDay = Record<string, DayMeals>
```

- [ ] **Step 2: Typecheck (expect downstream errors — fixed in Tasks 4–9)**

Run: `npx tsc -b --noEmit`
Expected: errors only in `store.ts` / screens that still use numeric day keys. That is expected; they are fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor(types): mealsByDay keyed by date string"
```

---

## Task 4: Store — state shape, ephemeral fields, new-user init

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Update imports**

At the top imports, add `dates` + `streak` helpers and `todayISO`:
```ts
import { suggestKcal, suggestMacros, deriveMacros, toNum } from './lib/calc'
import { isUpdateAvailable } from './lib/update'
import { todayISO, addDays, remapWeekKeys, type ISODate } from './lib/dates'
import type { ShareCard } from './lib/share'
```

- [ ] **Step 2: Delete `emptyWeek` and empty the seeded week**

Remove the `emptyWeek` function entirely:
```ts
const emptyWeek = (): MealsByDay => { /* ...delete whole function... */ }
```
In `initialPersist`, set:
```ts
  mealsByDay: {},
```
and remove `selDay: 1,` and `streak: 0,` from `initialPersist`.

- [ ] **Step 3: Update `PersistState`**

In the `PersistState` interface: remove the `streak: number` line and the `selDay: number` line. Change the `eaten` field type to date keys:
```ts
  /** Which meal slots the user has ticked as eaten, per date. */
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>
```

- [ ] **Step 4: Update ephemeral state**

In `EphemeralState`: replace `pickDay: number` with `pickDate: ISODate`; change `editRef` to use `date`; add `selDate`:
```ts
  // pick / grams
  pickDate: ISODate
  ...
  // editing an existing logged portion (null = adding a new one)
  editRef: { date: ISODate; slot: SlotKey; idx: number } | null
  ...
  // calendar selected day (Planner)
  selDate: ISODate
```
In `initialEphemeral`: replace `pickDay: 1,` with `pickDate: todayISO(),`, and add `selDate: todayISO(),`. Remove nothing else here.

- [ ] **Step 5: Typecheck (still expect action-body errors)**

Run: `npx tsc -b --noEmit`
Expected: errors now in the action bodies (fixed in Task 5) and screens (Tasks 6–9).

- [ ] **Step 6: Commit**

```bash
git add src/store.ts
git commit -m "refactor(store): date-keyed state, selDate, drop selDay/streak/emptyWeek"
```

---

## Task 5: Store — action signatures (`day: number` → `date: ISODate`)

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Update the `AppState` interface signatures**

Change these lines in the interface:
```ts
  openPick: (date: ISODate, slot: SlotKey) => void
  removeItem: (date: ISODate, slot: SlotKey, idx: number) => void
  openEditItem: (date: ISODate, slot: SlotKey, idx: number) => void
  addMeal: (date: ISODate, slot: SlotKey, mealId: string, servings: number) => void
  saveSlotAsMeal: (date: ISODate, slot: SlotKey) => void
  // planner
  selectDate: (date: ISODate) => void
  shiftWeek: (dir: -1 | 1) => void
```
Remove the old `selectDay: (i: number) => void` line.

- [ ] **Step 2: Update the picking/logging action bodies**

Replace the pick/quick actions:
```ts
      openPick: (date, slot) =>
        set({ overlay: 'pick', pickDate: date, pickSlot: slot, pickSearch: '', pickTab: 'foods' }),
      openQuick: () => {
        const slots = get().mealSlots
        set({
          overlay: 'pick',
          pickDate: todayISO(),
          pickSlot: slots[slots.length - 1]?.key || 'snacks',
          pickSearch: '',
          pickTab: 'foods',
        })
      },
```

In `confirmGrams`, the add-mode branch uses `s.pickDate` instead of `s.pickDay`:
```ts
        const day = { ...(mb[s.pickDate] || {}) } as MealsByDay[string]
        day[s.pickSlot] = [
          ...(day[s.pickSlot] || []),
          { foodId: s.chosenId, grams: s.gVal },
        ]
        mb[s.pickDate] = day
```
and the edit-mode branch destructures `date`:
```ts
        if (s.editRef) {
          const { date, slot, idx } = s.editRef
          const d = { ...(mb[date] || {}) } as MealsByDay[string]
          const arr = [...(d[slot] || [])]
          if (arr[idx]) arr[idx] = { ...arr[idx], grams: s.gVal }
          d[slot] = arr
          mb[date] = d
          set({ mealsByDay: mb, overlay: 'none', editRef: null })
          s.showToast('Portion updated')
          return
        }
```

- [ ] **Step 3: Update `removeItem`, `openEditItem`, `deleteEditItem`**

```ts
      removeItem: (date, slot, idx) =>
        set((s) => {
          const mb: MealsByDay = { ...s.mealsByDay }
          const d = { ...(mb[date] || {}) } as MealsByDay[string]
          const arr = [...(d[slot] || [])]
          arr.splice(idx, 1)
          d[slot] = arr
          mb[date] = d
          return { mealsByDay: mb }
        }),
      openEditItem: (date, slot, idx) => {
        const s = get()
        const portion = s.mealsByDay[date]?.[slot]?.[idx]
        if (!portion) return
        if (isMealPortion(portion)) {
          set({ overlay: 'mealamount', chosenMealId: portion.mealId, mVal: portion.servings, editRef: { date, slot, idx } })
        } else {
          set({ overlay: 'grams', chosenId: portion.foodId, gVal: portion.grams, editRef: { date, slot, idx } })
        }
      },
      deleteEditItem: () => {
        const s = get()
        if (!s.editRef) return
        const { date, slot, idx } = s.editRef
        s.removeItem(date, slot, idx)
        set({ overlay: 'none', editRef: null })
        s.showToast('Removed from meal')
      },
```

- [ ] **Step 4: Update `confirmMeal`, `addMeal`, `saveSlotAsMeal`**

In `confirmMeal`, the edit branch destructures `date` and the add branch uses `s.pickDate` (same pattern as `confirmGrams` above). In `addMeal`:
```ts
      addMeal: (date, slot, mealId, servings) => {
        const s = get()
        const mb: MealsByDay = { ...s.mealsByDay }
        const d = { ...(mb[date] || {}) } as MealsByDay[string]
        d[slot] = [...(d[slot] || []), { mealId, servings }]
        mb[date] = d
        const meal = s.meals.find((m) => m.id === mealId)
        set({ mealsByDay: mb, overlay: 'none', xp: Math.min(s.xpMax, s.xp + 15) })
        s.showToast(`${meal?.name ?? 'Meal'} added  +15 XP`)
      },
```
In `saveSlotAsMeal`, change the signature param and the read:
```ts
      saveSlotAsMeal: (date, slot) => {
        const s = get()
        const portions = s.mealsByDay[date]?.[slot] || []
        /* ...rest of the existing body unchanged (byFood map, items, section, set builderSeed)... */
      },
```

- [ ] **Step 5: Replace `selectDay` with `selectDate` + `shiftWeek`**

```ts
      selectDate: (date) => set({ selDate: date }),
      shiftWeek: (dir) => set((s) => ({ selDate: addDays(s.selDate, 7 * dir) })),
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: remaining errors are the `for (i=0;i<7)` loops (Task 6), backup/persist (Task 7), and screens (Tasks 8–10).

- [ ] **Step 7: Commit**

```bash
git add src/store.ts
git commit -m "refactor(store): date-based logging/edit/meal actions + calendar nav"
```

---

## Task 6: Store — replace `0..6` loops with `Object.keys`

**Files:**
- Modify: `src/store.ts` (`deleteFood`, `deleteMeal`, `removeSlot`)

- [ ] **Step 1: `deleteFood` — iterate real day keys**

Replace its purge loop:
```ts
        const mb: MealsByDay = {}
        Object.keys(s.mealsByDay).forEach((date) => {
          const d = s.mealsByDay[date]
          const nd: MealsByDay[string] = {}
          Object.keys(d).forEach((k) => {
            nd[k] = d[k].filter(keep)
          })
          mb[date] = nd
        })
```

- [ ] **Step 2: `deleteMeal` — same pattern**

Replace its purge loop identically (using its `keep` predicate):
```ts
        const mb: MealsByDay = {}
        Object.keys(s.mealsByDay).forEach((date) => {
          const d = s.mealsByDay[date]
          const nd: MealsByDay[string] = {}
          Object.keys(d).forEach((k) => {
            nd[k] = d[k].filter(keep)
          })
          mb[date] = nd
        })
```

- [ ] **Step 3: `removeSlot` — iterate real day keys**

Replace the `for (let i = 0; i < 7; i++)` block that rebuilds `mb`:
```ts
          const mb: MealsByDay = {}
          Object.keys(s.mealsByDay).forEach((date) => {
            const d = s.mealsByDay[date]
            const nd: MealsByDay[string] = {}
            Object.keys(d).forEach((k) => {
              if (k !== key) nd[k] = d[k]
            })
            mb[date] = nd
          })
```
(The `eaten` remap in `removeSlot` already uses `Object.keys(s.eaten)` — leave it, it works with string keys.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: remaining errors only in backup/persist (Task 7) and screens (Tasks 8–10).

- [ ] **Step 5: Commit**

```bash
git add src/store.ts
git commit -m "refactor(store): purge logged portions across dated days"
```

---

## Task 7: Store — persist migration + backup export/import

**Files:**
- Modify: `src/store.ts` (`exportBackup`, `importBackup`, persist options)

- [ ] **Step 1: `exportBackup` — drop removed fields**

In the `backup` object built inside `exportBackup`, remove the `streak: s.streak,` and `selDay: s.selDay,` lines. (Leave `eaten`, `mealsByDay`, etc.)

- [ ] **Step 2: `importBackup` — remap old-format backups**

At the start of `importBackup`, after the `JSON.parse` guard and the `Array.isArray(data.foods)` guard, normalise old integer-keyed backups:
```ts
        // Old (v1) backups keyed days 0..6; remap to real dates anchored to today.
        const looksOld =
          data.mealsByDay && Object.keys(data.mealsByDay).some((k) => /^\d+$/.test(k))
        if (looksOld) {
          const today = todayISO()
          data.mealsByDay = remapWeekKeys(data.mealsByDay as Record<string, DayMeals>, today)
          data.eaten = remapWeekKeys(
            (data.eaten as Record<string, Partial<Record<SlotKey, boolean>>>) || {},
            today,
          )
        }
        delete (data as { selDay?: number }).selDay
        delete (data as { streak?: number }).streak
```
Add `DayMeals` to the `./types` import if not already imported. In the merge branch, `mealsByDay` and `eaten` already come from `data` — ensure the merge sets `eaten: data.eaten ?? s.eaten` (add if the current merge branch does not already carry `eaten`).

- [ ] **Step 3: persist `version` + `migrate`**

In the `persist(...)` options object (currently `{ name: __STORAGE_KEY__, partialize: ... }`), add `version` and `migrate`, and remove `streak`/`selDay` from `partialize`:
```ts
    {
      name: __STORAGE_KEY__,
      version: 1,
      migrate: (persisted, version) => {
        const s = persisted as Partial<PersistState> & {
          mealsByDay?: Record<string, DayMeals>
          eaten?: Record<string, Partial<Record<SlotKey, boolean>>>
          selDay?: number
          streak?: number
        }
        if (s && version < 1) {
          const today = todayISO()
          s.mealsByDay = remapWeekKeys(s.mealsByDay, today)
          s.eaten = remapWeekKeys(s.eaten || {}, today)
          delete s.selDay
          delete s.streak
        }
        return s as PersistState
      },
      partialize: (s): PersistState => ({
        /* ...existing fields MINUS streak and selDay... */
      }),
    },
```
Delete the `streak: s.streak,` and `selDay: s.selDay,` lines inside `partialize`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: errors now only in the screens (`Home.tsx`, `Planner.tsx`, `Shopping.tsx`, `Stats.tsx`, `MealDetailSheet.tsx`) — fixed in Tasks 8–11.

- [ ] **Step 5: Commit**

```bash
git add src/store.ts
git commit -m "feat(store): persist v1 migration + backup remap for date keys"
```

---

## Task 8: Shared `DaySlots` component + Home

**Files:**
- Create: `src/components/DaySlots.tsx`
- Modify: `src/components/screens/Home.tsx`

- [ ] **Step 1: Create `src/components/DaySlots.tsx`**

Extract Home's per-slot card list verbatim into a reusable component. It renders, for a given `date`, each meal slot with: eaten check-off (only when `showCheckoff` and `date <= today`), label, ingredient summary, kcal, add (＋), item lines, and the "Save as a meal" link. It reads store state/actions directly.

```tsx
import { useStore } from '../store'
import { ink } from '../tokens'
import { itemMetrics } from '../lib/calc'
import { todayISO, type ISODate } from '../lib/dates'
import { Utensils, Plus, Check, ChevronRight } from '../icons'

export default function DaySlots({ date, showCheckoff }: { date: ISODate; showCheckoff: boolean }) {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealSlots = useStore((s) => s.mealSlots)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const openPick = useStore((s) => s.openPick)
  const openEditItem = useStore((s) => s.openEditItem)
  const toggleEaten = useStore((s) => s.toggleEaten)
  const saveSlotAsMeal = useStore((s) => s.saveSlotAsMeal)

  const eatenForDay = eaten[date]
  const canCheck = showCheckoff && date <= todayISO()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mealSlots.map(({ key, label }) => {
        const items = (mealsByDay[date]?.[key] || []).map((it, idx) => ({ ...itemMetrics(foods, meals, it), idx }))
        const kc = items.reduce((a, b) => a + b.kcal, 0)
        const hasItems = items.length > 0
        const done = !!eatenForDay?.[key]
        return (
          <div
            key={key}
            style={{
              background: done ? '#F4FAF6' : '#fff',
              border: `1px solid ${done ? '#CFE6D8' : '#EFE9DD'}`,
              borderRadius: 16,
              padding: '11px 14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {hasItems && canCheck ? (
                <div
                  onClick={() => toggleEaten(date, key)}
                  title={done ? 'Eaten — tap to undo' : 'Mark as eaten'}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#2E9E5B' : '#fff', border: done ? 'none' : '2px solid #CFE6D8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
                >
                  {done && <Check size={16} color="#fff" strokeWidth={3} />}
                </div>
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FDF3E6', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Utensils />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px Figtree', color: '#1a1a17' }}>{label}</div>
                <div style={{ font: '500 11px Figtree', color: ink(0.45) }}>
                  {items.length ? items.map((i) => i.name).join(', ') : 'Tap + to add'}
                </div>
              </div>
              <div style={{ font: "700 13px 'Space Grotesk'", color: done ? '#2E9E5B' : '#1a1a17', marginRight: 8 }}>
                {items.length ? (<>{kc}<span style={{ font: '500 9px Figtree', color: ink(0.4) }}> kcal</span></>) : '—'}
              </div>
              <div onClick={() => openPick(date, key)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#EAF5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus color="#2E9E5B" />
              </div>
            </div>
            {items.map((it) => (
              <div key={it.idx} onClick={() => openEditItem(date, key, it.idx)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9, paddingLeft: 43, cursor: 'pointer' }}>
                <div style={{ flex: 1, font: '500 12px Figtree', color: ink(0.7) }}>{it.name}</div>
                <div style={{ font: '500 11px Figtree', color: ink(0.4) }}>
                  {it.isMeal ? (it.servings === 1 ? '1 serving' : `${it.servings} servings`) : `${it.grams}g`}
                </div>
                <div style={{ font: "600 11px 'Space Grotesk'", color: ink(0.55), width: 42, textAlign: 'right' }}>{it.kcal}</div>
                <ChevronRight size={13} color="#C9C1B2" strokeWidth={2.4} />
              </div>
            ))}
            {hasItems && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, paddingTop: 9, borderTop: '1px solid #F1ECE1' }}>
                <div onClick={() => saveSlotAsMeal(date, key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', font: '700 11px Figtree', color: '#2E9E5B' }}>
                  <Utensils size={13} color="#2E9E5B" />
                  Save as a meal
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Rewire Home to use real today + `DaySlots`**

In `src/components/screens/Home.tsx`: remove `const TODAY = 1`; add `import { todayISO } from '../../lib/dates'` and `import DaySlots from '../DaySlots'` and `import { computeStreak } from '../../lib/streak'`. Add `const today = todayISO()` at the top of the component and replace every `TODAY` reference with `today`. Replace the streak read `const streak = useStore((s) => s.streak)` with a computed value:
```ts
  const streak = computeStreak(foods, meals, mealsByDay, eaten, goals.kcal, today)
```
Replace the entire `mealSlots.map(...)` slot-rendering block (the one inside `Today's meals`) plus the trailing "Add or edit meals" button wrapper with:
```tsx
      <DaySlots date={today} showCheckoff />

      <div
        onClick={openSlots}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', marginTop: 8, borderRadius: 16, border: '1px dashed #D8D0C0', font: '600 12px Figtree', color: ink(0.5), cursor: 'pointer' }}
      >
        <Plus size={14} color={ink(0.5)} />
        Add or edit meals
      </div>
```
Remove now-unused imports from Home (`Utensils`, `Check`, `ChevronRight`, `itemMetrics`, `toggleEaten`, `openEditItem`, `openPick`, `saveSlotAsMeal`) — keep whatever the ring/macros still use (`Flame`, `Plus`, `Share`, `round`, `fmt`, `clamp01`, `dayTotals`, `eatenTotals`).

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: errors remain only in `Planner.tsx`, `Shopping.tsx`, `Stats.tsx`, `MealDetailSheet.tsx`.

- [ ] **Step 4: Verify in browser**

Start dev (`npm run dev`), open `/plately/`, inject an onboarded state with a couple of foods logged into today, and confirm Home renders identically to before (ring, check-off, item lines, Save-as-a-meal). Use the injection pattern:
```js
localStorage.setItem('plately-v1', JSON.stringify({ state: { onboarded: true, seenIntro: true, name: 'Test', mealsByDay: { [new Date().toISOString().slice(0,10)]: { breakfast: [{foodId:'oats',grams:60}], lunch: [], dinner: [], snacks: [] } } }, version: 1 })); location.reload()
```
Expected: Breakfast shows Rolled oats, ~233 kcal, check-off works.

- [ ] **Step 5: Commit**

```bash
git add src/components/DaySlots.tsx src/components/screens/Home.tsx
git commit -m "feat(home): real today via DaySlots + computed streak"
```

---

## Task 9: Calendar rewrite (`src/components/screens/Planner.tsx`)

**Files:**
- Modify: `src/components/screens/Planner.tsx`

- [ ] **Step 1: Rewrite Planner around real dates + `DaySlots`**

```tsx
import { useStore } from '../../store'
import { ink } from '../../tokens'
import { fmt, dayTotals } from '../../lib/calc'
import { weekDates, startOfWeek, weekdayShort, dayOfMonth, relativeLabel, todayISO } from '../../lib/dates'
import DaySlots from '../DaySlots'
import { Cart, ChevronLeft, ChevronRight } from '../../icons'

export default function Planner() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const selDate = useStore((s) => s.selDate)
  const goals = useStore((s) => s.goals)
  const nav = useStore((s) => s.nav)
  const selectDate = useStore((s) => s.selectDate)
  const shiftWeek = useStore((s) => s.shiftWeek)
  const openSlots = useStore((s) => s.openSlots)

  const today = todayISO()
  const week = weekDates(startOfWeek(selDate))
  const dayKcal = fmt(dayTotals(foods, meals, mealsByDay[selDate]).kcal)

  return (
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ font: "700 22px 'Bricolage Grotesque'", color: '#1a1a17' }}>Plan</div>
        <div onClick={() => nav('shopping')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2E9E5B', borderRadius: 999, padding: '8px 13px', cursor: 'pointer' }}>
          <Cart /><span style={{ font: '700 11.5px Figtree', color: '#fff' }}>Shopping</span>
        </div>
      </div>

      {/* week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div onClick={() => shiftWeek(-1)} style={{ padding: 6, cursor: 'pointer' }}><ChevronLeft /></div>
        <div style={{ font: '600 12px Figtree', color: ink(0.6) }}>
          {relativeLabel(selDate) === 'Today' || week.includes(today) ? 'This week' : `${weekdayShort(week[0])} ${dayOfMonth(week[0])} – ${dayOfMonth(week[6])}`}
        </div>
        <div onClick={() => shiftWeek(1)} style={{ padding: 6, cursor: 'pointer' }}><ChevronRight /></div>
      </div>

      {/* day strip */}
      <div className="noscroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '0 -22px 16px', padding: '2px 22px 4px' }}>
        {week.map((d) => {
          const tot = dayTotals(foods, meals, mealsByDay[d])
          const on = d === selDate
          const isToday = d === today
          return (
            <div key={d} onClick={() => selectDate(d)} style={{ flex: 'none', width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', borderRadius: 16, cursor: 'pointer', ...(on ? { background: '#2E9E5B', color: '#fff' } : { background: '#fff', border: `1px solid ${isToday ? '#2E9E5B' : '#EFE9DD'}`, color: '#1a1a17' }) }}>
              <div style={{ font: '600 10.5px Figtree', opacity: 0.7 }}>{weekdayShort(d)}</div>
              <div style={{ font: "700 17px 'Space Grotesk'", margin: '2px 0 6px' }}>{dayOfMonth(d)}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#fff' : tot.kcal > 0 ? '#2E9E5B' : '#DDD5C6' }} />
              <div style={{ font: "600 9px 'Space Grotesk'", marginTop: 5, opacity: 0.75 }}>{tot.kcal}</div>
            </div>
          )
        })}
      </div>

      {/* selected day header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ font: "700 15px 'Bricolage Grotesque'", color: '#1a1a17' }}>{relativeLabel(selDate)}</div>
        <div style={{ font: "600 12px 'Space Grotesk'", color: ink(0.5) }}>{dayKcal} / {fmt(goals.kcal)} kcal</div>
      </div>

      <DaySlots date={selDate} showCheckoff={selDate <= today} />

      <div onClick={openSlots} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', marginTop: 8, borderRadius: 16, border: '1px dashed #D8D0C0', font: '600 12px Figtree', color: ink(0.5), cursor: 'pointer' }}>
        Add or edit meals
      </div>
    </div>
  )
}
```
(If `ChevronLeft` is not exported from `icons.tsx`, use the existing `ChevronRight` rotated, or add a `ChevronLeft`. Check `icons.tsx` first — `ChevronLeft` exists per the icon list.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: errors remain only in `Shopping.tsx`, `Stats.tsx`, `MealDetailSheet.tsx`.

- [ ] **Step 3: Verify in browser**

On the dev server, go to the Plan tab. Confirm: the strip shows the real current week (today highlighted), ‹ › page weeks, selecting a day shows its slots, a **future** day hides the check-off, adding a food to tomorrow works and shows on the strip kcal.

- [ ] **Step 4: Commit**

```bash
git add src/components/screens/Planner.tsx
git commit -m "feat(calendar): real-date week planner with shared DaySlots"
```

---

## Task 10: Shopping — week-scoped aggregation

**Files:**
- Modify: `src/lib/calc.ts`, `src/components/screens/Shopping.tsx`

- [ ] **Step 1: `aggregateWeek` / `weekMealIngredients` take explicit dates**

In `src/lib/calc.ts` change both signatures to accept a `dates: string[]` list instead of looping `0..6`:
```ts
export function aggregateWeek(foods: Food[], mealsByDay: MealsByDay, dates: string[]): Record<string, number> {
  const agg: Record<string, number> = {}
  dates.forEach((date) => {
    allPortions(mealsByDay[date]).forEach((it) => {
      if (isMealPortion(it)) return
      if (foodById(foods, it.foodId)) agg[it.foodId] = (agg[it.foodId] || 0) + it.grams
    })
  })
  return agg
}

export function weekMealIngredients(meals: Meal[], mealsByDay: MealsByDay, dates: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  dates.forEach((date) => {
    allPortions(mealsByDay[date]).forEach((it) => {
      if (!isMealPortion(it)) return
      const m = mealById(meals, it.mealId)
      m?.ingredients.forEach((line) => {
        const norm = line.toLowerCase()
        if (seen.has(norm)) return
        seen.add(norm)
        out.push(line)
      })
    })
  })
  return out
}
```

- [ ] **Step 2: Shopping passes the selected week's dates**

In `src/components/screens/Shopping.tsx`, read `selDate` and compute the week, then pass it:
```ts
  const selDate = useStore((s) => s.selDate)
  const week = weekDates(startOfWeek(selDate))
  const agg = aggregateWeek(foods, mealsByDay, week)
  ...
  const mealIngs = weekMealIngredients(meals, mealsByDay, week).map(...)
```
Add `import { weekDates, startOfWeek } from '../../lib/dates'`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: errors remain only in `Stats.tsx`, `MealDetailSheet.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/calc.ts src/components/screens/Shopping.tsx
git commit -m "feat(shopping): aggregate the selected calendar week"
```

---

## Task 11: Stats, MealDetail, App rollover, seed cleanup

**Files:**
- Modify: `src/components/screens/Stats.tsx`, `src/components/overlays/MealDetailSheet.tsx`, `src/App.tsx`, `src/seed.ts`, `src/lib/share.ts` (only if it reads a stored streak)

- [ ] **Step 1: Stats — computed streak**

In `src/components/screens/Stats.tsx` replace `const streak = useStore((s) => s.streak)` with computed:
```ts
import { computeStreak } from '../../lib/streak'
import { todayISO } from '../../lib/dates'
...
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const goals = useStore((s) => s.goals)
  const streak = computeStreak(foods, meals, mealsByDay, eaten, goals.kcal, todayISO())
```
(Keep the existing badge logic — `streak >= 7`, etc. — unchanged.)

- [ ] **Step 2: MealDetailSheet — add to real today**

In `src/components/overlays/MealDetailSheet.tsx` replace `const TODAY = 1` with `import { todayISO } from '../../lib/dates'` and use `todayISO()` in the `addMeal(...)` call:
```ts
            onClick={() => addMeal(todayISO(), key, meal.id, 1)}
```

- [ ] **Step 3: App — roll the day on foreground**

In `src/App.tsx`, extend the existing visibility effect so a midnight rollover while the app is open refreshes the view. Add a `dayTick` state and bump it on visibility:
```tsx
  const [, setDayTick] = useState(0)
  useEffect(() => {
    checkForUpdate()
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate()
        setDayTick((n) => n + 1) // re-derive today after returning
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkForUpdate])
```
Add `useState` to the React import. (Home/Stats read `todayISO()` at render, so a re-render picks up the new day.)

- [ ] **Step 4: seed.ts — drop the template week**

In `src/seed.ts` remove the `DAYS` export and the `SEED_MEALS` (day-plan `MealsByDay`) export and their helper `S(...)` if now unused. Keep `SEED_FOODS`, `SEED_WEIGHTS`, `AI_PROMPT`. Grep for stragglers: `grep -rn "SEED_MEALS\b\|DAYS" src` must return no references outside `seed.ts` (Planner no longer imports `DAYS`).

- [ ] **Step 5: share.ts sanity**

`src/lib/share.ts` only reads `card.streak` off the passed `ShareCard`; no change needed. Confirm `Home.tsx`/`Stats.tsx` pass the computed `streak` into `openShare(...)` (they already build the card with the local `streak` variable, now computed).

- [ ] **Step 6: Typecheck — must be fully green now**

Run: `npx tsc -b --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/screens/Stats.tsx src/components/overlays/MealDetailSheet.tsx src/App.tsx src/seed.ts
git commit -m "feat: computed streak in stats, real-today meal-add, day rollover, seed cleanup"
```

---

## Task 12: Migration verification (in browser) + build

**Files:** none (verification)

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 2: Verify the persist migration with an old-format state**

Serve the build (`npm run preview`), open it, then inject a **v0** (old integer-keyed) state and reload to trigger `migrate`:
```js
localStorage.setItem('plately-v1', JSON.stringify({ state: { onboarded: true, seenIntro: true, name: 'Test', mealsByDay: { '1': { breakfast: [{foodId:'oats',grams:60}], lunch: [], dinner: [], snacks: [] } }, eaten: { '1': { breakfast: true } } }, version: 0 })); location.reload()
```
Then read back:
```js
(() => { const st = JSON.parse(localStorage.getItem('plately-v1')).state; const t = new Date().toISOString().slice(0,10); return JSON.stringify({ hasTodayKey: !!st.mealsByDay[t], noIntKey: !st.mealsByDay['1'], eatenToday: st.eaten[t]?.breakfast }); })()
```
Expected: `{"hasTodayKey":true,"noIntKey":true,"eatenToday":true}` — index 1 migrated onto today (note: preview uses UTC-vs-local only at the boundary; the local `todayISO` in the app is authoritative — verify the meal appears on Home's Today).

- [ ] **Step 3: Verify rollover, streak, calendar end-to-end**

On Home: confirm today's meals show. On Plan: strip shows real week, plan tomorrow, future check-off hidden. Log ≥80% of goal eaten today and confirm the streak chip reads ≥1; clear it and confirm it drops.

- [ ] **Step 4: Commit (no code — annotate only if fixes were needed)**

Only if Step 2/3 surfaced fixes, commit them with a clear message.

---

## Task 13: HANDOFF docs + staging deploy

**Files:**
- Modify: `HANDOFF.md`

- [ ] **Step 1: Document the date model in HANDOFF.md**

Replace the stale "Home is fixed to `TODAY = 1`" bullet with the real-date model: `mealsByDay`/`eaten` keyed by local `YYYY-MM-DD` (`src/lib/dates.ts`); Home reads `todayISO()`; Calendar navigates real weeks via `selDate`/`shiftWeek`; streak is computed (`src/lib/streak.ts`, 80% of goal); persist `version: 1` migrates old integer-keyed data; backup import remaps old backups.

- [ ] **Step 2: Commit**

```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF describes the real-date model, streak, migration"
```

- [ ] **Step 3: Deploy to staging + watch**

```bash
git push staging v2:main
RUN=$(gh run list --repo thyskotze/plately-staging --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN" --repo thyskotze/plately-staging --exit-status
```
Expected: green. Then verify on `https://thyskotze.github.io/plately-staging/` — including the migration path by injecting an old-format state under the `plately-staging` key.

---

## Self-review notes

- **Spec coverage:** dates (T1), streak (T2), types (T3), state/migration/backup (T4–7), Home (T8), Calendar (T9), Shopping (T10), Stats/MealDetail/rollover/seed (T11), verification (T12), docs/deploy (T13). All spec sections mapped.
- **Type consistency:** `ISODate` from `dates.ts`; `MealsByDay = Record<string, DayMeals>`; actions use `date: ISODate`; `computeStreak(foods, meals, mealsByDay, eaten, goalKcal, today)` signature identical across T2/T8/T11; `remapWeekKeys` shared by migrate + import.
- **No stored streak / selDay** anywhere after T4/T7 (partialize, PersistState, exportBackup all cleaned).
```
