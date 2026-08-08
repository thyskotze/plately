import { useStore } from '../../store'
import type { Sex, Activity, GoalDir } from '../../types'
import { fmt, suggestKcal, deriveMacros, toNum } from '../../lib/calc'
import { COLORS, ink } from '../../tokens'
import Sheet from '../Sheet'

export default function GoalsSheet() {
  const show = useStore((s) => s.overlay === 'goals' && !!s.gl)
  const gl = useStore((s) => s.gl)
  const setGl = useStore((s) => s.setGl)
  const saveGoals = useStore((s) => s.saveGoals)
  const closeOverlay = useStore((s) => s.closeOverlay)

  if (!show || !gl) return null

  const suggestion = suggestKcal(gl)
  const lo = toNum(gl.kcalMin)
  const hi = toNum(gl.kcalMax)
  const kcalNow = lo && hi ? Math.round((lo + hi) / 2) : lo || hi || suggestion
  const derived = deriveMacros(kcalNow, toNum(gl.p))

  const statInput = {
    width: '100%',
    border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: 11,
    padding: 10,
    font: '700 14px Space Grotesk',
    textAlign: 'center' as const,
    background: '#fff',
    outline: 'none',
    color: COLORS.ink,
    boxSizing: 'border-box' as const,
  }

  const fieldLabel = { font: '600 10px Figtree', color: ink(0.5), marginBottom: 5 } as const
  const rowLabel = { font: '600 10px Figtree', color: ink(0.5), marginBottom: 6 } as const

  const chipStyle = (active: boolean) =>
    ({
      flex: 1,
      textAlign: 'center' as const,
      padding: '9px 2px',
      borderRadius: 11,
      background: active ? COLORS.greenTint : '#fff',
      border: `1px solid ${active ? COLORS.green : COLORS.inputBorder}`,
      font: '600 10.5px Figtree',
      color: active ? COLORS.green : ink(0.6),
      cursor: 'pointer',
    }) as const

  const sexes: [Sex, string][] = [
    ['male', 'Male'],
    ['female', 'Female'],
  ]
  const acts: [Activity, string][] = [
    ['sedentary', 'Low'],
    ['light', 'Light'],
    ['moderate', 'Mod'],
    ['active', 'High'],
  ]
  const goals: [GoalDir, string][] = [
    ['cut', 'Lose'],
    ['maintain', 'Maintain'],
    ['gain', 'Gain'],
  ]

  const macroInput = (border: string) =>
    ({
      width: '100%',
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: 9,
      font: '700 13px Space Grotesk',
      textAlign: 'center' as const,
      background: COLORS.appBg,
      outline: 'none',
      color: COLORS.ink,
      boxSizing: 'border-box' as const,
    }) as const

  return (
    <Sheet zIndex={60} onScrim={closeOverlay} scroll maxHeight="92%">
      <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink, marginBottom: 3 }}>
        Your goals
      </div>
      <div style={{ font: '500 11.5px Figtree', color: ink(0.5), marginBottom: 16 }}>
        We suggest a calorie target from your stats — set your calorie and protein goals.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>Weight (kg)</div>
          <input
            value={gl.weight}
            onChange={(e) => setGl('weight', e.target.value)}
            inputMode="decimal"
            style={statInput}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>Height (cm)</div>
          <input
            value={gl.height}
            onChange={(e) => setGl('height', e.target.value)}
            inputMode="decimal"
            style={statInput}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={fieldLabel}>Age</div>
          <input
            value={gl.age}
            onChange={(e) => setGl('age', e.target.value)}
            inputMode="decimal"
            style={statInput}
          />
        </div>
      </div>

      <div style={rowLabel}>Sex</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {sexes.map(([k, l]) => (
          <div key={k} onClick={() => setGl('sex', k)} style={chipStyle(gl.sex === k)}>
            {l}
          </div>
        ))}
      </div>

      <div style={rowLabel}>Activity</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {acts.map(([k, l]) => (
          <div key={k} onClick={() => setGl('activity', k)} style={chipStyle(gl.activity === k)}>
            {l}
          </div>
        ))}
      </div>

      <div style={rowLabel}>Goal</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {goals.map(([k, l]) => (
          <div key={k} onClick={() => setGl('goal', k)} style={chipStyle(gl.goal === k)}>
            {l}
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 18,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          <div style={{ font: '600 12px Figtree', color: ink(0.55) }}>Your targets</div>
          <div
            onClick={() => {
              setGl('kcalMin', String(suggestKcal(gl) - 100))
              setGl('kcalMax', String(suggestKcal(gl) + 100))
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: COLORS.greenTint,
              border: `1px solid ${COLORS.green}`,
              borderRadius: 999,
              padding: '6px 11px',
              font: '700 10.5px Figtree',
              color: COLORS.green,
              cursor: 'pointer',
            }}
          >
            ↻ Recalculate ({fmt(suggestKcal(gl))})
          </div>
        </div>
        <div style={{ font: '600 9.5px Figtree', color: ink(0.55), marginBottom: 4 }}>
          Daily calorie range (kcal)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input
            value={gl.kcalMin}
            onChange={(e) => setGl('kcalMin', e.target.value)}
            inputMode="decimal"
            placeholder="min"
            style={{ ...macroInput(COLORS.inputBorder), flex: 1 }}
          />
          <div style={{ font: '600 12px Figtree', color: ink(0.4), flex: 'none' }}>to</div>
          <input
            value={gl.kcalMax}
            onChange={(e) => setGl('kcalMax', e.target.value)}
            inputMode="decimal"
            placeholder="max"
            style={{ ...macroInput(COLORS.inputBorder), flex: 1 }}
          />
        </div>
        <div style={{ font: '500 10.5px/1.45 Figtree', color: ink(0.5), marginBottom: 12 }}>
          Aim to land inside this range. Going over counts against your streak, the
          same as falling short.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 9.5px Figtree', color: '#E4572E', marginBottom: 4 }}>
              Protein goal (g)
            </div>
            <input
              value={gl.p}
              onChange={(e) => setGl('p', e.target.value)}
              inputMode="decimal"
              style={macroInput('#F0DCD5')}
            />
          </div>
        </div>
        <div style={{ font: '500 11px Figtree', color: ink(0.5), marginTop: 12, textAlign: 'center' }}>
          We work out the rest: ~{derived.carbs} g carbs · ~{derived.fat} g fat
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div
          onClick={closeOverlay}
          style={{
            flex: 'none',
            padding: '14px 20px',
            borderRadius: 14,
            background: '#fff',
            border: `1px solid ${COLORS.inputBorder}`,
            font: '700 13px Figtree',
            color: COLORS.ink,
            cursor: 'pointer',
          }}
        >
          Cancel
        </div>
        <div
          onClick={saveGoals}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: 14,
            borderRadius: 14,
            background: COLORS.green,
            font: '700 13px Figtree',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Save goals
        </div>
      </div>
    </Sheet>
  )
}
