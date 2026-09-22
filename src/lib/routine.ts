// Routine detection: finds the foods/meals you log in the same meal slot most
// days (the morning coffee, the usual oats) so new days can start pre-filled.

import type { DayMeals, MealSlot, MealsByDay, Portion, SlotKey } from '../types'
import { isMealPortion } from '../types'
import { addDays, parseISO, type ISODate } from './dates'

export type RoutineDays = 'all' | 'weekdays' | 'weekends'

export interface RoutineItem {
  /** Stable id: `${slot}|f:${foodId}` or `${slot}|m:${mealId}`. */
  id: string
  slot: SlotKey
  portion: Portion
  days: RoutineDays
  /** Days it appeared in this slot / days with anything logged. */
  count: number
  of: number
}

const LOOKBACK = 28
const MIN_LOGGED_DAYS = 5
const MIN_COUNT = 3

const portionKey = (p: Portion) => (isMealPortion(p) ? `m:${p.mealId}` : `f:${p.foodId}`)
const isWeekend = (iso: ISODate) => {
  const d = parseISO(iso).getDay()
  return d === 0 || d === 6
}
/** Middle value — a typical amount that ignores the odd huge or tiny portion. */
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Look back 4 weeks (before today) and return the items logged in a given
 * slot on at least half of logged days (and at least 3 times). Items that
 * stick to weekdays or weekends are tagged so they're only filled on those.
 *
 * On days where the user ticks meals off, only ticked slots count — so a
 * pre-filled item that was never actually eaten doesn't reinforce itself.
 */
export function detectRoutine(
  mealsByDay: MealsByDay,
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>,
  mealSlots: MealSlot[],
  today: ISODate,
): RoutineItem[] {
  const slotKeys = new Set(mealSlots.map((m) => m.key))
  const days: { date: ISODate; weekend: boolean; slots: Record<SlotKey, Portion[]> }[] = []

  for (let i = 1; i <= LOOKBACK; i++) {
    const date = addDays(today, -i)
    const day = mealsByDay[date]
    if (!day) continue
    const ticks = eaten[date] || {}
    const usesTicks = Object.values(ticks).some(Boolean)
    const slots: Record<SlotKey, Portion[]> = {}
    let any = false
    Object.keys(day).forEach((k) => {
      if (!slotKeys.has(k)) return
      if (usesTicks && !ticks[k]) return
      if (day[k]?.length) {
        slots[k] = day[k]
        any = true
      }
    })
    if (any) days.push({ date, weekend: isWeekend(date), slots })
  }
  if (days.length < MIN_LOGGED_DAYS) return []

  const nWeekday = days.filter((d) => !d.weekend).length
  const nWeekend = days.length - nWeekday

  type Acc = { slot: SlotKey; sample: Portion; amounts: number[]; wd: number; we: number }
  const acc = new Map<string, Acc>()
  days.forEach((d) => {
    Object.entries(d.slots).forEach(([slot, portions]) => {
      const seen = new Set<string>()
      portions.forEach((p) => {
        const id = `${slot}|${portionKey(p)}`
        // Same item twice in one slot = one day, amounts summed.
        const a = acc.get(id) || { slot, sample: p, amounts: [], wd: 0, we: 0 }
        const amt = isMealPortion(p) ? p.servings : p.grams
        if (seen.has(id)) {
          a.amounts[a.amounts.length - 1] += amt
        } else {
          seen.add(id)
          a.amounts.push(amt)
          if (d.weekend) a.we++
          else a.wd++
        }
        acc.set(id, a)
      })
    })
  })

  const out: RoutineItem[] = []
  acc.forEach((a, id) => {
    const count = a.wd + a.we
    if (count < MIN_COUNT) return
    const wdRate = nWeekday ? a.wd / nWeekday : 0
    const weRate = nWeekend ? a.we / nWeekend : 0
    let days: RoutineDays | null = null
    if (count / (nWeekday + nWeekend) >= 0.5 && (nWeekend < 2 || weRate >= 0.3) && (nWeekday < 2 || wdRate >= 0.3)) {
      days = 'all'
    } else if (nWeekday >= 3 && wdRate >= 0.6 && (nWeekend < 2 || weRate < 0.3)) {
      days = 'weekdays'
    } else if (nWeekend >= 2 && weRate >= 0.6 && wdRate < 0.3) {
      days = 'weekends'
    }
    if (!days) return
    const amt = median(a.amounts)
    const portion: Portion = isMealPortion(a.sample)
      ? { mealId: a.sample.mealId, servings: Math.max(0.5, Math.round(amt * 2) / 2) }
      : { foodId: a.sample.foodId, grams: Math.round(amt) }
    const of = days === 'weekdays' ? nWeekday : days === 'weekends' ? nWeekend : nWeekday + nWeekend
    const hits = days === 'weekdays' ? a.wd : days === 'weekends' ? a.we : count
    out.push({ id, slot: a.slot, portion, days, count: hits, of })
  })

  // Keep the user's slot order, most frequent first within a slot.
  const order = new Map(mealSlots.map((m, i) => [m.key, i]))
  return out.sort(
    (x, y) => (order.get(x.slot)! - order.get(y.slot)!) || y.count / y.of - x.count / x.of,
  )
}

/** Routine items that apply on `date` (weekday/weekend) and aren't switched off. */
export function routineForDate(items: RoutineItem[], date: ISODate, off: string[]): RoutineItem[] {
  const we = isWeekend(date)
  return items.filter(
    (it) => !off.includes(it.id) && (it.days === 'all' || (it.days === 'weekends') === we),
  )
}

/**
 * Add routine items to a day — only into slots that are still empty, so a
 * meal the user has already started is never touched. Items are tagged
 * `auto` so the UI can label them as pre-filled.
 */
export function fillDay(day: DayMeals | undefined, items: RoutineItem[]): { day: DayMeals; added: number } {
  const out: DayMeals = { ...(day || {}) }
  let added = 0
  const emptyAtStart = new Set(items.map((i) => i.slot).filter((s) => !(day?.[s]?.length)))
  items.forEach((it) => {
    if (!emptyAtStart.has(it.slot)) return
    out[it.slot] = [...(out[it.slot] || []), { ...it.portion, auto: true }]
    added++
  })
  return { day: out, added }
}
