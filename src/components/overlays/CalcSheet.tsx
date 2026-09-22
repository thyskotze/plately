import { useState } from 'react'
import { useStore } from '../../store'
import type { Activity, GoalDir, Pace, Sex } from '../../types'
import { fmt, kcalWindow, toNum } from '../../lib/calc'
import {
  ACTIVITY_FACTOR,
  GAIN_KG_PER_WEEK,
  LOSE_KG_PER_WEEK,
  bmrOf,
  computeTargets,
  latestWeighIn,
  measureBurn,
} from '../../lib/targets'
import { addDays, parseISO, todayISO } from '../../lib/dates'
import { COLORS, MACRO, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'

/** "Work it out for me" — only mounted while open, so its drafts reset each time. */
export default function CalcSheet() {
  const show = useStore((s) => s.overlay === 'calc')
  return show ? <CalcBody /> : null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const shortDate = (iso: string) => {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function CalcBody() {
  const bio = useStore((s) => s.bio)
  const weights = useStore((s) => s.weights)
  const weightGoal = useStore((s) => s.weightGoal)
  const goals = useStore((s) => s.goals)
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const applyTargets = useStore((s) => s.applyTargets)
  const close = useStore((s) => s.closeOverlay)

  const latest = latestWeighIn(weights)
  const [weight, setWeight] = useState(String(latest?.kg ?? bio.weight))
  const [height, setHeight] = useState(String(bio.height))
  const [age, setAge] = useState(String(bio.age))
  const [sex, setSex] = useState<Sex>(bio.sex)
  const [activity, setActivity] = useState<Activity>(bio.activity)
  const [goal, setGoal] = useState<GoalDir>(bio.goalDir)
  const [pace, setPace] = useState<Pace>(bio.pace ?? 'steady')
  const [goalWeight, setGoalWeight] = useState(weightGoal ? String(weightGoal) : '')
  const [useMeasured, setUseMeasured] = useState(false)
  const [showWorking, setShowWorking] = useState(false)

  const today = todayISO()
  const w = toNum(weight)
  const h = toNum(height)
  const a = toNum(age)
  const ready = w > 30 && h > 100 && a > 10

  const bmr = bmrOf(w, h, a, sex)
  const measured = ready ? measureBurn(foods, meals, mealsByDay, eaten, weights, bmr, today) : null
  const plan = computeTargets({
    weight: w,
    height: h,
    age: a,
    sex,
    activity,
    goal,
    pace,
    goalWeight: toNum(goalWeight) || undefined,
    measuredTdee: useMeasured && measured ? measured.tdee : null,
  })
  const formulaTdee = Math.round(bmr * ACTIVITY_FACTOR[activity])

  // How much the body changed since the goals were last set.
  const sinceSet = w && bio.weight ? Math.round((w - bio.weight) * 10) / 10 : 0
  const burnShift =
    Math.round(
      (bmrOf(w, h, a, sex) - bmrOf(bio.weight, h, a, sex)) * ACTIVITY_FACTOR[activity] / 10,
    ) * 10

  const win = kcalWindow(goals)
  const goalDate = plan.weeksToGoal ? shortDate(addDays(today, plan.weeksToGoal * 7)) : null

  // ── styles ──────────────────────────────────────────────────────────────
  const label = { font: '600 10px Figtree', color: ink(0.5), marginBottom: 5 } as const
  const input = {
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
  const chip = (active: boolean) =>
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
  const card = {
    background: '#fff',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  } as const
  const note = (bg: string, border: string) =>
    ({
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 14,
      padding: '11px 13px',
      font: '500 11.5px/1.5 Figtree',
      color: ink(0.75),
      marginBottom: 10,
    }) as const

  const goalOpts: { k: GoalDir; title: string; sub: string }[] = [
    { k: 'cut', title: 'Lose weight', sub: 'Eat in a calorie deficit' },
    { k: 'maintain', title: 'Keep my weight', sub: 'Eat what you burn' },
    { k: 'gain', title: 'Build / gain weight', sub: 'Eat in a small surplus' },
  ]
  const paceOpts: [Pace, string][] =
    goal === 'gain'
      ? [
          ['gentle', `Lean · ${GAIN_KG_PER_WEEK.gentle}`],
          ['steady', `Steady · ${GAIN_KG_PER_WEEK.steady}`],
          ['fast', `Faster · ${GAIN_KG_PER_WEEK.fast}`],
        ]
      : [
          ['gentle', `Gentle · ${LOSE_KG_PER_WEEK.gentle}`],
          ['steady', `Steady · ${LOSE_KG_PER_WEEK.steady}`],
          ['fast', `Fast · ${LOSE_KG_PER_WEEK.fast}`],
        ]
  const acts: [Activity, string, string][] = [
    ['sedentary', 'Low', 'desk, little exercise'],
    ['light', 'Light', 'exercise 1–3×/week'],
    ['moderate', 'Moderate', 'exercise 3–5×/week'],
    ['active', 'High', 'hard training 6–7×/week'],
  ]

  const apply = () =>
    applyTargets(plan, { weight: w, height: h, age: a, sex, activity, goalDir: goal, pace }, toNum(goalWeight))

  const sign = (n: number) => (n > 0 ? `+${n}` : String(n))

  return (
    <Sheet zIndex={62} onScrim={close} scroll maxHeight="94%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>
            Work it out for me
          </div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5), marginBottom: 14 }}>
            Pick a goal — we'll set your calories and macros.
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      {/* Goal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
        {goalOpts.map((g) => (
          <div
            key={g.k}
            onClick={() => setGoal(g.k)}
            style={{
              ...chip(goal === g.k),
              textAlign: 'left',
              padding: '11px 13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ font: '700 13px Figtree' }}>{g.title}</span>
            <span style={{ font: '500 10.5px Figtree', color: ink(0.5) }}>{g.sub}</span>
          </div>
        ))}
      </div>
      {goal !== 'maintain' && (
        <>
          <div style={label}>How fast? (kg per week)</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {paceOpts.map(([k, l]) => (
              <div key={k} onClick={() => setPace(k)} style={chip(pace === k)}>
                {l}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Body */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1.2 }}>
          <div style={label}>Weight (kg)</div>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" style={input} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={label}>Height (cm)</div>
          <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" style={input} />
        </div>
        <div style={{ flex: 0.8 }}>
          <div style={label}>Age</div>
          <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" style={input} />
        </div>
      </div>
      {latest && (
        <div style={{ marginBottom: 12 }}>
          {toNum(weight) === latest.kg ? (
            <div style={{ font: '500 10.5px Figtree', color: ink(0.5) }}>
              ✓ Using your latest weigh-in{latest.date ? ` (${shortDate(latest.date)})` : ''}
            </div>
          ) : (
            <div
              onClick={() => setWeight(String(latest.kg))}
              style={{
                display: 'inline-block',
                background: COLORS.greenTint,
                border: `1px solid ${COLORS.green}`,
                borderRadius: 999,
                padding: '5px 11px',
                font: '700 10.5px Figtree',
                color: COLORS.green,
                cursor: 'pointer',
              }}
            >
              ↓ Use my latest weigh-in · {latest.kg} kg{latest.date ? ` (${shortDate(latest.date)})` : ''}
            </div>
          )}
        </div>
      )}

      <div style={label}>Sex</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['male', 'female'] as Sex[]).map((k) => (
          <div key={k} onClick={() => setSex(k)} style={chip(sex === k)}>
            {k === 'male' ? 'Male' : 'Female'}
          </div>
        ))}
      </div>

      <div style={label}>Activity</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        {acts.map(([k, l]) => (
          <div key={k} onClick={() => setActivity(k)} style={chip(activity === k)}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ font: '500 10.5px Figtree', color: ink(0.45), marginBottom: 12 }}>
        {acts.find((x) => x[0] === activity)?.[2]}
      </div>

      {goal !== 'maintain' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ ...label, marginBottom: 0, flex: 1 }}>Goal weight (kg, optional)</div>
          <input
            value={goalWeight}
            onChange={(e) => setGoalWeight(e.target.value)}
            inputMode="decimal"
            placeholder="—"
            style={{ ...input, width: 90 }}
          />
        </div>
      )}

      {!ready ? (
        <div style={note('#FBF9F3', COLORS.cardBorder)}>Fill in weight, height and age to see your numbers.</div>
      ) : (
        <>
          {/* Smart notes */}
          {Math.abs(sinceSet) >= 1 && (
            <div style={note('#EAF5EE', '#CDE6D8')}>
              <b>
                You've {sinceSet < 0 ? 'lost' : 'gained'} {Math.abs(sinceSet)} kg
              </b>{' '}
              since your goals were set ({bio.weight} → {w} kg). A {sinceSet < 0 ? 'lighter' : 'heavier'} body
              burns about {fmt(Math.abs(burnShift))} kcal/day {sinceSet < 0 ? 'less' : 'more'}, so the numbers
              below are adjusted{goal === 'cut' ? ' to keep you in a deficit' : ''}.
            </div>
          )}

          {measured ? (
            <div style={note('#FFF8EC', '#F3E2C2')}>
              <b>From your own logs:</b> over the last {measured.spanDays} days you ate about{' '}
              {fmt(measured.avgIntake)} kcal/day and your weight moved {sign(measured.kgPerWeek)} kg/week. That
              means you really burn about <b>{fmt(measured.tdee)} kcal/day</b> (the formula guesses{' '}
              {fmt(formulaTdee)}).
              <div
                onClick={() => setUseMeasured(!useMeasured)}
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  font: '700 11.5px Figtree',
                  color: COLORS.ink,
                }}
              >
                <Toggle on={useMeasured} />
                Use my real burn instead of the formula
              </div>
            </div>
          ) : (
            <div style={{ font: '500 10.5px/1.5 Figtree', color: ink(0.45), marginBottom: 10 }}>
              Tip: weigh in weekly and tick off your meals for 2+ weeks — Plately will then check this estimate
              against your real results.
            </div>
          )}

          {plan.floored && (
            <div style={note('#FDEEEA', '#F3CFC4')}>
              That pace would take you below a safe minimum, so calories are held at {fmt(plan.floorKcal)}.
              Expect a slower {Math.abs(plan.weeklyKg)} kg/week.
            </div>
          )}

          {/* Result */}
          <div style={card}>
            <div style={{ font: '600 11px Figtree', color: ink(0.55) }}>Your daily calories</div>
            <div style={{ font: "700 28px 'Space Grotesk'", color: COLORS.ink, margin: '2px 0 2px' }}>
              {fmt(plan.kcalMin)}–{fmt(plan.kcalMax)}
              <span style={{ font: '600 12px Figtree', color: ink(0.4) }}> kcal</span>
            </div>
            <div style={{ font: '500 11px Figtree', color: ink(0.55), marginBottom: 12 }}>
              {goal === 'maintain'
                ? 'About what you burn — your weight should hold steady.'
                : `${sign(plan.weeklyKg)} kg/week expected${
                    plan.weeksToGoal ? ` · ${goalWeight} kg in ~${plan.weeksToGoal} weeks (around ${goalDate})` : ''
                  }`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                ['Protein', plan.protein, MACRO.protein.color],
                ['Carbs', plan.carbs, MACRO.carbs.color],
                ['Fat', plan.fat, MACRO.fat.color],
              ].map(([l, v, c]) => (
                <div
                  key={l as string}
                  style={{ flex: 1, background: COLORS.appBg, borderRadius: 12, padding: '9px 6px', textAlign: 'center' }}
                >
                  <div style={{ font: "700 16px 'Space Grotesk'", color: c as string }}>{v as number}g</div>
                  <div style={{ font: '600 9.5px Figtree', color: ink(0.5) }}>{l as string}</div>
                </div>
              ))}
            </div>
            <div style={{ font: '500 10.5px Figtree', color: ink(0.5), marginTop: 10, textAlign: 'center' }}>
              Also aim for ~{plan.fibre} g fibre and {plan.waterL} L+ water a day
            </div>

            <div
              onClick={() => setShowWorking(!showWorking)}
              style={{ font: '700 11px Figtree', color: COLORS.green, marginTop: 12, cursor: 'pointer' }}
            >
              {showWorking ? '▾' : '▸'} How we worked it out
            </div>
            {showWorking && (
              <ol style={{ margin: '8px 0 0', paddingLeft: 18, font: '500 11px/1.6 Figtree', color: ink(0.65) }}>
                <li>
                  Resting burn (Mifflin–St Jeor formula): <b>{fmt(plan.bmr)} kcal</b>
                </li>
                <li>
                  {plan.tdeeSource === 'logs' ? (
                    <>
                      Daily burn, measured from your logs: <b>{fmt(plan.tdee)} kcal</b>
                    </>
                  ) : (
                    <>
                      × {ACTIVITY_FACTOR[activity]} for activity = daily burn <b>{fmt(plan.tdee)} kcal</b>
                    </>
                  )}
                </li>
                <li>
                  {plan.dailyAdj === 0
                    ? 'No deficit or surplus'
                    : `${sign(plan.dailyAdj)} kcal/day (1 kg ≈ 7,700 kcal)`}{' '}
                  → <b>{fmt(plan.kcal)} kcal</b>, ±100 as your window
                </li>
                <li>
                  Protein: {plan.proteinPerKg} g × {plan.proteinWeight} kg
                  {plan.proteinWeight < Math.round(w) ? ' (adjusted for body fat)' : ''} = <b>{plan.protein} g</b>
                </li>
                <li>
                  Fat: ~30% of calories ÷ 9 = <b>{plan.fat} g</b>
                </li>
                <li>
                  Carbs: the calories left ÷ 4 = <b>{plan.carbs} g</b>
                </li>
                <li>Fibre: 14 g per 1,000 kcal · Water: ~33 ml per kg</li>
              </ol>
            )}
          </div>

          {/* Compare with current goals */}
          <div style={{ ...card, background: COLORS.appBg }}>
            <div style={{ display: 'flex', font: '600 10px Figtree', color: ink(0.5), marginBottom: 6 }}>
              <div style={{ flex: 1 }} />
              <div style={{ width: 92, textAlign: 'right' }}>Now</div>
              <div style={{ width: 92, textAlign: 'right' }}>New</div>
            </div>
            {[
              ['Calories', `${fmt(win.min)}–${fmt(win.max)}`, `${fmt(plan.kcalMin)}–${fmt(plan.kcalMax)}`],
              ['Protein', `${goals.protein} g`, `${plan.protein} g`],
              ['Carbs', `${goals.carbs} g`, `${plan.carbs} g`],
              ['Fat', `${goals.fat} g`, `${plan.fat} g`],
            ].map(([l, now, next]) => (
              <div key={l} style={{ display: 'flex', font: '600 12px Figtree', color: COLORS.ink, padding: '3px 0' }}>
                <div style={{ flex: 1, color: ink(0.6) }}>{l}</div>
                <div style={{ width: 92, textAlign: 'right', color: ink(0.5) }}>{now}</div>
                <div style={{ width: 92, textAlign: 'right', fontFamily: 'Space Grotesk' }}>{next}</div>
              </div>
            ))}
            <div style={{ font: '500 10.5px/1.45 Figtree', color: ink(0.5), marginTop: 8 }}>
              If your current numbers came from a dietitian or coach, check with them before replacing them.
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <div
          onClick={close}
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
          onClick={ready ? apply : undefined}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: 14,
            borderRadius: 14,
            background: ready ? COLORS.green : '#BFD9C8',
            font: '700 13px Figtree',
            color: '#fff',
            cursor: ready ? 'pointer' : 'default',
          }}
        >
          Apply to my goals
        </div>
      </div>
    </Sheet>
  )
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <div
      style={{
        width: 34,
        height: 20,
        borderRadius: 99,
        background: on ? COLORS.green : '#D9D2C3',
        position: 'relative',
        flex: 'none',
        transition: 'background .15s',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 16 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
        }}
      />
    </div>
  )
}
