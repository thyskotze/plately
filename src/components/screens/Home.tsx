import { useStore } from '../../store'
import { ink, MACRO } from '../../tokens'
import { round, fmt, clamp01, dayTotals, eatenTotals, itemMetrics } from '../../lib/calc'
import { SLOTS } from '../../types'
import { Flame, Utensils, Plus, Check, ChevronRight, Share } from '../../icons'

const TODAY = 1
const RING_DASH = 477.5
const MINI_DASH = 150.8

export default function Home() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const goals = useStore((s) => s.goals)
  const streak = useStore((s) => s.streak)
  const eaten = useStore((s) => s.eaten)
  const openProfile = useStore((s) => s.openProfile)
  const openPick = useStore((s) => s.openPick)
  const openEditItem = useStore((s) => s.openEditItem)
  const toggleEaten = useStore((s) => s.toggleEaten)
  const openShare = useStore((s) => s.openShare)

  const eatenToday = eaten[TODAY]
  const planned = dayTotals(foods, meals, mealsByDay[TODAY]) // everything laid out today
  const t = eatenTotals(foods, meals, mealsByDay[TODAY], eatenToday) // only ticked-off meals
  const left = goals.kcal - t.kcal
  const off = (total: number, goal: number, dash: number) =>
    (dash * (1 - clamp01(total / goal))).toFixed(1)
  const calOff = off(t.kcal, goals.kcal, RING_DASH)
  const calPlannedOff = off(planned.kcal, goals.kcal, RING_DASH)

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
      dateLabel: 'Tuesday, Jul 28',
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
          <div style={{ font: '400 12.5px Figtree', color: ink(0.5) }}>
            Tuesday, Jul 28
          </div>
          <div
            style={{
              font: "700 22px/1.1 'Bricolage Grotesque',sans-serif",
              color: '#1a1a17',
              marginTop: 2,
            }}
          >
            Good morning, Sam
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
          S
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
            {/* solid arc = meals ticked off as eaten */}
            <circle
              cx="93"
              cy="93"
              r="76"
              fill="none"
              stroke="#2E9E5B"
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray="477.5"
              strokeDashoffset={calOff}
              transform="rotate(-90 93 93)"
            />
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
            <div style={{ font: "700 44px/1 'Space Grotesk',sans-serif", color: '#1a1a17' }}>
              {fmt(Math.abs(left))}
            </div>
            <div style={{ font: '500 12px Figtree', color: ink(0.5), marginTop: 3 }}>
              {left >= 0 ? 'kcal left' : 'kcal over'}
            </div>
            <div style={{ font: '500 11px Figtree', color: ink(0.35), marginTop: 6 }}>
              {fmt(t.kcal)} eaten · {fmt(planned.kcal)} planned
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
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SLOTS.map(({ key, label }) => {
          const items = (mealsByDay[TODAY][key] || []).map((it, idx) => ({
            ...itemMetrics(foods, meals, it),
            idx,
          }))
          const kc = items.reduce((a, b) => a + b.kcal, 0)
          const hasItems = items.length > 0
          const done = !!eatenToday?.[key]
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
                {hasItems ? (
                  <div
                    onClick={() => toggleEaten(TODAY, key)}
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
                  onClick={() => openPick(TODAY, key)}
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
                  onClick={() => openEditItem(TODAY, key, it.idx)}
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
                  </div>
                  <div style={{ font: '500 11px Figtree', color: ink(0.4) }}>
                    {it.isMeal
                      ? it.servings === 1
                        ? '1 serving'
                        : `${it.servings} servings`
                      : `${it.grams}g`}
                  </div>
                  <div
                    style={{
                      font: "600 11px 'Space Grotesk'",
                      color: ink(0.55),
                      width: 42,
                      textAlign: 'right',
                    }}
                  >
                    {it.kcal}
                  </div>
                  <ChevronRight size={13} color="#C9C1B2" strokeWidth={2.4} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
