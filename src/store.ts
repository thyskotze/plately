import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Food,
  Meal,
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
  Category,
} from './types'
import { isMealPortion } from './types'
import { SEED_FOODS } from './seed'
import { SEED_MEALS_LIB } from './seedMeals'
import { EXTRA_FOODS } from './seedFoodsExtra'
import { suggestKcal, suggestMacros, deriveMacros, toNum } from './lib/calc'
import type { ShareCard } from './lib/share'

const emptyWeek = (): MealsByDay => {
  const w: MealsByDay = {}
  for (let i = 0; i < 7; i++) {
    w[i] = { breakfast: [], lunch: [], dinner: [], snacks: [] } as DayMeals
  }
  return w
}

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
  mealsByDay: MealsByDay
  goals: Goals
  weights: WeightEntry[]
  weightGoal: number
  streak: number
  level: number
  xp: number
  xpMax: number
  shopChecked: Record<string, boolean>
  /** Which meal slots the user has ticked as eaten, per day index. */
  eaten: Record<number, Partial<Record<SlotKey, boolean>>>
  selDay: number
  seenIntro: boolean
}

interface EphemeralState {
  screen: Screen
  overlay: Overlay
  // pick / grams
  pickDay: number
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
  editRef: { day: number; slot: SlotKey; idx: number } | null
  // editing an existing library food (null = creating a new one)
  editFoodId: string | null
  // input for weight
  wInput: string
  // info modal
  info: InfoContent | null
  // achievement share card being previewed
  shareData: ShareCard | null
  // toast
  toast: string
  toastKey: number
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
  // achievement sharing
  openShare: (card: ShareCard) => void
  // goals
  openGoals: () => void
  setGl: (k: keyof GoalsDraft, v: string) => void
  saveGoals: () => void
  // picking / logging
  openPick: (day: number, slot: SlotKey) => void
  openQuick: () => void
  setPickSearch: (v: string) => void
  setPickTab: (tab: 'foods' | 'meals') => void
  chooseFood: (id: string) => void
  gStep: (d: number) => void
  gSet: (v: number) => void
  confirmGrams: () => void
  removeItem: (day: number, slot: SlotKey, idx: number) => void
  openEditItem: (day: number, slot: SlotKey, idx: number) => void
  deleteEditItem: () => void
  // saved meals
  chooseMeal: (id: string) => void
  mStep: (d: number) => void
  mSet: (v: number) => void
  confirmMeal: () => void
  openMealDetail: (id: string) => void
  addMeal: (day: number, slot: SlotKey, mealId: string, servings: number) => void
  // build-a-meal
  openMealBuilder: () => void
  addBuiltMeal: (meal: Meal) => void
  // planner
  selectDay: (i: number) => void
  // shopping
  toggleShop: (id: string) => void
  // meal check-off
  toggleEaten: (day: number, slot: SlotKey) => void
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
  openBarcodeScan: () => void
  // ai import
  openAiImport: () => void
  aiNext: () => void
  aiBack: () => void
  setAiText: (v: string) => void
  aiConfirm: (parsed: Food[]) => void
  copyAiPrompt: (text: string) => void
  // stats
  setWInput: (v: string) => void
  addWeight: () => void
  // toast + intro
  showToast: (msg: string) => void
  dismissIntro: () => void
  reopenIntro: () => void
  // backup
  exportBackup: () => void
  importBackup: (raw: string, mode: 'merge' | 'replace') => { ok: boolean; msg: string }
}

const initialPersist: PersistState = {
  name: '',
  onboarded: false,
  bio: { weight: 70, height: 170, age: 30, sex: 'male', activity: 'moderate', goalDir: 'maintain' },
  foods: [...SEED_FOODS, ...EXTRA_FOODS],
  meals: SEED_MEALS_LIB,
  mealsByDay: emptyWeek(),
  goals: { kcal: 2000, protein: 140, carbs: 200, fat: 65 },
  weights: [],
  weightGoal: 0,
  streak: 0,
  level: 1,
  xp: 0,
  xpMax: 500,
  shopChecked: {},
  eaten: {},
  selDay: 1,
  seenIntro: false,
}

const initialEphemeral: EphemeralState = {
  screen: 'home',
  overlay: 'none',
  pickDay: 1,
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
  wInput: '',
  info: null,
  shareData: null,
  toast: '',
  toastKey: 0,
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
        set({ overlay: 'none', info: null, editRef: null, editFoodId: null, shareData: null }),

      openProfile: () => set({ overlay: 'profile' }),
      openShare: (card) => set({ overlay: 'share', shareData: card }),

      completeOnboarding: (data) => {
        const gl: GoalsDraft = {
          weight: String(data.weight),
          height: String(data.height),
          age: String(data.age),
          sex: data.sex,
          activity: data.activity,
          goal: data.goalDir,
          kcal: '',
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
          goals: { kcal, protein, carbs, fat },
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
            kcal: String(st.goals.kcal),
            p: String(st.goals.protein),
          },
        })
      },
      setGl: (k, v) =>
        set((s) => (s.gl ? { gl: { ...s.gl, [k]: v } } : {})),
      saveGoals: () => {
        const gl = get().gl
        if (!gl) return
        const goalKcal = toNum(gl.kcal) || suggestKcal(gl)
        const goalProtein = toNum(gl.p)
        const derived = deriveMacros(goalKcal, goalProtein)
        set({
          goals: {
            kcal: goalKcal,
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

      openPick: (day, slot) =>
        set({ overlay: 'pick', pickDay: day, pickSlot: slot, pickSearch: '', pickTab: 'foods' }),
      openQuick: () =>
        set({ overlay: 'pick', pickDay: 1, pickSlot: 'snacks', pickSearch: '', pickTab: 'foods' }),
      setPickSearch: (v) => set({ pickSearch: v }),
      setPickTab: (tab) => set({ pickTab: tab }),
      chooseFood: (id) =>
        set({ overlay: 'grams', chosenId: id, gVal: 100, editRef: null }),
      gStep: (d) => set((s) => ({ gVal: Math.max(0, s.gVal + d) })),
      gSet: (v) => set({ gVal: v }),
      confirmGrams: () => {
        const s = get()
        if (!s.chosenId) return
        const mb: MealsByDay = { ...s.mealsByDay }

        // Edit mode: update the grams of an existing portion in place.
        if (s.editRef) {
          const { day, slot, idx } = s.editRef
          const d = { ...(mb[day] || {}) } as MealsByDay[number]
          const arr = [...(d[slot] || [])]
          if (arr[idx]) arr[idx] = { ...arr[idx], grams: s.gVal }
          d[slot] = arr
          mb[day] = d
          set({ mealsByDay: mb, overlay: 'none', editRef: null })
          s.showToast('Portion updated')
          return
        }

        // Add mode: append a new portion and award XP.
        const day = { ...(mb[s.pickDay] || {}) } as MealsByDay[number]
        day[s.pickSlot] = [
          ...(day[s.pickSlot] || []),
          { foodId: s.chosenId, grams: s.gVal },
        ]
        mb[s.pickDay] = day
        const food = s.foods.find((f) => f.id === s.chosenId)
        set({
          mealsByDay: mb,
          overlay: 'none',
          xp: Math.min(s.xpMax, s.xp + 15),
        })
        s.showToast(`${food?.name ?? 'Food'} logged  +15 XP`)
      },
      removeItem: (day, slot, idx) =>
        set((s) => {
          const mb: MealsByDay = { ...s.mealsByDay }
          const d = { ...(mb[day] || {}) } as MealsByDay[number]
          const arr = [...(d[slot] || [])]
          arr.splice(idx, 1)
          d[slot] = arr
          mb[day] = d
          return { mealsByDay: mb }
        }),
      openEditItem: (day, slot, idx) => {
        const s = get()
        const portion = s.mealsByDay[day]?.[slot]?.[idx]
        if (!portion) return
        if (isMealPortion(portion)) {
          set({
            overlay: 'mealamount',
            chosenMealId: portion.mealId,
            mVal: portion.servings,
            editRef: { day, slot, idx },
          })
        } else {
          set({
            overlay: 'grams',
            chosenId: portion.foodId,
            gVal: portion.grams,
            editRef: { day, slot, idx },
          })
        }
      },
      deleteEditItem: () => {
        const s = get()
        if (!s.editRef) return
        const { day, slot, idx } = s.editRef
        s.removeItem(day, slot, idx)
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
          const { day, slot, idx } = s.editRef
          const d = { ...(mb[day] || {}) } as MealsByDay[number]
          const arr = [...(d[slot] || [])]
          if (arr[idx]) arr[idx] = { mealId: s.chosenMealId, servings: s.mVal }
          d[slot] = arr
          mb[day] = d
          set({ mealsByDay: mb, overlay: 'none', editRef: null })
          s.showToast('Servings updated')
          return
        }

        const day = { ...(mb[s.pickDay] || {}) } as MealsByDay[number]
        day[s.pickSlot] = [...(day[s.pickSlot] || []), { mealId: s.chosenMealId, servings: s.mVal }]
        mb[s.pickDay] = day
        const meal = s.meals.find((m) => m.id === s.chosenMealId)
        set({ mealsByDay: mb, overlay: 'none', xp: Math.min(s.xpMax, s.xp + 15) })
        s.showToast(`${meal?.name ?? 'Meal'} added  +15 XP`)
      },
      openMealBuilder: () => set({ overlay: 'mealbuilder' }),
      addBuiltMeal: (meal) => {
        const s = get()
        set({ meals: [meal, ...s.meals], overlay: 'none' })
        s.showToast(`${meal.name} saved to meals`)
      },
      openMealDetail: (id) => set({ overlay: 'mealdetail', chosenMealId: id }),
      addMeal: (day, slot, mealId, servings) => {
        const s = get()
        const mb: MealsByDay = { ...s.mealsByDay }
        const d = { ...(mb[day] || {}) } as MealsByDay[number]
        d[slot] = [...(d[slot] || []), { mealId, servings }]
        mb[day] = d
        const meal = s.meals.find((m) => m.id === mealId)
        set({ mealsByDay: mb, overlay: 'none', xp: Math.min(s.xpMax, s.xp + 15) })
        s.showToast(`${meal?.name ?? 'Meal'} added  +15 XP`)
      },

      selectDay: (i) => set({ selDay: i }),
      toggleShop: (id) =>
        set((s) => ({ shopChecked: { ...s.shopChecked, [id]: !s.shopChecked[id] } })),
      toggleEaten: (day, slot) =>
        set((s) => {
          const forDay = { ...(s.eaten[day] || {}) }
          forDay[slot] = !forDay[slot]
          return { eaten: { ...s.eaten, [day]: forDay } }
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
        const keep = (p: (typeof s.mealsByDay)[number]['breakfast'][number]) =>
          isMealPortion(p) || p.foodId !== id
        const mb: MealsByDay = {}
        for (let i = 0; i < 7; i++) {
          const d = s.mealsByDay[i]
          if (!d) continue
          mb[i] = {
            breakfast: d.breakfast.filter(keep),
            lunch: d.lunch.filter(keep),
            dinner: d.dinner.filter(keep),
            snacks: d.snacks.filter(keep),
          }
        }
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
      openBarcodeScan: () => set({ overlay: 'barcode' }),
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
      aiConfirm: (parsed) => {
        if (!parsed.length) return
        set((s) => ({ foods: [...parsed, ...s.foods], overlay: 'none' }))
        get().showToast(`Added ${parsed.length} foods to library`)
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

      exportBackup: () => {
        const s = get()
        const backup: PersistState = {
          name: s.name,
          onboarded: s.onboarded,
          bio: s.bio,
          foods: s.foods,
          meals: s.meals,
          mealsByDay: s.mealsByDay,
          goals: s.goals,
          weights: s.weights,
          weightGoal: s.weightGoal,
          streak: s.streak,
          level: s.level,
          xp: s.xp,
          xpMax: s.xpMax,
          shopChecked: s.shopChecked,
          eaten: s.eaten,
          selDay: s.selDay,
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
            weights: data.weights ?? s.weights,
            goals: data.goals ?? s.goals,
          })
        }
        get().showToast(mode === 'replace' ? 'Data replaced' : 'Backup merged in')
        return { ok: true, msg: 'Imported' }
      },
    }),
    {
      name: 'plately-v1',
      // Only persist the data slice; UI/ephemeral state is not saved.
      partialize: (s): PersistState => ({
        name: s.name,
        onboarded: s.onboarded,
        bio: s.bio,
        foods: s.foods,
        meals: s.meals,
        mealsByDay: s.mealsByDay,
        goals: s.goals,
        weights: s.weights,
        weightGoal: s.weightGoal,
        streak: s.streak,
        level: s.level,
        xp: s.xp,
        xpMax: s.xpMax,
        shopChecked: s.shopChecked,
        eaten: s.eaten,
        selDay: s.selDay,
        seenIntro: s.seenIntro,
      }),
    },
  ),
)
