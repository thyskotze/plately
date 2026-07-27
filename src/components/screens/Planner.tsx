import { useStore } from '../../store'
import { ink } from '../../tokens'
import { fmt, dayTotals } from '../../lib/calc'
import { weekDates, startOfWeek, weekdayShort, dayOfMonth, relativeLabel, todayISO } from '../../lib/dates'
import DaySlots from '../DaySlots'
import { Cart, ChevronLeft, ChevronRight } from '../../icons'

export default function Planner() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const selDate = useStore((s) => s.selDate)
  const goals = useStore((s) => s.goals)
  const nav = useStore((s) => s.nav)
  const selectDate = useStore((s) => s.selectDate)
  const shiftWeek = useStore((s) => s.shiftWeek)
  const openSlots = useStore((s) => s.openSlots)

  const today = todayISO()
  const week = weekDates(startOfWeek(selDate))
  const dayKcal = fmt(dayTotals(foods, meals, mealsByDay[selDate]).kcal)
  const weekLabel = week.includes(today)
    ? 'This week'
    : `${weekdayShort(week[0])} ${dayOfMonth(week[0])} – ${dayOfMonth(week[6])}`

  return (
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ font: "700 22px 'Bricolage Grotesque'", color: '#1a1a17' }}>Plan</div>
        <div
          onClick={() => nav('shopping')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2E9E5B', borderRadius: 999, padding: '8px 13px', cursor: 'pointer' }}
        >
          <Cart />
          <span style={{ font: '700 11.5px Figtree', color: '#fff' }}>Shopping</span>
        </div>
      </div>

      {/* week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div onClick={() => shiftWeek(-1)} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}>
          <ChevronLeft />
        </div>
        <div style={{ font: '700 12px Figtree', color: ink(0.6) }}>{weekLabel}</div>
        <div onClick={() => shiftWeek(1)} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}>
          <ChevronRight />
        </div>
      </div>

      {/* day strip */}
      <div
        className="noscroll"
        style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '0 -22px 16px', padding: '2px 22px 4px' }}
      >
        {week.map((d) => {
          const tot = dayTotals(foods, meals, mealsByDay[d])
          const on = d === selDate
          const isToday = d === today
          return (
            <div
              key={d}
              onClick={() => selectDate(d)}
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
                  : { background: '#fff', border: `1px solid ${isToday ? '#2E9E5B' : '#EFE9DD'}`, color: '#1a1a17' }),
              }}
            >
              <div style={{ font: '600 10.5px Figtree', opacity: 0.7 }}>{weekdayShort(d)}</div>
              <div style={{ font: "700 17px 'Space Grotesk'", margin: '2px 0 6px' }}>{dayOfMonth(d)}</div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: on ? '#fff' : tot.kcal > 0 ? '#2E9E5B' : '#DDD5C6',
                }}
              />
              <div style={{ font: "600 9px 'Space Grotesk'", marginTop: 5, opacity: 0.75 }}>{tot.kcal}</div>
            </div>
          )
        })}
      </div>

      {/* selected day header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ font: "700 15px 'Bricolage Grotesque'", color: '#1a1a17' }}>{relativeLabel(selDate)}</div>
        <div style={{ font: "600 12px 'Space Grotesk'", color: ink(0.5) }}>
          {dayKcal} / {fmt(goals.kcal)} kcal
        </div>
      </div>

      <DaySlots date={selDate} showCheckoff={selDate <= today} />

      <div
        onClick={openSlots}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '11px 14px',
          marginTop: 8,
          borderRadius: 16,
          border: '1px dashed #D8D0C0',
          font: '600 12px Figtree',
          color: ink(0.5),
          cursor: 'pointer',
        }}
      >
        Add or edit meals
      </div>
    </div>
  )
}
