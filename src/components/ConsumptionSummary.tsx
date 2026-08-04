import { useState } from 'react'
import { useStore } from '../store'
import { ink, MACRO } from '../tokens'
import { eatenTotals, round, clamp01 } from '../lib/calc'
import { todayISO, addDays, weekDates, startOfWeek, weekdayShort, dayOfMonth } from '../lib/dates'

type Range = '7d' | 'week'

/**
 * What you've actually eaten per day (kcal + macros) over a range, with
 * averages. Averages ignore days with nothing logged so a mid-week view isn't
 * dragged down by days that haven't happened yet.
 */
export default function ConsumptionSummary() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const goals = useStore((s) => s.goals)
  const selDate = useStore((s) => s.selDate)

  const [range, setRange] = useState<Range>('7d')

  const today = todayISO()
  const dates =
    range === '7d'
      ? Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)) // oldest → today
      : weekDates(startOfWeek(selDate))

  const rows = dates.map((date) => ({
    date,
    ...eatenTotals(foods, meals, mealsByDay[date], eaten[date]),
  }))

  // Only days with something eaten count toward the average.
  const logged = rows.filter((r) => r.kcal > 0)
  const avg = (pick: (r: (typeof rows)[number]) => number) =>
    logged.length ? round(logged.reduce((a, r) => a + pick(r), 0) / logged.length) : 0

  const avgKcal = avg((r) => r.kcal)
  const avgP = avg((r) => r.p)
  const avgC = avg((r) => r.c)
  const avgF = avg((r) => r.f)

  const maxKcal = Math.max(goals.kcal || 0, ...rows.map((r) => r.kcal), 1)

  const tab = (key: Range, label: string) => {
    const on = range === key
    return (
      <div
        onClick={() => setRange(key)}
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '6px 0',
          borderRadius: 9,
          background: on ? '#fff' : 'transparent',
          boxShadow: on ? '0 1px 3px rgba(26,26,23,.1)' : 'none',
          font: '700 11px Figtree',
          color: on ? '#2E9E5B' : ink(0.5),
          cursor: 'pointer',
        }}
      >
        {label}
      </div>
    )
  }

  const avgTile = (label: string, val: number, unit: string, color: string) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ font: "700 17px 'Space Grotesk'", color }}>
        {val}
        {unit && <span style={{ font: "600 10px 'Space Grotesk'" }}>{unit}</span>}
      </div>
      <div style={{ font: '500 9.5px Figtree', color: ink(0.45) }}>{label}</div>
    </div>
  )

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EFE9DD',
        borderRadius: 20,
        padding: '16px 18px',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ font: '600 12.5px Figtree', color: ink(0.55) }}>What you ate</div>
        <div style={{ font: '500 10.5px Figtree', color: ink(0.4) }}>
          {logged.length} {logged.length === 1 ? 'day' : 'days'} logged
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#EFE9DD', borderRadius: 11, padding: 3, marginBottom: 14 }}>
        {tab('7d', 'Last 7 days')}
        {tab('week', 'This week')}
      </div>

      {/* daily averages */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'linear-gradient(135deg,#EAF5EE,#F3F0E7)',
          border: '1px solid #CDE6D6',
          borderRadius: 14,
          padding: '11px 10px',
          marginBottom: 14,
        }}
      >
        {avgTile('kcal', avgKcal, '', '#2E9E5B')}
        {avgTile('protein', avgP, 'g', MACRO.protein.color)}
        {avgTile('carbs', avgC, 'g', MACRO.carbs.color)}
        {avgTile('fat', avgF, 'g', MACRO.fat.color)}
      </div>
      <div style={{ font: '500 10px Figtree', color: ink(0.4), textAlign: 'center', marginTop: -8, marginBottom: 12 }}>
        daily average
      </div>

      {/* per-day rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rows.map((r) => {
          const isToday = r.date === today
          const none = r.kcal === 0
          return (
            <div key={r.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, flex: 'none' }}>
                <div
                  style={{
                    font: isToday ? '700 10.5px Figtree' : '600 10.5px Figtree',
                    color: isToday ? '#2E9E5B' : ink(0.55),
                  }}
                >
                  {isToday ? 'Today' : weekdayShort(r.date)}
                </div>
                <div style={{ font: "500 9px 'Space Grotesk'", color: ink(0.35) }}>{dayOfMonth(r.date)}</div>
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 7,
                    background: '#F1ECE1',
                    borderRadius: 99,
                    overflow: 'hidden',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(clamp01(r.kcal / maxKcal) * 100).toFixed(0)}%`,
                      background: none ? 'transparent' : 'linear-gradient(90deg,#4FB05F,#2E9E5B)',
                      borderRadius: 99,
                    }}
                  />
                </div>
                <div style={{ font: '500 9.5px Figtree', color: ink(none ? 0.3 : 0.5) }}>
                  {none ? (
                    'nothing logged'
                  ) : (
                    <>
                      <span style={{ color: MACRO.protein.color, fontWeight: 700 }}>{r.p}P</span>
                      {'  '}
                      <span style={{ color: MACRO.carbs.color }}>{r.c}C</span>
                      {'  '}
                      <span style={{ color: MACRO.fat.color }}>{r.f}F</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ width: 46, textAlign: 'right', flex: 'none' }}>
                <div style={{ font: "700 12px 'Space Grotesk'", color: none ? ink(0.3) : '#1a1a17' }}>
                  {r.kcal}
                </div>
                <div style={{ font: '500 8.5px Figtree', color: ink(0.35) }}>kcal</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
