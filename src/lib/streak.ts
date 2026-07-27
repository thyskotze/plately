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
