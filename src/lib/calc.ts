import type {
  Food,
  Meal,
  Portion,
  DayMeals,
  MealsByDay,
  GoalsDraft,
  Category,
  SlotKey,
} from '../types'
import { CATEGORIES, isMealPortion } from '../types'
import { CAT_COLORS } from '../tokens'

/** All portions in a day, across every slot. */
const allPortions = (day: DayMeals | undefined): Portion[] =>
  day ? Object.values(day).flat() : []

export const round = (n: number) => Math.round(n)
export const fmt = (n: number) => Number(n).toLocaleString('en-US')
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v || 0))

/**
 * Parse a user-entered number that may use a comma decimal separator
 * (e.g. "100,8" → 100.8). Returns 0 for anything unparseable.
 */
export const toNum = (v: string | number): number => {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export const foodById = (foods: Food[], id: string) =>
  foods.find((f) => f.id === id)

export const mealById = (meals: Meal[], id: string) =>
  meals.find((m) => m.id === id)

export interface ItemMetrics {
  name: string
  isMeal: boolean
  /** grams for a food portion, undefined for a meal */
  grams?: number
  /** servings for a meal portion, undefined for a food */
  servings?: number
  kcal: number
  p: number
  c: number
  f: number
  cat?: Category
  /** true when the referenced food/meal no longer exists */
  missing?: boolean
}

export function itemMetrics(foods: Food[], meals: Meal[], it: Portion): ItemMetrics {
  if (isMealPortion(it)) {
    const m = mealById(meals, it.mealId)
    const s = it.servings
    if (!m) return { name: 'Removed meal', isMeal: true, servings: s, kcal: 0, p: 0, c: 0, f: 0, missing: true }
    return {
      name: m.name,
      isMeal: true,
      servings: s,
      kcal: round(m.kcal * s),
      p: m.p * s,
      c: m.c * s,
      f: m.f * s,
    }
  }
  const f = foodById(foods, it.foodId)
  const g = it.grams
  if (!f) return { name: 'Removed food', isMeal: false, grams: g, kcal: 0, p: 0, c: 0, f: 0, missing: true }
  return {
    name: f.name,
    isMeal: false,
    grams: g,
    kcal: round((f.kcal * g) / 100),
    p: (f.p * g) / 100,
    c: (f.c * g) / 100,
    f: (f.f * g) / 100,
    cat: f.cat,
  }
}

export interface DayTotals {
  kcal: number
  p: number
  c: number
  f: number
}

/** Totals for a single slot's portion list. */
export function portionsTotals(foods: Food[], meals: Meal[], portions: Portion[]): DayTotals {
  let k = 0,
    p = 0,
    c = 0,
    f = 0
  portions.forEach((it) => {
    const m = itemMetrics(foods, meals, it)
    k += m.kcal
    p += m.p
    c += m.c
    f += m.f
  })
  return { kcal: round(k), p: round(p), c: round(c), f: round(f) }
}

/** Totals across only the slots the user has marked as eaten. */
export function eatenTotals(
  foods: Food[],
  meals: Meal[],
  day: DayMeals | undefined,
  eaten: Partial<Record<SlotKey, boolean>> | undefined,
): DayTotals {
  let k = 0,
    p = 0,
    c = 0,
    f = 0
  Object.keys(day || {}).forEach((key) => {
    if (!eaten?.[key]) return
    ;(day?.[key] || []).forEach((it) => {
      const m = itemMetrics(foods, meals, it)
      k += m.kcal
      p += m.p
      c += m.c
      f += m.f
    })
  })
  return { kcal: round(k), p: round(p), c: round(c), f: round(f) }
}

export function dayTotals(foods: Food[], meals: Meal[], day: DayMeals | undefined): DayTotals {
  return portionsTotals(foods, meals, allPortions(day))
}

export const tag = (f: Food) => {
  const col = CAT_COLORS[f.cat] || '#7A8A80'
  return {
    tagColor: col,
    tagBg: col + '22',
    tagInitial: (f.name[0] || '?').toUpperCase(),
  }
}

export const macroLine = (f: Food) =>
  `${round(f.p)}P  ${round(f.c)}C  ${round(f.f)}F`

/**
 * TDEE via Mifflin–St Jeor. Unlike the prototype (which hard-coded male +5),
 * this honours the `sex` field: male +5, female −161. (README production fix.)
 */
export function suggestKcal(gl: GoalsDraft): number {
  const w = toNum(gl.weight)
  const h = toNum(gl.height)
  const a = toNum(gl.age)
  const sexConst = gl.sex === 'female' ? -161 : 5
  const bmr = 10 * w + 6.25 * h - 5 * a + sexConst
  const fac =
    { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[
      gl.activity
    ] || 1.55
  const adj = { cut: -450, maintain: 0, gain: 350 }[gl.goal] || 0
  return Math.round((bmr * fac + adj) / 10) * 10
}

/** Auto-suggested macro grams from weight (protein ~1.8 g/kg, fat ~0.9 g/kg). */
export function suggestMacros(kcal: number, weightKg: number) {
  const protein = Math.round(weightKg * 1.8)
  const fat = Math.round(weightKg * 0.9)
  const carbKcal = Math.max(0, kcal - protein * 4 - fat * 9)
  const carbs = Math.round(carbKcal / 4)
  return { protein, carbs, fat }
}

/**
 * Given a calorie goal + protein goal, work out carbs & fat automatically.
 * Fat is set to ~30% of total calories; carbs take the remainder.
 */
export function deriveMacros(kcal: number, protein: number): { carbs: number; fat: number } {
  const fat = Math.max(0, Math.round((kcal * 0.3) / 9))
  const carbsKcal = Math.max(0, kcal - protein * 4 - fat * 9)
  const carbs = Math.round(carbsKcal / 4)
  return { carbs, fat }
}

/** Aggregate grams per foodId across the given dates × all slots (food portions only). */
export function aggregateWeek(
  foods: Food[],
  mealsByDay: MealsByDay,
  dates: string[],
): Record<string, number> {
  const agg: Record<string, number> = {}
  dates.forEach((date) => {
    allPortions(mealsByDay[date]).forEach((it) => {
      if (isMealPortion(it)) return
      if (foodById(foods, it.foodId)) {
        agg[it.foodId] = (agg[it.foodId] || 0) + it.grams
      }
    })
  })
  return agg
}

/** Unique recipe-ingredient lines from every saved meal planned on the given dates. */
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

export const qtyLabel = (grams: number) =>
  grams >= 1000
    ? (grams / 1000).toFixed(1).replace(/\.0$/, '') + ' kg'
    : grams + ' g'

/** Sparkline geometry for the weight card (viewBox 280×72, preserveAspectRatio none). */
export function sparkline(kgs: number[]) {
  const n = kgs.length
  const min = Math.min(...kgs) - 0.4
  const max = Math.max(...kgs) + 0.4
  const rng = max - min || 1
  const xOf = (i: number) => (n > 1 ? 14 + i * (252 / (n - 1)) : 140)
  const yOf = (k: number) => 62 - ((k - min) / rng) * 48
  const line = kgs.map((k, i) => `${xOf(i).toFixed(1)},${yOf(k).toFixed(1)}`).join(' ')
  const area = `${line} ${xOf(n - 1).toFixed(1)},68 ${xOf(0).toFixed(1)},68`
  return {
    line,
    area,
    endX: xOf(n - 1).toFixed(1),
    endY: yOf(kgs[n - 1]).toFixed(1),
  }
}

/** Parse the AI bulk-import text. Rules ported verbatim from the prototype. */
export function parseAi(text: string): Food[] {
  const cats = CATEGORIES as readonly string[]
  const out: Food[] = []
  ;(text || '').split(/\n/).forEach((line) => {
    const t = line.trim()
    if (!t || t.charAt(0) === '#') return
    if (/^name\s*\|/i.test(t)) return
    const parts = t.split('|').map((x) => x.trim())
    let name: string
    let cat: string
    let nums: number[]
    if (parts.length >= 6) {
      name = parts[0]
      cat = parts[1]
      nums = parts.slice(2, 6).map(Number)
    } else if (parts.length === 5) {
      name = parts[0]
      cat = 'Other'
      nums = parts.slice(1, 5).map(Number)
    } else {
      return
    }
    if (!name || nums.some((n) => isNaN(n))) return
    if (!cats.includes(cat)) {
      const hit = cats.find((c) => c.toLowerCase() === String(cat).toLowerCase())
      cat = hit || 'Other'
    }
    out.push({
      id: 'ai' + Math.random().toString(36).slice(2, 8),
      name,
      cat: cat as Category,
      kcal: nums[0],
      p: nums[1],
      c: nums[2],
      f: nums[3],
    })
  })
  return out
}
