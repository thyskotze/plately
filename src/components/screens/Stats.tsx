import { useStore } from '../../store'
import { ink } from '../../tokens'
import { sparkline, eatenTotals, round } from '../../lib/calc'
import { Flame, Star, Share } from '../../icons'

export default function Stats() {
  const weights = useStore((s) => s.weights)
  const weightGoal = useStore((s) => s.weightGoal)
  const streak = useStore((s) => s.streak)
  const level = useStore((s) => s.level)
  const xp = useStore((s) => s.xp)
  const xpMax = useStore((s) => s.xpMax)
  const wInput = useStore((s) => s.wInput)
  const setWInput = useStore((s) => s.setWInput)
  const addWeight = useStore((s) => s.addWeight)
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const goals = useStore((s) => s.goals)
  const openShare = useStore((s) => s.openShare)

  const kgs = weights.map((w) => w.kg)
  const sp = sparkline(kgs)
  const totd = kgs[kgs.length - 1] - kgs[0]

  // Weekly achievement: a day is "perfect" once its eaten calories reach the goal.
  const dayHit = Array.from({ length: 7 }, (_, i) =>
    goals.kcal > 0 && eatenTotals(foods, meals, mealsByDay[i], eaten[i]).kcal >= goals.kcal,
  )
  const perfectDays = dayHit.filter(Boolean).length
  const perfectWeek = perfectDays === 7
  const todayPerfect = dayHit[1]

  const shareWeek = () =>
    openShare({
      kind: 'week',
      pct: round((perfectDays / 7) * 100),
      eatenKcal: 0,
      goalKcal: goals.kcal,
      streak,
      dateLabel: 'This week',
      headline: perfectWeek ? 'Perfect week! 🏆' : 'Weekly progress',
      sub: `${perfectDays}/7 days at 100%`,
      perfectDays,
    })

  const badges = [
    { label: 'Perfect day', emoji: '🎯', earned: todayPerfect },
    { label: '7-day streak', emoji: '🔥', earned: streak >= 7 },
    { label: 'Perfect week', emoji: '🏆', earned: perfectWeek },
    { label: 'Level 5', emoji: '⭐', earned: level >= 5 },
  ]

  const entries = weights
    .map((w, i) => {
      const prev = i > 0 ? weights[i - 1].kg : null
      const d = prev == null ? null : w.kg - prev
      return { label: w.label, kg: w.kg, d }
    })
    .reverse()

  return (
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div
        style={{
          font: "700 22px 'Bricolage Grotesque'",
          color: '#1a1a17',
          marginBottom: 16,
        }}
      >
        Progress
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #EFE9DD',
          borderRadius: 20,
          padding: '16px 18px',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 2,
          }}
        >
          <div style={{ font: '600 12.5px Figtree', color: ink(0.55) }}>Weight</div>
          <div
            style={{
              font: '600 11.5px Figtree',
              color: totd <= 0 ? '#2E9E5B' : '#E4572E',
            }}
          >
            {totd <= 0 ? '' : '+'}
            {totd.toFixed(1)} kg this month
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
          <div style={{ font: "700 34px 'Space Grotesk'", color: '#1a1a17' }}>
            {kgs[kgs.length - 1]}
          </div>
          <div style={{ font: '600 14px Figtree', color: ink(0.4) }}>kg</div>
          <div style={{ marginLeft: 'auto', font: '500 11.5px Figtree', color: ink(0.4) }}>
            Goal {weightGoal} kg
          </div>
        </div>

        <svg width="100%" height="72" viewBox="0 0 280 72" preserveAspectRatio="none">
          <polyline points={sp.area} fill="rgba(46,158,91,.09)" stroke="none" />
          <polyline
            points={sp.line}
            fill="none"
            stroke="#2E9E5B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={sp.endX} cy={sp.endY} r="4" fill="#2E9E5B" stroke="#fff" strokeWidth="2" />
        </svg>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={wInput}
            onChange={(e) => setWInput(e.target.value)}
            inputMode="decimal"
            placeholder="Log today's weight"
            style={{
              flex: 1,
              border: '1px solid #E4DDCD',
              borderRadius: 12,
              padding: '10px 12px',
              font: '500 13px Figtree',
              color: '#1a1a17',
              background: '#FBF9F3',
              outline: 'none',
            }}
          />
          <div
            onClick={addWeight}
            style={{
              background: '#2E9E5B',
              borderRadius: 12,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              font: '700 12.5px Figtree',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Log
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #EFE9DD',
            borderRadius: 18,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Flame size={15} />
            <span style={{ font: '600 11.5px Figtree', color: ink(0.55) }}>Streak</span>
          </div>
          <div style={{ font: "700 26px 'Space Grotesk'", color: '#1a1a17' }}>
            {streak} <span style={{ font: '600 12px Figtree', color: ink(0.4) }}>days</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: '#fff',
            border: '1px solid #EFE9DD',
            borderRadius: 18,
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Star />
            <span style={{ font: '600 11.5px Figtree', color: ink(0.55) }}>Level {level}</span>
          </div>
          <div
            style={{
              height: 8,
              background: '#ECE7DD',
              borderRadius: 99,
              overflow: 'hidden',
              margin: '8px 0 6px',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,#4FB05F,#2E9E5B)',
                borderRadius: 99,
                width: `${(xp / xpMax * 100).toFixed(0)}%`,
              }}
            />
          </div>
          <div style={{ font: "600 10.5px 'Space Grotesk'", color: ink(0.45) }}>
            {xp} / {xpMax} XP
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <div style={{ font: "700 13px 'Bricolage Grotesque'", color: '#1a1a17' }}>Badges</div>
        <div
          onClick={shareWeek}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#2E9E5B',
            borderRadius: 999,
            padding: '7px 12px',
            cursor: 'pointer',
          }}
        >
          <Share size={13} color="#fff" />
          <span style={{ font: '700 11px Figtree', color: '#fff' }}>Share week</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {badges.map((b) => (
          <div
            key={b.label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              background: b.earned ? 'linear-gradient(135deg,#EAF5EE,#F3F0E7)' : '#fff',
              border: `1px solid ${b.earned ? '#CDE6D6' : '#EFE9DD'}`,
              borderRadius: 14,
              padding: '12px 4px',
              opacity: b.earned ? 1 : 0.5,
            }}
          >
            <div style={{ fontSize: 22, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.emoji}</div>
            <div
              style={{
                font: '600 9px Figtree',
                color: ink(0.6),
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {b.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          font: "700 13px 'Bricolage Grotesque'",
          color: '#1a1a17',
          marginBottom: 8,
        }}
      >
        Recent entries
      </div>
      <div
        style={{
          background: '#fff',
          border: '1px solid #EFE9DD',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {entries.map((w, i) => (
          <div
            key={`${w.label}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '11px 14px',
              borderBottom: '1px solid #F4EFE5',
            }}
          >
            <div style={{ flex: 1, font: '500 12.5px Figtree', color: ink(0.7) }}>
              {w.label}
            </div>
            <div
              style={{
                font: "700 13px 'Space Grotesk'",
                color: '#1a1a17',
                marginRight: 10,
              }}
            >
              {w.kg} kg
            </div>
            <div
              style={{
                font: '600 11px Figtree',
                color: w.d == null ? ink(0.35) : w.d <= 0 ? '#2E9E5B' : '#E4572E',
                width: 44,
                textAlign: 'right',
              }}
            >
              {w.d == null ? '–' : `${w.d <= 0 ? '' : '+'}${w.d.toFixed(1)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
