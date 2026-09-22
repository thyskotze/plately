import { useStore } from '../../store'
import { itemMetrics } from '../../lib/calc'
import { detectRoutine } from '../../lib/routine'
import { addDays, todayISO } from '../../lib/dates'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { Toggle } from './CalcSheet'

/** "Your usual foods": what Plately learned you eat most days, and pre-fill settings. */
export default function RoutineSheet() {
  const show = useStore((s) => s.overlay === 'routine')
  const close = useStore((s) => s.closeOverlay)
  const routine = useStore((s) => s.routine)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const mealSlots = useStore((s) => s.mealSlots)
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const setRoutineEnabled = useStore((s) => s.setRoutineEnabled)
  const toggleRoutineItem = useStore((s) => s.toggleRoutineItem)
  const prefillDay = useStore((s) => s.prefillDay)
  const showToast = useStore((s) => s.showToast)

  if (!show) return null

  const today = todayISO()
  const items = detectRoutine(mealsByDay, eaten, mealSlots, today).filter(
    (it) => !itemMetrics(foods, meals, it.portion).missing,
  )
  const bySlot = mealSlots
    .map((s) => ({ ...s, items: items.filter((i) => i.slot === s.key) }))
    .filter((s) => s.items.length)

  const fillNow = () => {
    const n = prefillDay(today, { force: true, quiet: true }) + prefillDay(addDays(today, 1), { force: true, quiet: true })
    showToast(n ? `Added ${n} usual item${n === 1 ? '' : 's'} to today & tomorrow` : 'Nothing to add — those meals already have food')
  }

  return (
    <Sheet zIndex={60} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Your usual foods</div>
          <div style={{ font: '500 11.5px/1.45 Figtree', color: ink(0.5), marginBottom: 14, maxWidth: 240 }}>
            What you log in the same meal most days, learned from your last 4 weeks.
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div
        onClick={() => setRoutineEnabled(!routine.enabled)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#fff',
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 14,
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 13px Figtree', color: COLORS.ink }}>Pre-fill new days</div>
          <div style={{ font: '500 11px/1.4 Figtree', color: ink(0.55) }}>
            Today and any day you open in the Calendar start with these. Empty meals only — nothing you've
            added is changed. Still tick them off when eaten.
          </div>
        </div>
        <Toggle on={routine.enabled} />
      </div>

      {!bySlot.length ? (
        <div
          style={{
            background: COLORS.appBg,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 14,
            padding: 14,
            font: '500 12px/1.5 Figtree',
            color: ink(0.6),
            marginBottom: 14,
          }}
        >
          Nothing yet. Keep logging for about a week — anything you have in the same meal on at least half your
          days (like a morning coffee) will show up here.
        </div>
      ) : (
        bySlot.map((s) => (
          <div key={s.key} style={{ marginBottom: 12 }}>
            <div style={{ font: '700 12px Figtree', color: ink(0.55), marginBottom: 6 }}>{s.label}</div>
            <div
              style={{ background: '#fff', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}
            >
              {s.items.map((it, i) => {
                const m = itemMetrics(foods, meals, it.portion)
                const on = !routine.off.includes(it.id)
                return (
                  <div
                    key={it.id}
                    onClick={() => toggleRoutineItem(it.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 14px',
                      borderTop: i ? `1px solid ${COLORS.hairline}` : 'none',
                      cursor: 'pointer',
                      opacity: on ? 1 : 0.5,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ font: '600 12.5px Figtree', color: COLORS.ink }}>{m.name}</div>
                      <div style={{ font: '500 10.5px Figtree', color: ink(0.5) }}>
                        {m.isMeal ? `${m.servings} serving${m.servings === 1 ? '' : 's'}` : `${m.grams} g`} ·{' '}
                        {m.kcal} kcal · {it.count} of {it.of}{' '}
                        {it.days === 'weekdays' ? 'weekdays' : it.days === 'weekends' ? 'weekend days' : 'days'}
                      </div>
                    </div>
                    <Toggle on={on} />
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {bySlot.length > 0 && (
        <div
          onClick={fillNow}
          style={{
            textAlign: 'center',
            padding: 13,
            borderRadius: 14,
            background: COLORS.greenTint,
            border: `1px solid ${COLORS.green}`,
            font: '700 12.5px Figtree',
            color: COLORS.green,
            cursor: 'pointer',
            marginBottom: 6,
          }}
        >
          Fill today & tomorrow now
        </div>
      )}
      <div style={{ font: '500 10.5px/1.45 Figtree', color: ink(0.45), textAlign: 'center', marginTop: 6 }}>
        Pre-filled items show a <b>usual</b> tag. Tap one to change the amount, or remove it if today's different.
      </div>
    </Sheet>
  )
}
