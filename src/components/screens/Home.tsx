import { useStore } from '../../store'
import { ink, MACRO } from '../../tokens'
import { round, fmt, clamp01, dayTotals, eatenTotals } from '../../lib/calc'
import { Flame, Plus, Share } from '../../icons'
import { todayISO } from '../../lib/dates'
import { computeStreak } from '../../lib/streak'
import DaySlots from '../DaySlots'

const RING_DASH = 477.5
const MINI_DASH = 150.8

export default function Home() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const goals = useStore((s) => s.goals)
  const eaten = useStore((s) => s.eaten)
  const name = useStore((s) => s.name)
  const openProfile = useStore((s) => s.openProfile)
  const openShare = useStore((s) => s.openShare)
  const openSlots = useStore((s) => s.openSlots)

  const today = todayISO()
  const streak = computeStreak(foods, meals, mealsByDay, eaten, goals.kcal, today)

  const firstName = name.trim().split(' ')[0] || 'there'
  const initial = (name.trim()[0] || 'P').toUpperCase()
  const hr = new Date().getHours()
  const partOfDay = hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const eatenToday = eaten[today]
  const planned = dayTotals(foods, meals, mealsByDay[today]) // everything laid out today
  const t = eatenTotals(foods, meals, mealsByDay[today], eatenToday) // only ticked-off meals
  const left = goals.kcal - t.kcal
  const off = (total: number, goal: number, dash: number) =>
    (dash * (1 - clamp01(total / goal))).toFixed(1)
  const calOff = off(t.kcal, goals.kcal, RING_DASH)
  const calPlannedOff = off(planned.kcal, goals.kcal, RING_DASH)

  // Over-limit "watch hand": how far past the goal you've eaten (capped at one loop).
  const over = goals.kcal > 0 && t.kcal > goals.kcal
  const overFrac = over ? Math.min((t.kcal - goals.kcal) / goals.kcal, 1) : 0
  const handRad = ((-90 + 360 * overFrac) * Math.PI) / 180
  const handX = 93 + 70 * Math.cos(handRad)
  const handY = 93 + 70 * Math.sin(handRad)
  const OVER_RED = '#E4572E'

  const macros = [
    { label: 'Protein', val: round(t.p), plan: round(planned.p), goal: goals.protein, ...MACRO.protein },
    { label: 'Carbs', val: round(t.c), plan: round(planned.c), goal: goals.carbs, ...MACRO.carbs },
    { label: 'Fat', val: round(t.f), plan: round(planned.f), goal: goals.fat, ...MACRO.fat },
  ]

  const pct = goals.kcal ? round((t.kcal / goals.kcal) * 100) : 0
  const showWin = pct >= 80
  const win =
    pct >= 100
      ? { headline: 'Goal smashed! 🔥', sub: 'You hit 100% of your daily goal.' }
      : { headline: 'Almost there! 💪', sub: `You're at ${pct}% of your goal.` }
  const shareToday = () =>
    openShare({
      kind: 'day',
      pct,
      eatenKcal: t.kcal,
      goalKcal: goals.kcal,
      streak,
      dateLabel,
      headline: win.headline,
      sub: win.sub,
    })

  return (
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ font: '400 12.5px Figtree', color: ink(0.5) }}>{dateLabel}</div>
          <div
            style={{
              font: "700 22px/1.1 'Bricolage Grotesque',sans-serif",
              color: '#1a1a17',
              marginTop: 2,
            }}
          >
            Good {partOfDay}, {firstName}
          </div>
        </div>
        <div
          onClick={openProfile}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#2E9E5B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '700 15px Figtree',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {initial}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 4px' }}>
        <div style={{ position: 'relative', width: 186, height: 186 }}>
          <svg width="186" height="186" viewBox="0 0 186 186">
            <circle cx="93" cy="93" r="76" fill="none" stroke="#ECE7DD" strokeWidth="15" />
            {/* faint arc = everything planned for today */}
            <circle
              cx="93"
              cy="93"
              r="76"
              fill="none"
              stroke="#2E9E5B"
              strokeOpacity={0.22}
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray="477.5"
              strokeDashoffset={calPlannedOff}
              transform="rotate(-90 93 93)"
            />
            {/* solid arc = meals ticked off as eaten (red + full when over) */}
            <circle
              cx="93"
              cy="93"
              r="76"
              fill="none"
              stroke={over ? OVER_RED : '#2E9E5B'}
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray="477.5"
              strokeDashoffset={calOff}
              transform="rotate(-90 93 93)"
            />
            {/* over-limit watch hand */}
            {over && (
              <>
                <line
                  x1="93"
                  y1="93"
                  x2={handX}
                  y2={handY}
                  stroke={OVER_RED}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="93" cy="93" r="4.5" fill={OVER_RED} />
                <circle cx={handX} cy={handY} r="4" fill={OVER_RED} />
              </>
            )}
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                font: "700 44px/1 'Space Grotesk',sans-serif",
                color: over ? OVER_RED : '#1a1a17',
              }}
            >
              {fmt(Math.abs(left))}
            </div>
            <div style={{ font: '600 12px Figtree', color: over ? OVER_RED : ink(0.5), marginTop: 3 }}>
              {left >= 0 ? 'kcal left' : 'kcal over'}
            </div>
            <div style={{ font: '500 10.5px/1.35 Figtree', color: ink(0.4), marginTop: 6, textAlign: 'center' }}>
              {fmt(t.kcal)} eaten
              <br />
              {fmt(planned.kcal)} planned
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          margin: '8px 4px 18px',
        }}
      >
        {macros.map((m) => (
          <div
            key={m.label}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div style={{ position: 'relative', width: 58, height: 58 }}>
              <svg width="58" height="58" viewBox="0 0 58 58">
                <circle cx="29" cy="29" r="24" fill="none" stroke={m.bg} strokeWidth="6" />
                <circle
                  cx="29"
                  cy="29"
                  r="24"
                  fill="none"
                  stroke={m.color}
                  strokeOpacity={0.25}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="150.8"
                  strokeDashoffset={off(m.plan, m.goal, MINI_DASH)}
                  transform="rotate(-90 29 29)"
                />
                <circle
                  cx="29"
                  cy="29"
                  r="24"
                  fill="none"
                  stroke={m.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="150.8"
                  strokeDashoffset={off(m.val, m.goal, MINI_DASH)}
                  transform="rotate(-90 29 29)"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: "700 13px 'Space Grotesk'",
                  color: '#1a1a17',
                }}
              >
                {m.val}
              </div>
            </div>
            <div style={{ font: '600 11px Figtree', color: ink(0.55) }}>{m.label}</div>
            <div
              style={{
                font: "600 10px 'Space Grotesk'",
                color: m.val > m.goal ? OVER_RED : ink(0.4),
              }}
            >
              {m.val} / {m.goal}g
            </div>
          </div>
        ))}
      </div>

      {showWin && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'linear-gradient(135deg,#EAF5EE,#F3F0E7)',
            border: '1px solid #CDE6D6',
            borderRadius: 16,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 13.5px Figtree', color: '#1a1a17' }}>{win.headline}</div>
            <div style={{ font: '500 11px Figtree', color: ink(0.55) }}>{win.sub}</div>
          </div>
          <div
            onClick={shareToday}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#2E9E5B',
              borderRadius: 999,
              padding: '9px 14px',
              cursor: 'pointer',
              flex: 'none',
            }}
          >
            <Share size={14} color="#fff" />
            <span style={{ font: '700 11.5px Figtree', color: '#fff' }}>Share</span>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ font: "700 14px 'Bricolage Grotesque'", color: '#1a1a17' }}>
          Today's meals
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            font: '600 11.5px Figtree',
            color: '#1a1a17',
          }}
        >
          <Flame />
          {streak}-day streak
        </div>
      </div>

      <DaySlots date={today} showCheckoff />

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
          border: `1px dashed ${'#D8D0C0'}`,
          font: '600 12px Figtree',
          color: ink(0.5),
          cursor: 'pointer',
        }}
      >
        <Plus size={14} color={ink(0.5)} />
        Add or edit meals
      </div>
    </div>
  )
}
