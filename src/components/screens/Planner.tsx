import { useStore } from '../../store'
import { ink } from '../../tokens'
import { fmt, dayTotals, itemMetrics } from '../../lib/calc'
import { DAYS } from '../../seed'
import { Cart, Plus, ChevronRight } from '../../icons'

export default function Planner() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealSlots = useStore((s) => s.mealSlots)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const selDay = useStore((s) => s.selDay)
  const goals = useStore((s) => s.goals)
  const nav = useStore((s) => s.nav)
  const openPick = useStore((s) => s.openPick)
  const openEditItem = useStore((s) => s.openEditItem)
  const selectDay = useStore((s) => s.selectDay)
  const openSlots = useStore((s) => s.openSlots)

  return (
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <div style={{ font: "700 22px 'Bricolage Grotesque'", color: '#1a1a17' }}>
          This week
        </div>
        <div
          onClick={() => nav('shopping')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#2E9E5B',
            borderRadius: 999,
            padding: '8px 13px',
            cursor: 'pointer',
          }}
        >
          <Cart />
          <span style={{ font: '700 11.5px Figtree', color: '#fff' }}>Shopping</span>
        </div>
      </div>

      <div
        className="noscroll"
        style={{
          display: 'flex',
          gap: 7,
          overflowX: 'auto',
          margin: '0 -22px 16px',
          padding: '2px 22px 4px',
        }}
      >
        {DAYS.map((d) => {
          const tot = dayTotals(foods, meals, mealsByDay[d.i])
          const on = d.i === selDay
          return (
            <div
              key={d.i}
              onClick={() => selectDay(d.i)}
              style={{
                flex: 'none',
                width: 52,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 0',
                borderRadius: 16,
                cursor: 'pointer',
                ...(on
                  ? { background: '#2E9E5B', color: '#fff' }
                  : { background: '#fff', border: '1px solid #EFE9DD', color: '#1a1a17' }),
              }}
            >
              <div style={{ font: '600 10.5px Figtree', opacity: 0.7 }}>{d.dow}</div>
              <div style={{ font: "700 17px 'Space Grotesk'", margin: '2px 0 6px' }}>
                {d.date}
              </div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: on ? '#fff' : tot.kcal > 0 ? '#2E9E5B' : '#DDD5C6',
                }}
              />
              <div style={{ font: "600 9px 'Space Grotesk'", marginTop: 5, opacity: 0.75 }}>
                {tot.kcal}
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <div style={{ font: "700 15px 'Bricolage Grotesque'", color: '#1a1a17' }}>
          {DAYS[selDay].full}
        </div>
        <div style={{ font: "600 12px 'Space Grotesk'", color: ink(0.5) }}>
          {fmt(dayTotals(foods, meals, mealsByDay[selDay]).kcal)} / {fmt(goals.kcal)} kcal
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mealSlots.map(({ key, label }) => {
          const items = (mealsByDay[selDay]?.[key] || []).map((it, idx) => ({
            ...itemMetrics(foods, meals, it),
            idx,
          }))
          const kc = items.reduce((a, b) => a + b.kcal, 0)
          return (
            <div
              key={key}
              style={{
                background: '#fff',
                border: '1px solid #EFE9DD',
                borderRadius: 16,
                padding: '11px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, font: '600 13px Figtree', color: '#1a1a17' }}>
                  {label}
                </div>
                <div style={{ font: "600 11px 'Space Grotesk'", color: ink(0.45) }}>
                  {items.length ? `${kc} kcal` : '—'}
                </div>
                <div
                  onClick={() => openPick(selDay, key)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: '#EAF5EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} color="#2E9E5B" />
                </div>
              </div>
              {items.map((it) => (
                <div
                  key={it.idx}
                  onClick={() => openEditItem(selDay, key, it.idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E9E5B' }}
                  />
                  <div style={{ flex: 1, font: '500 12px Figtree', color: ink(0.7) }}>
                    {it.name}
                  </div>
                  <div style={{ font: '500 11px Figtree', color: ink(0.4) }}>
                    {it.isMeal
                      ? it.servings === 1
                        ? '1 serving'
                        : `${it.servings} servings`
                      : `${it.grams}g`}
                  </div>
                  <ChevronRight size={12} color="#C9C1B2" strokeWidth={2.4} />
                </div>
              ))}
            </div>
          )
        })}

        <div
          onClick={openSlots}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '11px 14px',
            borderRadius: 16,
            border: '1px dashed #D8D0C0',
            font: '600 12px Figtree',
            color: ink(0.5),
            cursor: 'pointer',
          }}
        >
          <Plus size={14} color={ink(0.5)} />
          Add or edit meals
        </div>
      </div>
    </div>
  )
}
