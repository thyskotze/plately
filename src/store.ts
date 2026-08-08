import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Food,
  Meal,
  Portion,
  MealsByDay,
  DayMeals,
  Goals,
  WeightEntry,
  GoalsDraft,
  Bio,
  Sex,
  Activity,
  GoalDir,
  SlotKey,
  MealSlot,
  Category,
  MealItem,
} from './types'
import { isMealPortion, DEFAULT_SLOTS } from './types'
import { SEED_FOODS } from './seed'
import { SEED_MEALS_LIB } from './seedMeals'
import { EXTRA_FOODS } from './seedFoodsExtra'
import {
  suggestKcal,
  suggestMacros,
  deriveMacros,
  toNum,
  frequentPortions,
  kcalWindow,
} from './lib/calc'
import { isUpdateAvailable } from './lib/update'
import { todayISO, addDays, remapWeekKeys, type ISODate } from './lib/dates'
import type { ShareCard } from './lib/share'

export type Screen = 'home' | 'plan' | 'shopping' | 'stats' | 'library'
export type Overlay =
  | 'none'
  | 'pick'
  | 'grams'
  | 'newfood'
  | 'aiimport'
  | 'goals'
  | 'info'
  | 'profile'
  | 'share'
  | 'mealamount'
  | 'mealdetail'
  | 'cnfsearch'
  | 'barcode'
  | 'mealbuilder'
  | 'slots'
  | 'help'

export interface NewFoodDraft {
  name: string
  cat: Category
  kcal: string
  p: string
  c: string
  f: string
}

export interface InfoContent {
  title: string
  body: string
}

/** The persisted, serialisable slice — this shape is also the backup JSON. */
export interface PersistState {
  /** The user's display name (empty until onboarding). */
  name: string
  /** Whether first-run setup has been completed. */
  onboarded: boolean
  /** Body stats + goal direction. */
  bio: Bio
  foods: Food[]
  /** Saved meals / recipes library. */
  meals: Meal[]
  /** User-configurable meal slots (Breakfast, Coffee, Snack 2, …). */
  mealSlots: MealSlot[]
  mealsByDay: MealsByDay
  goals: Goals
  weights: WeightEntry[]
  weightGoal: number
  level: number
  xp: number
  xpMax: number
  shopChecked: Record<string, boolean>
  /** Which meal slots the user has ticked as eaten, per date. */
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>
  seenIntro: boolean
}

interface EphemeralState {
  screen: Screen
  overlay: Overlay
  // pick / grams
  pickDate: ISODate
  pickSlot: SlotKey
  pickSearch: string
  pickTab: 'foods' | 'meals'
  chosenId: string | null
  gVal: number
  // meal amount / detail
  chosenMealId: string | null
  mVal: number
  // library
  search: string
  // new food
  nf: NewFoodDraft
  // goals draft
  gl: GoalsDraft | null
  // ai import
  aiStep: 'prompt' | 'paste'
  aiText: string
  // editing an existing logged portion (null = adding a new one)
  editRef: { date: ISODate; slot: SlotKey; idx: number } | null
  // calendar selected day (Planner)
  selDate: ISODate
  // barcode scan was started from "add to a meal", so finish at the portion step
  barcodeToSlot: boolean
  // editing an existing library food (null = creating a new one)
  editFoodId: string | null
  // editing an existing built meal (null = building a new one)
  editMealId: string | null
  // pre-fill for the meal builder when saving a logged day-slot as a new meal
  builderSeed: { name: string; section: 'breakfast' | 'lunch' | 'dinner'; items: MealItem[] } | null
  // input for weight
  wInput: string
  // info modal
  info: InfoContent | null
  // achievement share card being previewed
  shareData: ShareCard | null
  // toast
  toast: string
  toastKey: number
  // a newer build is live (see lib/update.ts)
  updateAvailable: boolean
  // user dismissed the update banner this session
  updateDismissed: boolean
}

export interface AppState extends PersistState, EphemeralState {
  // navigation
  nav: (s: Screen) => void
  closeOverlay: () => void
  // onboarding
  completeOnboarding: (data: {
    name: string
    weight: number
    height: number
    age: number
    sex: Sex
    activity: Activity
    goalDir: GoalDir
  }) => void
  // profile
  openProfile: () => void
  openHelp: () => void
  // achievement sharing
  openShare: (card: ShareCard) => void
  // goals
  openGoals: () => void
  setGl: (k: keyof GoalsDraft, v: string) => void
  saveGoals: () => void
  // picking / logging
  openPick: (date: ISODate, slot: SlotKey) => void
  openQuick: () => void
  setPickSearch: (v: string) => void
  setPickTab: (tab: 'foods' | 'meals') => void
  chooseFood: (id: string) => void
  gStep: (d: number) => void
  gSet: (v: number) => void
  confirmGrams: () => void
  removeItem: (date: ISODate, slot: SlotKey, idx: number) => void
  openEditItem: (date: ISODate, slot: SlotKey, idx: number) => void
  deleteEditItem: () => void
  // saved meals
  chooseMeal: (id: string) => void
  mStep: (d: number) => void
  mSet: (v: number) => void
  confirmMeal: () => void
  openMealDetail: (id: string) => void
  addMeal: (date: ISODate, slot: SlotKey, mealId: string, servings: number) => void
  // build-a-meal
  openMealBuilder: () => void
  addBuiltMeal: (meal: Meal) => void
  openEditMeal: (id: string) => void
  updateBuiltMeal: (id: string, meal: Meal) => void
  deleteMeal: (id: string) => void
  /** Turn the foods already logged in a day-slot into a new reusable meal. */
  saveSlotAsMeal: (date: ISODate, slot: SlotKey) => void
  // planner
  selectDate: (date: ISODate) => void
  shiftWeek: (dir: -1 | 1) => void
  // shopping
  toggleShop: (id: string) => void
  // meal check-off
  toggleEaten: (date: ISODate, slot: SlotKey) => void
  // meal-slot configuration
  openSlots: () => void
  addSlot: (label: string) => void
  renameSlot: (key: SlotKey, label: string) => void
  removeSlot: (key: SlotKey) => void
  moveSlot: (key: SlotKey, dir: -1 | 1) => void
  // library / new food
  setSearch: (v: string) => void
  openNewFood: () => void
  openEditFood: (id: string) => void
  setNf: (k: keyof NewFoodDraft, v: string) => void
  saveNewFood: () => void
  deleteFood: () => void
  // info stubs
  openInfo: (kind: 'barcode' | 'usda') => void
  // CNF (Canadian Nutrient File) live search
  openCnfSearch: () => void
  addImportedFood: (food: Food) => void
  // barcode scanning
  /** `toSlot` = scanning while adding to a meal: jump to the portion step after. */
  openBarcodeScan: (toSlot?: boolean) => void
  // ai import
  openAiImport: () => void
  aiNext: () => void
  aiBack: () => void
  setAiText: (v: string) => void
  /** Commit an AI import: new foods to add, plus updates to existing foods. */
  aiConfirm: (adds: Food[], replacements?: { existingId: string; food: Food }[]) => void
  copyAiPrompt: (text: string) => void
  // stats
  setWInput: (v: string) => void
  addWeight: () => void
  // toast + intro
  showToast: (msg: string) => void
  dismissIntro: () => void
  reopenIntro: () => void
  // app updates
  checkForUpdate: () => Promise<boolean>
  dismissUpdate: () => void
  // backup
  exportBackup: () => void
  exportLibrary: () => void
  importBackup: (raw: string, mode: 'merge' | 'replace') => { ok: boolean; msg: string }
}

const initialPersist: PersistState = {
  name: '',
  onboarded: false,
  bio: { weight: 70, height: 170, age: 30, sex: 'male', activity: 'moderate', goalDir: 'maintain' },
  foods: [...SEED_FOODS, ...EXTRA_FOODS],
  meals: SEED_MEALS_LIB,
  mealSlots: DEFAULT_SLOTS,
  mealsByDay: {},
  goals: { kcal: 2000, protein: 140, carbs: 200, fat: 65 },
  weights: [],
  weightGoal: 0,
  level: 1,
  xp: 0,
  xpMax: 500,
  shopChecked: {},
  eaten: {},
  seenIntro: false,
}

const initialEphemeral: EphemeralState = {
  screen: 'home',
  overlay: 'none',
  pickDate: todayISO(),
  selDate: todayISO(),
  barcodeToSlot: false,
  pickSlot: 'snacks',
  pickSearch: '',
  pickTab: 'foods',
  chosenId: null,
  gVal: 100,
  chosenMealId: null,
  mVal: 1,
  search: '',
  nf: { name: '', cat: 'Pantry', kcal: '', p: '', c: '', f: '' },
  gl: null,
  aiStep: 'prompt',
  aiText: '',
  editRef: null,
  editFoodId: null,
  editMealId: null,
  builderSeed: null,
  wInput: '',
  info: null,
  shareData: null,
  toast: '',
  toastKey: 0,
  updateAvailable: false,
  updateDismissed: false,
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

const INFO_MAP: Record<'barcode' | 'usda', InfoContent> = {
  barcode: {
    title: 'Barcode scanning',
    body: 'In the live app this opens your camera and looks the product up in Open Food Facts — 4M+ packaged products, no login. This build shows where it lives.',
  },
  usda: {
    title: 'USDA search',
    body: 'Searches USDA FoodData Central for accurate whole-food macros (chicken, rice, avocado…) and drops them straight into your library.',
  },
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialPersist,
      ...initialEphemeral,

      nav: (s) => set({ screen: s, overlay: 'none' }),
      closeOverlay: () =>
        set({
          overlay: 'none',
          info: null,
          editRef: null,
          editFoodId: null,
          editMealId: null,
          builderSeed: null,
          shareData: null,
          barcodeToSlot: false,
        }),

      openProfile: () => set({ overlay: 'profile' }),
      openHelp: () => set({ overlay: 'help' }),
      openShare: (card) => set({ overlay: 'share', shareData: card }),

      completeOnboarding: (data) => {
        const gl: GoalsDraft = {
          weight: String(data.weight),
          height: String(data.height),
          age: String(data.age),
          sex: data.sex,
          activity: data.activity,
          goal: data.goalDir,
          kcalMin: '',
          kcalMax: '',
          p: '',
        }
        const kcal = suggestKcal(gl)
        const protein = suggestMacros(kcal, data.weight).protein
        const { carbs, fat } = deriveMacros(kcal, protein)
        set({
          name: data.name.trim(),
          bio: {
            weight: data.weight,
            height: data.height,
            age: data.age,
            sex: data.sex,
            activity: data.activity,
            goalDir: data.goalDir,
          },
          // Start with a sensible ±100 kcal window around the suggestion.
          goals: { kcal, kcalMin: kcal - 100, kcalMax: kcal + 100, protein, carbs, fat },
          weights: [{ label: 'Start', kg: data.weight }],
          weightGoal: Math.round(data.weight),
          onboarded: true,
          seenIntro: true,
        })
      },

      openGoals: () => {
        const st = get()
        const b = st.bio
        set({
          overlay: 'goals',
          gl: {
            weight: String(b.weight),
            height: String(b.height),
            age: String(b.age),
            sex: b.sex,
            activity: b.activity,
            goal: b.goalDir,
            kcalMin: String(kcalWindow(st.goals).min),
            kcalMax: String(kcalWindow(st.goals).max),
            p: String(st.goals.protein),
          },
        })
      },
      setGl: (k, v) =>
        set((s) => (s.gl ? { gl: { ...s.gl, [k]: v } } : {})),
      saveGoals: () => {
        const gl = get().gl
        if (!gl) return
        // Accept a range; tolerate one side being blank or the pair reversed.
        const suggestion = suggestKcal(gl)
        let lo = toNum(gl.kcalMin)
        let hi = toNum(gl.kcalMax)
        if (!lo && !hi) {
          lo = suggestion - 100
          hi = suggestion + 100
        } else if (!lo) lo = hi
        else if (!hi) hi = lo
        if (lo > hi) [lo, hi] = [hi, lo]
        const goalKcal = Math.round((lo + hi) / 2)
        const goalProtein = toNum(gl.p)
        const derived = deriveMacros(goalKcal, goalProtein)
        set({
          goals: {
            kcal: goalKcal,
            kcalMin: lo,
            kcalMax: hi,
            protein: goalProtein,
            carbs: derived.carbs,
            fat: derived.fat,
          },
          bio: {
            weight: toNum(gl.weight),
            height: toNum(gl.height),
            age: toNum(gl.age),
            sex: gl.sex,
            activity: gl.activity,
            goalDir: gl.goal,
          },
          overlay: 'none',
        })
        get().showToast('Goals updated')
      },

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
      setPickSearch: (v) => set({ pickSearch: v }),
      setPickTab: (tab) => set({ pickTab: tab }),
      chooseFood: (id) => {
        // Start at the food's usual portion when it has one (a scanned pack
        // size, an AI-suggested serving, or the amount you keep logging).
        const s = get()
        const food = s.foods.find((f) => f.id === id)
        const used = frequentPortions(s.mealsByDay, id, 1)[0]
        const gVal = food?.servings?.[0]?.grams ?? used?.grams ?? 100
        set({ overlay: 'grams', chosenId: id, gVal, editRef: null })
      },
      gStep: (d) => set((s) => ({ gVal: Math.max(0, s.gVal + d) })),
      gSet: (v) => set({ gVal: v }),
      confirmGrams: () => {
        const s = get()
        if (!s.chosenId) return
        const mb: MealsByDay = { ...s.mealsByDay }

        // Edit mode: update the grams of an existing portion in place.
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

        // Add mode: append a new portion and award XP.
        const day = { ...(mb[s.pickDate] || {}) } as MealsByDay[string]
        day[s.pickSlot] = [
          ...(day[s.pickSlot] || []),
          { foodId: s.chosenId, grams: s.gVal },
        ]
        mb[s.pickDate] = day
        const food = s.foods.find((f) => f.id === s.chosenId)
        set({
          mealsByDay: mb,
          overlay: 'none',
          xp: Math.min(s.xpMax, s.xp + 15),
        })
        s.showToast(`${food?.name ?? 'Food'} logged  +15 XP`)
      },
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
          set({
            overlay: 'mealamount',
            chosenMealId: portion.mealId,
            mVal: portion.servings,
            editRef: { date, slot, idx },
          })
        } else {
          set({
            overlay: 'grams',
            chosenId: portion.foodId,
            gVal: portion.grams,
            editRef: { date, slot, idx },
          })
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

      chooseMeal: (id) =>
        set({ overlay: 'mealamount', chosenMealId: id, mVal: 1, editRef: null }),
      mStep: (d) => set((s) => ({ mVal: Math.max(0.5, Math.round((s.mVal + d) * 2) / 2) })),
      mSet: (v) => set({ mVal: v }),
      confirmMeal: () => {
        const s = get()
        if (!s.chosenMealId) return
        const mb: MealsByDay = { ...s.mealsByDay }

        if (s.editRef) {
          const { date, slot, idx } = s.editRef
          const d = { ...(mb[date] || {}) } as MealsByDay[string]
          const arr = [...(d[slot] || [])]
          if (arr[idx]) arr[idx] = { mealId: s.chosenMealId, servings: s.mVal }
          d[slot] = arr
          mb[date] = d
          set({ mealsByDay: mb, overlay: 'none', editRef: null })
          s.showToast('Servings updated')
          return
        }

        const day = { ...(mb[s.pickDate] || {}) } as MealsByDay[string]
        day[s.pickSlot] = [...(day[s.pickSlot] || []), { mealId: s.chosenMealId, servings: s.mVal }]
        mb[s.pickDate] = day
        const meal = s.meals.find((m) => m.id === s.chosenMealId)
        set({ mealsByDay: mb, overlay: 'none', xp: Math.min(s.xpMax, s.xp + 15) })
        s.showToast(`${meal?.name ?? 'Meal'} added  +15 XP`)
      },
      openMealBuilder: () => set({ overlay: 'mealbuilder', editMealId: null, builderSeed: null }),
      addBuiltMeal: (meal) => {
        const s = get()
        set({ meals: [meal, ...s.meals], overlay: 'none', builderSeed: null })
        s.showToast(`${meal.name} saved to meals`)
      },
      openEditMeal: (id) => set({ overlay: 'mealbuilder', editMealId: id, builderSeed: null }),
      updateBuiltMeal: (id, meal) => {
        const s = get()
        set({
          meals: s.meals.map((m) => (m.id === id ? { ...meal, id } : m)),
          overlay: 'none',
          editMealId: null,
        })
        s.showToast(`${meal.name} updated`)
      },
      saveSlotAsMeal: (date, slot) => {
        const s = get()
        const portions = s.mealsByDay[date]?.[slot] || []
        // Collapse the slot's logged portions into a food→grams list. Food
        // portions map directly; saved-meal portions expand via their items
        // (grams × servings). Seed meals without items can't be expanded.
        const byFood = new Map<string, number>()
        portions.forEach((p) => {
          if (isMealPortion(p)) {
            const meal = s.meals.find((m) => m.id === p.mealId)
            meal?.items?.forEach((it) =>
              byFood.set(it.foodId, (byFood.get(it.foodId) || 0) + it.grams * p.servings),
            )
          } else {
            byFood.set(p.foodId, (byFood.get(p.foodId) || 0) + p.grams)
          }
        })
        const items: MealItem[] = Array.from(byFood, ([foodId, grams]) => ({
          foodId,
          grams: Math.round(grams * 10) / 10,
        }))
        if (!items.length) {
          s.showToast('Add some foods to this meal first')
          return
        }
        const label = s.mealSlots.find((m) => m.key === slot)?.label || 'Meal'
        const l = label.toLowerCase()
        const section: 'breakfast' | 'lunch' | 'dinner' = l.includes('break')
          ? 'breakfast'
          : l.includes('din')
            ? 'dinner'
            : 'lunch'
        set({ overlay: 'mealbuilder', editMealId: null, builderSeed: { name: label, section, items } })
      },
      deleteMeal: (id) => {
        const s = get()
        // Purge any logged portions that reference this meal so no day/shopping
        // view points at a missing meal (mirrors deleteFood).
        const keep = (p: Portion) => !isMealPortion(p) || p.mealId !== id
        const mb: MealsByDay = {}
        Object.keys(s.mealsByDay).forEach((date) => {
          const d = s.mealsByDay[date]
          const nd: MealsByDay[string] = {}
          Object.keys(d).forEach((k) => {
            nd[k] = d[k].filter(keep)
          })
          mb[date] = nd
        })
        set({
          meals: s.meals.filter((m) => m.id !== id),
          mealsByDay: mb,
          overlay: 'none',
          editMealId: null,
          chosenMealId: null,
        })
        s.showToast('Meal deleted')
      },
      openMealDetail: (id) => set({ overlay: 'mealdetail', chosenMealId: id }),
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

      selectDate: (date) => set({ selDate: date }),
      shiftWeek: (dir) => set((s) => ({ selDate: addDays(s.selDate, 7 * dir) })),
      toggleShop: (id) =>
        set((s) => ({ shopChecked: { ...s.shopChecked, [id]: !s.shopChecked[id] } })),
      toggleEaten: (date, slot) =>
        set((s) => {
          const forDay = { ...(s.eaten[date] || {}) }
          forDay[slot] = !forDay[slot]
          return { eaten: { ...s.eaten, [date]: forDay } }
        }),

      openSlots: () => set({ overlay: 'slots' }),
      addSlot: (label) => {
        const name = label.trim()
        if (!name) return
        set((s) => ({ mealSlots: [...s.mealSlots, { key: 'slot' + Date.now(), label: name }] }))
      },
      renameSlot: (key, label) => {
        const name = label.trim()
        if (!name) return
        set((s) => ({
          mealSlots: s.mealSlots.map((m) => (m.key === key ? { ...m, label: name } : m)),
        }))
      },
      removeSlot: (key) =>
        set((s) => {
          if (s.mealSlots.length <= 1) return {} // keep at least one slot
          // Drop the slot and its logged portions / eaten flags across all days.
          const mb: MealsByDay = {}
          Object.keys(s.mealsByDay).forEach((date) => {
            const d = s.mealsByDay[date]
            const nd: MealsByDay[string] = {}
            Object.keys(d).forEach((k) => {
              if (k !== key) nd[k] = d[k]
            })
            mb[date] = nd
          })
          const eaten: typeof s.eaten = {}
          Object.keys(s.eaten).forEach((date) => {
            const forDay = { ...s.eaten[date] }
            delete forDay[key]
            eaten[date] = forDay
          })
          return { mealSlots: s.mealSlots.filter((m) => m.key !== key), mealsByDay: mb, eaten }
        }),
      moveSlot: (key, dir) =>
        set((s) => {
          const arr = [...s.mealSlots]
          const i = arr.findIndex((m) => m.key === key)
          const j = i + dir
          if (i < 0 || j < 0 || j >= arr.length) return {}
          ;[arr[i], arr[j]] = [arr[j], arr[i]]
          return { mealSlots: arr }
        }),

      setSearch: (v) => set({ search: v }),
      openNewFood: () =>
        set({
          overlay: 'newfood',
          editFoodId: null,
          nf: { name: '', cat: 'Pantry', kcal: '', p: '', c: '', f: '' },
        }),
      openEditFood: (id) => {
        const s = get()
        const f = s.foods.find((x) => x.id === id)
        if (!f) return
        set({
          overlay: 'newfood',
          editFoodId: id,
          nf: {
            name: f.name,
            cat: f.cat,
            kcal: String(f.kcal),
            p: String(f.p),
            c: String(f.c),
            f: String(f.f),
          },
        })
      },
      setNf: (k, v) => set((s) => ({ nf: { ...s.nf, [k]: v } })),
      saveNewFood: () => {
        const s = get()
        const n = s.nf
        if (!n.name.trim()) return
        const fields = {
          name: n.name.trim(),
          cat: n.cat,
          kcal: toNum(n.kcal),
          p: toNum(n.p),
          c: toNum(n.c),
          f: toNum(n.f),
        }

        // Edit mode: update the existing food in place.
        if (s.editFoodId) {
          const id = s.editFoodId
          set({
            foods: s.foods.map((f) => (f.id === id ? { ...f, ...fields } : f)),
            overlay: 'none',
            editFoodId: null,
          })
          s.showToast(`${fields.name} updated`)
          return
        }

        const f: Food = { id: 'c' + Date.now(), ...fields }
        set({ foods: [f, ...s.foods], overlay: 'none' })
        s.showToast(`${f.name} added to library`)
      },
      deleteFood: () => {
        const s = get()
        const id = s.editFoodId
        if (!id) return
        // Also purge any logged portions that reference this food so the
        // meal/shopping views never point at a missing food.
        const keep = (p: Portion) => isMealPortion(p) || p.foodId !== id
        const mb: MealsByDay = {}
        Object.keys(s.mealsByDay).forEach((date) => {
          const d = s.mealsByDay[date]
          const nd: MealsByDay[string] = {}
          Object.keys(d).forEach((k) => {
            nd[k] = d[k].filter(keep)
          })
          mb[date] = nd
        })
        const shopChecked = { ...s.shopChecked }
        delete shopChecked[id]
        set({
          foods: s.foods.filter((f) => f.id !== id),
          mealsByDay: mb,
          shopChecked,
          overlay: 'none',
          editFoodId: null,
        })
        s.showToast('Food deleted')
      },

      openInfo: (kind) => set({ overlay: 'info', info: INFO_MAP[kind] }),

      openCnfSearch: () => set({ overlay: 'cnfsearch' }),
      openBarcodeScan: (toSlot = false) => set({ overlay: 'barcode', barcodeToSlot: toSlot }),
      addImportedFood: (food) => {
        const s = get()
        // Dedupe by id so re-adding the same CNF food doesn't pile up.
        const foods = [food, ...s.foods.filter((f) => f.id !== food.id)]
        set({ foods })
        s.showToast(`${food.name} added to library`)
      },

      openAiImport: () => set({ overlay: 'aiimport', aiStep: 'prompt', aiText: '' }),
      aiNext: () => set({ aiStep: 'paste' }),
      aiBack: () => set({ aiStep: 'prompt' }),
      setAiText: (v) => set({ aiText: v }),
      aiConfirm: (adds, replacements = []) => {
        if (!adds.length && !replacements.length) return
        const s = get()
        // Replacements keep the existing food's id so anything already logged
        // against it stays intact — only the name/category/macros are updated.
        const repById = new Map(replacements.map((r) => [r.existingId, r.food]))
        const foods = s.foods.map((f) => {
          const r = repById.get(f.id)
          return r ? { ...f, name: r.name, cat: r.cat, kcal: r.kcal, p: r.p, c: r.c, f: r.f } : f
        })
        set({ foods: [...adds, ...foods], overlay: 'none' })
        const bits: string[] = []
        if (adds.length) bits.push(`${adds.length} added`)
        if (replacements.length) bits.push(`${replacements.length} updated`)
        s.showToast(bits.join(' · '))
      },
      copyAiPrompt: (text) => {
        try {
          navigator.clipboard.writeText(text)
        } catch {
          /* clipboard unavailable */
        }
        get().showToast('Prompt copied to clipboard')
      },

      setWInput: (v) => set({ wInput: v }),
      addWeight: () => {
        const s = get()
        const v = toNum(s.wInput)
        if (!v) return
        set({ weights: [...s.weights, { label: 'Today', kg: v }], wInput: '' })
        s.showToast('Weight logged')
      },

      showToast: (msg) => {
        set((s) => ({ toast: msg, toastKey: s.toastKey + 1 }))
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => set({ toast: '' }), 1800)
      },
      dismissIntro: () => set({ seenIntro: true }),
      reopenIntro: () => set({ seenIntro: false }),

      checkForUpdate: async () => {
        const isNew = await isUpdateAvailable()
        // Only surface the banner if the user hasn't dismissed it this session.
        if (isNew && !get().updateDismissed) set({ updateAvailable: true })
        return isNew
      },
      dismissUpdate: () => set({ updateAvailable: false, updateDismissed: true }),

      exportBackup: () => {
        const s = get()
        const backup: PersistState = {
          name: s.name,
          onboarded: s.onboarded,
          bio: s.bio,
          foods: s.foods,
          meals: s.meals,
          mealSlots: s.mealSlots,
          mealsByDay: s.mealsByDay,
          goals: s.goals,
          weights: s.weights,
          weightGoal: s.weightGoal,
          level: s.level,
          xp: s.xp,
          xpMax: s.xpMax,
          shopChecked: s.shopChecked,
          eaten: s.eaten,
          seenIntro: s.seenIntro,
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const d = new Date().toISOString().slice(0, 10)
        a.href = url
        a.download = `plately-backup-${d}.json`
        a.click()
        URL.revokeObjectURL(url)
        s.showToast('Backup downloaded')
      },
      exportLibrary: () => {
        const s = get()
        // A shareable slice: the food library plus the user's own built meals.
        // Excludes bundled recipes (they carry a `source`) and all personal
        // data. Importable via Import backup → Merge (foods/meals de-dupe by id).
        const shared = {
          plately: 'library' as const,
          exportedAt: new Date().toISOString(),
          foods: s.foods,
          meals: s.meals.filter((m) => !m.source),
        }
        const blob = new Blob([JSON.stringify(shared, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const d = new Date().toISOString().slice(0, 10)
        a.href = url
        a.download = `plately-library-${d}.json`
        a.click()
        URL.revokeObjectURL(url)
        s.showToast('Library file downloaded')
      },
      importBackup: (raw, mode) => {
        let data: Partial<PersistState>
        try {
          data = JSON.parse(raw)
        } catch {
          return { ok: false, msg: "That file isn't a valid backup" }
        }
        if (!data || !Array.isArray(data.foods)) {
          return { ok: false, msg: "That file isn't a Plately backup" }
        }
        // Old (v1) backups keyed days 0..6; remap to real dates anchored to today.
        const looksOld =
          !!data.mealsByDay && Object.keys(data.mealsByDay).some((k) => /^\d+$/.test(k))
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
        if (mode === 'replace') {
          set({ ...initialPersist, ...data })
        } else {
          const s = get()
          const byId = new Map(s.foods.map((f) => [f.id, f]))
          ;(data.foods || []).forEach((f) => byId.set(f.id, f))
          const mealById = new Map(s.meals.map((m) => [m.id, m]))
          ;(data.meals || []).forEach((m) => mealById.set(m.id, m))
          set({
            foods: Array.from(byId.values()),
            meals: Array.from(mealById.values()),
            mealsByDay: data.mealsByDay ?? s.mealsByDay,
            eaten: data.eaten ?? s.eaten,
            weights: data.weights ?? s.weights,
            goals: data.goals ?? s.goals,
          })
        }
        get().showToast(mode === 'replace' ? 'Data replaced' : 'Backup merged in')
        return { ok: true, msg: 'Imported' }
      },
    }),
    {
      // Live: 'plately-v1'. Staging builds get an isolated key (see vite.config.ts)
      // so testing never touches real users' data, even on the same origin.
      name: __STORAGE_KEY__,
      version: 1,
      // v0 → v1: integer-keyed template week → real date keys (anchored to today),
      // drop the now-computed streak and the removed selDay.
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
      // Only persist the data slice; UI/ephemeral state is not saved.
      partialize: (s): PersistState => ({
        name: s.name,
        onboarded: s.onboarded,
        bio: s.bio,
        foods: s.foods,
        meals: s.meals,
        mealSlots: s.mealSlots,
        mealsByDay: s.mealsByDay,
        goals: s.goals,
        weights: s.weights,
        weightGoal: s.weightGoal,
        level: s.level,
        xp: s.xp,
        xpMax: s.xpMax,
        shopChecked: s.shopChecked,
        eaten: s.eaten,
        seenIntro: s.seenIntro,
      }),
    },
  ),
)
