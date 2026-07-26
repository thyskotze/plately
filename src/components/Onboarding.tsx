import { useState } from 'react'
import { useStore } from '../store'
import { COLORS, ink } from '../tokens'
import { fmt, suggestKcal, suggestMacros, deriveMacros, toNum } from '../lib/calc'
import type { Sex, Activity, GoalDir } from '../types'

export default function Onboarding() {
  const completeOnboarding = useStore((s) => s.completeOnboarding)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  // Prefilled so the form is valid by default — user just adjusts.
  const [weight, setWeight] = useState('70')
  const [height, setHeight] = useState('170')
  const [age, setAge] = useState('30')
  const [sex, setSex] = useState<Sex>('male')
  const [activity, setActivity] = useState<Activity>('moderate')
  const [goalDir, setGoalDir] = useState<GoalDir>('maintain')

  const STEPS = 3
  const statsValid = toNum(weight) > 0 && toNum(height) > 0 && toNum(age) > 0
  const canNext = step === 0 ? name.trim().length > 0 : step === 1 ? statsValid : true

  const suggested = statsValid
    ? suggestKcal({
        weight,
        height,
        age,
        sex,
        activity,
        goal: goalDir,
        kcal: '',
        p: '',
      })
    : 0
  const proteinTarget = statsValid ? suggestMacros(suggested, toNum(weight)).protein : 0
  const derived = statsValid ? deriveMacros(suggested, proteinTarget) : { carbs: 0, fat: 0 }

  const finish = () =>
    completeOnboarding({
      name,
      weight: toNum(weight),
      height: toNum(height),
      age: toNum(age),
      sex,
      activity,
      goalDir,
    })

  const label = { font: '600 11px Figtree', color: ink(0.55), margin: '14px 0 6px' } as const
  const input = {
    width: '100%',
    border: `1px solid ${COLORS.inputBorder}`,
    borderRadius: 12,
    padding: '12px 13px',
    font: '500 14px Figtree',
    color: COLORS.ink,
    background: '#fff',
    outline: 'none',
  } as const
  const numInput = { ...input, font: '700 15px "Space Grotesk"', textAlign: 'center' as const }

  const chip = (active: boolean, onClick: () => void, text: string, key: string) => (
    <div
      key={key}
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '10px 2px',
        borderRadius: 11,
        background: active ? COLORS.greenTint : '#fff',
        border: `1px solid ${active ? COLORS.green : COLORS.inputBorder}`,
        font: '600 11.5px Figtree',
        color: active ? COLORS.green : ink(0.6),
        cursor: 'pointer',
      }}
    >
      {text}
    </div>
  )

  return (
    <div
      className="noscroll"
      style={{
        position: 'absolute',
        inset: 0,
        background: COLORS.appBg,
        zIndex: 100,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'fade .25s',
      }}
    >
      {/* header */}
      <div style={{ padding: '20px 22px 6px' }}>
        <div style={{ font: "800 20px 'Bricolage Grotesque'", color: COLORS.green }}>Plately</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 99,
                background: i <= step ? COLORS.green : '#E4DDCD',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 22px 0' }}>
        {step === 0 && (
          <div style={{ animation: 'fade .2s' }}>
            <div style={{ font: "700 24px/1.15 'Bricolage Grotesque'", color: COLORS.ink }}>
              Welcome 👋
            </div>
            <div style={{ font: '500 13.5px/1.5 Figtree', color: ink(0.6), margin: '8px 0 4px' }}>
              Let's set up your plan. First — what should we call you?
            </div>
            <div style={label}>Your name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              autoFocus
              style={input}
            />
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: 'fade .2s' }}>
            <div style={{ font: "700 22px 'Bricolage Grotesque'", color: COLORS.ink }}>
              About you
            </div>
            <div style={{ font: '500 13px/1.5 Figtree', color: ink(0.6), marginTop: 6 }}>
              We use this to work out your daily target. It stays on your phone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={label}>Weight (kg)</div>
                <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="70" style={numInput} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Height (cm)</div>
                <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" placeholder="170" style={numInput} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={label}>Age</div>
                <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="decimal" placeholder="30" style={numInput} />
              </div>
            </div>
            <div style={label}>Sex</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {chip(sex === 'male', () => setSex('male'), 'Male', 'm')}
              {chip(sex === 'female', () => setSex('female'), 'Female', 'f')}
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fade .2s' }}>
            <div style={{ font: "700 22px 'Bricolage Grotesque'", color: COLORS.ink }}>
              Your goal
            </div>
            <div style={{ font: '500 13px/1.5 Figtree', color: ink(0.6), marginTop: 6 }}>
              How active are you, and what are you aiming for?
            </div>
            <div style={label}>Activity level</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {chip(activity === 'sedentary', () => setActivity('sedentary'), 'Low', 'a1')}
              {chip(activity === 'light', () => setActivity('light'), 'Light', 'a2')}
              {chip(activity === 'moderate', () => setActivity('moderate'), 'Mod', 'a3')}
              {chip(activity === 'active', () => setActivity('active'), 'High', 'a4')}
            </div>
            <div style={label}>Goal</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {chip(goalDir === 'cut', () => setGoalDir('cut'), 'Lose', 'g1')}
              {chip(goalDir === 'maintain', () => setGoalDir('maintain'), 'Maintain', 'g2')}
              {chip(goalDir === 'gain', () => setGoalDir('gain'), 'Gain', 'g3')}
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg,#EAF5EE,#F3F0E7)',
                border: '1px solid #CDE6D6',
                borderRadius: 16,
                padding: 16,
                marginTop: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ font: '600 12px Figtree', color: ink(0.55) }}>Your suggested daily target</div>
              <div style={{ font: "700 34px 'Space Grotesk'", color: COLORS.green, marginTop: 4 }}>
                {fmt(suggested)}
                <span style={{ font: '600 13px Figtree', color: ink(0.4) }}> kcal</span>
              </div>
              <div style={{ font: '600 12px Figtree', color: ink(0.6), marginTop: 4 }}>
                Protein target ~{proteinTarget} g
              </div>
              <div style={{ font: '500 11px Figtree', color: ink(0.5), marginTop: 2 }}>
                ~{derived.carbs} g carbs · ~{derived.fat} g fat (auto)
              </div>
              <div style={{ font: '500 11px Figtree', color: ink(0.5), marginTop: 6 }}>
                You can fine-tune your calories and protein anytime.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* actions — in-flow so they stay reachable above the keyboard */}
      <div style={{ display: 'flex', gap: 10, padding: '24px 22px 40px' }}>
        {step > 0 && (
          <div
            onClick={() => setStep(step - 1)}
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
            Back
          </div>
        )}
        <div
          onClick={canNext ? (step === STEPS - 1 ? finish : () => setStep(step + 1)) : undefined}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: 14,
            borderRadius: 14,
            background: canNext ? COLORS.green : '#C9C1B2',
            font: '700 13px Figtree',
            color: '#fff',
            cursor: canNext ? 'pointer' : 'default',
          }}
        >
          {step === STEPS - 1 ? "Start using Plately" : 'Continue'}
        </div>
      </div>
    </div>
  )
}
