import { useStore } from '../store'
import { ink } from '../tokens'
import { itemMetrics } from '../lib/calc'
import { todayISO, type ISODate } from '../lib/dates'
import { Utensils, Plus, Check, ChevronRight } from '../icons'

/**
 * The per-slot meal cards for a single day, shared by Home (today) and the
 * Calendar (any day). Check-off only shows when `showCheckoff` and the date is
 * today or in the past — you can't eat the future.
 */
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
        const items = (mealsByDay[date]?.[key] || []).map((it, idx) => ({
          ...itemMetrics(foods, meals, it),
          idx,
          auto: !!it.auto,
        }))
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
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: done ? '#2E9E5B' : '#fff',
                    border: done ? 'none' : '2px solid #CFE6D8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flex: 'none',
                  }}
                >
                  {done && <Check size={16} color="#fff" strokeWidth={3} />}
                </div>
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: '#FDF3E6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <Utensils />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px Figtree', color: '#1a1a17' }}>{label}</div>
                <div style={{ font: '500 11px Figtree', color: ink(0.45) }}>
                  {items.length ? items.map((i) => i.name).join(', ') : 'Tap + to add'}
                </div>
              </div>
              <div
                style={{
                  font: "700 13px 'Space Grotesk'",
                  color: done ? '#2E9E5B' : '#1a1a17',
                  marginRight: 8,
                }}
              >
                {items.length ? (
                  <>
                    {kc}
                    <span style={{ font: '500 9px Figtree', color: ink(0.4) }}> kcal</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div
                onClick={() => openPick(date, key)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#EAF5EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Plus color="#2E9E5B" />
              </div>
            </div>
            {items.map((it) => (
              <div
                key={it.idx}
                onClick={() => openEditItem(date, key, it.idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 9,
                  paddingLeft: 43,
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, font: '500 12px Figtree', color: ink(0.7) }}>
                  {it.name}
                  {it.auto && (
                    <span
                      title="Pre-filled from your usual foods — edit or remove if today is different"
                      style={{
                        marginLeft: 6,
                        padding: '1px 6px',
                        borderRadius: 99,
                        background: '#F3EFE6',
                        font: '600 9px Figtree',
                        color: ink(0.45),
                        verticalAlign: 1,
                      }}
                    >
                      usual
                    </span>
                  )}
                </div>
                <div style={{ font: '500 11px Figtree', color: ink(0.4) }}>
                  {it.isMeal ? (it.servings === 1 ? '1 serving' : `${it.servings} servings`) : `${it.grams}g`}
                </div>
                <div style={{ font: "600 11px 'Space Grotesk'", color: ink(0.55), width: 42, textAlign: 'right' }}>
                  {it.kcal}
                </div>
                <ChevronRight size={13} color="#C9C1B2" strokeWidth={2.4} />
              </div>
            ))}
            {hasItems && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 10,
                  paddingTop: 9,
                  borderTop: '1px solid #F1ECE1',
                }}
              >
                <div
                  onClick={() => saveSlotAsMeal(date, key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    font: '700 11px Figtree',
                    color: '#2E9E5B',
                  }}
                >
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
