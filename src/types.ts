export const CATEGORIES = [
  'Produce',
  'Meat & Fish',
  'Dairy & Eggs',
  'Bakery',
  'Pantry',
  'Frozen',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

/** A meal slot key — the 4 defaults use stable ids; custom slots get generated ids. */
export type SlotKey = string

export interface MealSlot {
  key: SlotKey
  label: string
}

/** The starting meal slots; users can add / rename / remove / reorder these. */
export const DEFAULT_SLOTS: MealSlot[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
]

/** A named portion of a food, e.g. { label: 'Bottle', grams: 250 }. */
export interface Serving {
  label: string
  grams: number
}

/** A food, macros expressed per 100 g (or per 100 ml for liquids). */
export interface Food {
  id: string
  name: string
  cat: Category
  kcal: number
  p: number
  c: number
  f: number
  /**
   * Typical portions for this food — from an AI import or a scanned product's
   * label. Offered as one-tap presets when logging. Optional everywhere.
   */
  servings?: Serving[]
}

/** A saved meal / recipe with per-serving macros. */
export interface Meal {
  id: string
  name: string
  /** Which meal slot this recipe is grouped under. */
  section: 'breakfast' | 'lunch' | 'dinner'
  kcal: number
  p: number
  c: number
  f: number
  fibre?: number
  ingredients: string[]
  method: string[]
  source?: string
  /**
   * The library foods + grams this meal was built from. Present on user-built
   * meals (via the meal builder); enables re-editing with live macro recalc.
   * Absent on hand-authored seed recipes (Vicky's), which stay view-only.
   */
  items?: MealItem[]
}

/** One structured component of a built meal: a library food at a given weight. */
export interface MealItem {
  foodId: string
  grams: number
}

/** A logged portion — either grams of a library food, or servings of a saved meal. */
export type FoodPortion = { foodId: string; grams: number }
export type MealPortion = { mealId: string; servings: number }
export type Portion = FoodPortion | MealPortion

export const isMealPortion = (p: Portion): p is MealPortion =>
  (p as MealPortion).mealId !== undefined

export type DayMeals = Record<SlotKey, Portion[]>

/** mealsByDay is keyed by local date string "YYYY-MM-DD". */
export type MealsByDay = Record<string, DayMeals>

export interface Goals {
  /** The mid-point target — drives the ring and the derived carb/fat split. */
  kcal: number
  /**
   * The calorie window a day should land in, e.g. a dietitian's "2300–2500".
   * Optional: older goals without a range fall back to a band around `kcal`
   * (see `kcalWindow`). Eating over the max counts against you, not for you.
   */
  kcalMin?: number
  kcalMax?: number
  protein: number
  carbs: number
  fat: number
}

export interface WeightEntry {
  label: string
  kg: number
  /**
   * Local date the weight was logged. Older entries predate this field (they
   * were all labelled "Today"), so it's optional and anything dated-by-period
   * — like the coach report's trend — only uses entries that have it.
   */
  date?: string
}

export type Sex = 'male' | 'female'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active'
export type GoalDir = 'cut' | 'maintain' | 'gain'

/** The user's stored body stats + goal direction (drives TDEE + prefills Goals). */
export interface Bio {
  weight: number
  height: number
  age: number
  sex: Sex
  activity: Activity
  goalDir: GoalDir
}

/** Draft state for the Goals (TDEE) sheet. Targets tracked: calories + protein. */
export interface GoalsDraft {
  weight: string
  height: string
  age: string
  sex: Sex
  activity: Activity
  goal: GoalDir
  /** editable calorie window (defaults to the TDEE suggestion ±100) */
  kcalMin: string
  kcalMax: string
  /** editable protein goal in grams */
  p: string
}
