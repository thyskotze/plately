// "Work it out for me": turns body stats + a goal into a calorie window and
// macro targets, and — when there's enough history — checks the formula
// against what the user's own logs and weigh-ins say they actually burn.

import type { Activity, Food, GoalDir, Meal, MealsByDay, Pace, Sex, SlotKey, WeightEntry } from '../types'
import { eatenTotals } from './calc'
import { addDays, parseISO, type ISODate } from './dates'

export const LOSE_KG_PER_WEEK: Record<Pace, number> = { gentle: 0.25, steady: 0.5, fast: 0.75 }
export const GAIN_KG_PER_WEEK: Record<Pace, number> = { gentle: 0.15, steady: 0.25, fast: 0.4 }
export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}
/** Energy in 1 kg of body weight change (the usual 7700 kcal rule). */
const KCAL_PER_KG = 7700

export interface TargetInput {
  weight: number
  height: number
  age: number
  sex: Sex
  activity: Activity
  goal: GoalDir
  pace: Pace
  /** Optional goal weight — only used for the "weeks to goal" estimate. */
  goalWeight?: number
  /** When set, replaces the formula's burn with the one measured from logs. */
  measuredTdee?: number | null
}

export interface TargetPlan {
  bmr: number
  tdee: number
  tdeeSource: 'formula' | 'logs'
  /** kcal/day below (−) or above (+) the burn. */
  dailyAdj: number
  kcal: number
  kcalMin: number
  kcalMax: number
  protein: number
  carbs: number
  fat: number
  fibre: number
  waterL: number
  /** Weight the protein target is based on (adjusted for higher body fat). */
  proteinWeight: number
  proteinPerKg: number
  /** Expected change per week, kg (negative = loss). */
  weeklyKg: number
  weeksToGoal: number | null
  /** The deficit was reduced to keep calories at a safe minimum. */
  floored: boolean
  floorKcal: number
}

const r10 = (n: number) => Math.round(n / 10) * 10
const r5 = (n: number) => Math.round(n / 5) * 5

export function bmrOf(weight: number, height: number, age: number, sex: Sex): number {
  return 10 * weight + 6.25 * height - 5 * age + (sex === 'female' ? -161 : 5)
}

/**
 * Protein is scaled to an "adjusted" body weight: above a BMI of 25, only 40%
 * of the extra weight counts — muscle needs don't grow with body fat. This is
 * the standard dietitian adjustment and keeps targets realistic for heavier
 * people (e.g. 100 kg / 185 cm → ~91 kg).
 */
export function proteinWeightOf(weight: number, height: number): number {
  const m = height / 100
  const ref = 25 * m * m
  if (!height || weight <= ref) return weight
  return ref + 0.4 * (weight - ref)
}

export function computeTargets(i: TargetInput): TargetPlan {
  const bmr = bmrOf(i.weight, i.height, i.age, i.sex)
  const formulaTdee = bmr * (ACTIVITY_FACTOR[i.activity] ?? 1.55)
  const tdee = i.measuredTdee && i.measuredTdee > 0 ? i.measuredTdee : formulaTdee

  let dailyAdj = 0
  if (i.goal === 'cut') {
    dailyAdj = -(LOSE_KG_PER_WEEK[i.pace] * KCAL_PER_KG) / 7
    // Never cut more than 25% of what you burn.
    dailyAdj = Math.max(dailyAdj, -0.25 * tdee)
  } else if (i.goal === 'gain') {
    dailyAdj = (GAIN_KG_PER_WEEK[i.pace] * KCAL_PER_KG) / 7
  }

  // Safety floor: not below your resting burn, nor the usual 1500/1200 minimum.
  const floorKcal = r10(Math.max(bmr, i.sex === 'female' ? 1200 : 1500))
  let kcal = r10(tdee + dailyAdj)
  let floored = false
  if (kcal < floorKcal) {
    kcal = floorKcal
    floored = true
    dailyAdj = kcal - tdee
  }

  const proteinPerKg = i.goal === 'maintain' ? 1.6 : 1.8
  const proteinWeight = proteinWeightOf(i.weight, i.height)
  const protein = r5(proteinWeight * proteinPerKg)
  // Fat ~30% of calories (never under 0.6 g/kg); carbs get what's left.
  const fat = Math.round(Math.max((kcal * 0.3) / 9, 0.6 * proteinWeight))
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))

  const weeklyKg = (dailyAdj * 7) / KCAL_PER_KG
  let weeksToGoal: number | null = null
  if (i.goalWeight && Math.abs(weeklyKg) > 0.01) {
    const diff = i.goalWeight - i.weight
    if (Math.sign(diff) === Math.sign(weeklyKg) && Math.abs(diff) >= 0.5) {
      weeksToGoal = Math.ceil(diff / weeklyKg)
    }
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    tdeeSource: i.measuredTdee ? 'logs' : 'formula',
    dailyAdj: Math.round(dailyAdj),
    kcal,
    kcalMin: kcal - 100,
    kcalMax: kcal + 100,
    protein,
    carbs,
    fat,
    fibre: Math.round((kcal / 1000) * 14),
    waterL: Math.round(i.weight * 0.033 * 10) / 10,
    proteinWeight: Math.round(proteinWeight),
    proteinPerKg,
    weeklyKg: Math.round(weeklyKg * 100) / 100,
    weeksToGoal,
    floored,
    floorKcal,
  }
}

/** The latest weigh-in, with its date when it has one. */
export function latestWeighIn(weights: WeightEntry[]): WeightEntry | null {
  return weights.length ? weights[weights.length - 1] : null
}

export interface MeasuredBurn {
  /** kcal/day the user actually burns, from intake vs weight change. */
  tdee: number
  /** Average logged intake over the window. */
  avgIntake: number
  /** Measured weight trend, kg per week (negative = losing). */
  kgPerWeek: number
  loggedDays: number
  spanDays: number
}

/**
 * Estimate real daily burn from the last ~5 weeks: average eaten calories,
 * corrected by the weight trend (a least-squares line through dated weigh-ins).
 * Returns null unless there's enough to trust — at least 10 logged days, and
 * weigh-ins spanning 14+ days — and the answer lands in a sane range.
 */
export function measureBurn(
  foods: Food[],
  meals: Meal[],
  mealsByDay: MealsByDay,
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>,
  weights: WeightEntry[],
  bmr: number,
  today: ISODate,
): MeasuredBurn | null {
  const start = addDays(today, -35)
  const dated = weights.filter((w) => w.date && w.date >= start && w.date <= today) as Required<WeightEntry>[]
  if (dated.length < 2) return null
  const t0 = parseISO(dated[0].date).getTime()
  const pts = dated.map((w) => ({ x: (parseISO(w.date).getTime() - t0) / 864e5, y: w.kg }))
  const spanDays = Math.round(pts[pts.length - 1].x - pts[0].x)
  if (spanDays < 14) return null

  const mx = pts.reduce((a, p) => a + p.x, 0) / pts.length
  const my = pts.reduce((a, p) => a + p.y, 0) / pts.length
  const sxx = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  if (!sxx) return null
  const slope = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / sxx // kg/day

  // Intake: only days inside the weigh-in span that were properly logged.
  // Half-logged days (under 800 kcal ticked) would make the burn look too low.
  const first = dated[0].date
  const last = dated[dated.length - 1].date
  const intakes: number[] = []
  for (let d = first; d <= last && d < today; d = addDays(d, 1)) {
    const k = eatenTotals(foods, meals, mealsByDay[d], eaten[d]).kcal
    if (k >= 800) intakes.push(k)
  }
  if (intakes.length < 10 || intakes.length < spanDays * 0.6) return null
  const avgIntake = intakes.reduce((a, b) => a + b, 0) / intakes.length

  const tdee = avgIntake - slope * KCAL_PER_KG
  if (tdee < bmr || tdee > bmr * 2.3) return null
  return {
    tdee: Math.round(tdee / 10) * 10,
    avgIntake: Math.round(avgIntake),
    kgPerWeek: Math.round(slope * 7 * 100) / 100,
    loggedDays: intakes.length,
    spanDays,
  }
}
