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

export type SlotKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export const SLOTS: { key: SlotKey; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks' },
]

/** A food, macros expressed per 100 g (or per 100 ml for liquids). */
export interface Food {
  id: string
  name: string
  cat: Category
  kcal: number
  p: number
  c: number
  f: number
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
}

/** A logged portion — either grams of a library food, or servings of a saved meal. */
export type FoodPortion = { foodId: string; grams: number }
export type MealPortion = { mealId: string; servings: number }
export type Portion = FoodPortion | MealPortion

export const isMealPortion = (p: Portion): p is MealPortion =>
  (p as MealPortion).mealId !== undefined

export type DayMeals = Record<SlotKey, Portion[]>

/** mealsByDay is keyed 0..6 (Mon..Sun). */
export type MealsByDay = Record<number, DayMeals>

export interface Goals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface WeightEntry {
  label: string
  kg: number
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

/** Draft state for the Goals (TDEE) sheet. */
export interface GoalsDraft {
  weight: string
  height: string
  age: string
  sex: Sex
  activity: Activity
  goal: GoalDir
  p: string
  c: string
  f: string
}
