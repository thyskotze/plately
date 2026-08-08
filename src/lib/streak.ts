import type { Food, Meal, MealsByDay, SlotKey, Goals } from '../types'
import { eatenTotals, scoreDay } from './calc'
import { addDays, type ISODate } from './dates'

const MAX_LOOKBACK = 400

/**
 * Consecutive days (up to today) that landed inside the calorie window.
 *
 * Going *over* the window breaks the streak just like falling short — the goal
 * is staying in range, not eating as much as possible. Today counts as
 * "in progress": if you haven't reached the window yet it doesn't break the
 * streak, but exceeding the max does, immediately.
 */
export function computeStreak(
  foods: Food[],
  meals: Meal[],
  mealsByDay: MealsByDay,
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>,
  goals: Goals,
  today: ISODate,
): number {
  if (!goals || !goals.kcal || goals.kcal <= 0) return 0

  const scoreFor = (date: ISODate) =>
    scoreDay(eatenTotals(foods, meals, mealsByDay[date], eaten[date]), goals)

  const todayScore = scoreFor(today)
  // Still eating today: don't count it yet, but don't let it break the run
  // either — unless you've already gone over, which can't be undone.
  if (todayScore.over) return 0

  let cursor = todayScore.onTarget ? today : addDays(today, -1)
  let streak = 0
  for (let i = 0; i < MAX_LOOKBACK; i++) {
    if (!scoreFor(cursor).onTarget) break
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
