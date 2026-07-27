import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import { round, foodById, tag, toNum } from '../../lib/calc'
import Sheet, { CloseButton } from '../Sheet'
import { Search, Plus, Close } from '../../icons'
import type { Food, Meal, MealItem } from '../../types'

const r1 = (n: number) => Math.round(n * 10) / 10
const SECTIONS: Meal['section'][] = ['breakfast', 'lunch', 'dinner']

/**
 * Recover the structured foods a built meal came from. New built meals store
 * `items` directly; meals built before that field existed are reconstructed by
 * parsing their "<grams> g <name>" ingredient lines back to library foods.
 */
function itemsForMeal(meal: Meal, foods: Food[]): MealItem[] {
  if (meal.items && meal.items.length) return meal.items
  const out: MealItem[] = []
  for (const line of meal.ingredients) {
    const m = /^\s*([\d.,]+)\s*g\s+(.+?)\s*$/.exec(line)
    if (!m) continue
    const name = m[2].trim().toLowerCase()
    const food = foods.find((f) => f.name.toLowerCase() === name)
    if (food) out.push({ foodId: food.id, grams: toNum(m[1]) })
  }
  return out
}

export default function MealBuilderSheet() {
  const show = useStore((s) => s.overlay === 'mealbuilder')
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const editMealId = useStore((s) => s.editMealId)
  const addBuiltMeal = useStore((s) => s.addBuiltMeal)
  const updateBuiltMeal = useStore((s) => s.updateBuiltMeal)
  const close = useStore((s) => s.closeOverlay)

  const [name, setName] = useState('')
  const [section, setSection] = useState<Meal['section']>('lunch')
  const [items, setItems] = useState<MealItem[]>([])
  const [q, setQ] = useState('')

  // Prefill from the meal when opening in edit mode; start blank otherwise.
  useEffect(() => {
    if (!show) return
    if (editMealId) {
      const meal = meals.find((m) => m.id === editMealId)
      if (meal) {
        setName(meal.name)
        setSection(meal.section)
        setItems(itemsForMeal(meal, foods))
        setQ('')
        return
      }
    }
    setName('')
    setSection('lunch')
    setItems([])
    setQ('')
    // Load once per open / target change; foods/meals are read as a snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, editMealId])

  if (!show) return null

  const editing = !!editMealId

  const totals = items.reduce(
    (acc, it) => {
      const fo = foodById(foods, it.foodId)
      if (!fo) return acc
      const g = it.grams / 100
      acc.kcal += fo.kcal * g
      acc.p += fo.p * g
      acc.c += fo.c * g
      acc.f += fo.f * g
      return acc
    },
    { kcal: 0, p: 0, c: 0, f: 0 },
  )

  const query = q.trim().toLowerCase()
  const matches = query ? foods.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 8) : []
  const canSave = name.trim().length > 0 && items.length > 0

  const save = () => {
    if (!canSave) return
    const meal: Meal = {
      id: editMealId ?? 'm' + Date.now(),
      name: name.trim(),
      section,
      kcal: round(totals.kcal),
      p: r1(totals.p),
      c: r1(totals.c),
      f: r1(totals.f),
      ingredients: items.map((it) => `${it.grams} g ${foodById(foods, it.foodId)?.name ?? ''}`.trim()),
      method: [],
      items,
    }
    if (editing) updateBuiltMeal(meal.id, meal)
    else addBuiltMeal(meal)
  }

  const chip = (active: boolean) =>
    ({
      flex: 1,
      textAlign: 'center' as const,
      padding: '8px 2px',
      borderRadius: 11,
      background: active ? COLORS.greenTint : '#fff',
      border: `1px solid ${active ? COLORS.green : COLORS.inputBorder}`,
      font: '600 11px Figtree',
      color: active ? COLORS.green : ink(0.6),
      cursor: 'pointer',
      textTransform: 'capitalize' as const,
    }) as const

  return (
    <Sheet zIndex={65} onScrim={close} scroll maxHeight="94%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>
            {editing ? 'Edit meal' : 'Build a meal'}
          </div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            {editing ? 'Add or remove foods — macros update automatically.' : 'Combine foods and save it to reuse.'}
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Meal name (e.g. My protein oats)"
        style={{
          width: '100%',
          border: `1px solid ${COLORS.inputBorder}`,
          borderRadius: 12,
          padding: '11px 13px',
          font: '500 13.5px Figtree',
          color: COLORS.ink,
          background: '#fff',
          outline: 'none',
          marginBottom: 10,
        }}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {SECTIONS.map((s) => (
          <div key={s} onClick={() => setSection(s)} style={chip(section === s)}>
            {s}
          </div>
        ))}
      </div>

      {/* running totals */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'linear-gradient(135deg,#EAF5EE,#F3F0E7)',
          border: '1px solid #CDE6D6',
          borderRadius: 14,
          padding: '10px 12px',
          marginBottom: 14,
        }}
      >
        {[
          ['kcal', round(totals.kcal), COLORS.green],
          ['P', r1(totals.p), '#E4572E'],
          ['C', r1(totals.c), '#EFA23C'],
          ['F', r1(totals.f), '#5B8DEF'],
        ].map(([label, val, color]) => (
          <div key={label as string} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ font: "700 16px 'Space Grotesk'", color: color as string }}>{val as number}</div>
            <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>{label as string}</div>
          </div>
        ))}
      </div>

      {/* added items */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {items.map((it, idx) => {
            const fo = foodById(foods, it.foodId)
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fff',
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 12,
                  padding: '8px 10px 8px 12px',
                }}
              >
                <div style={{ flex: 1, font: '500 12.5px Figtree', color: COLORS.ink }}>{fo?.name}</div>
                <input
                  value={String(it.grams)}
                  onChange={(e) =>
                    setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, grams: toNum(e.target.value) } : x)))
                  }
                  inputMode="decimal"
                  style={{
                    width: 58,
                    border: `1px solid ${COLORS.inputBorder}`,
                    borderRadius: 9,
                    padding: '6px 4px',
                    font: "600 12px 'Space Grotesk'",
                    textAlign: 'center',
                    color: COLORS.ink,
                    background: '#fff',
                    outline: 'none',
                  }}
                />
                <span style={{ font: '500 11px Figtree', color: ink(0.4) }}>g</span>
                <div
                  onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                  style={{ cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <Close size={14} color="#C9C1B2" strokeWidth={2.4} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* add-food search */}
      <div style={{ font: '600 11px Figtree', color: ink(0.5), marginBottom: 6 }}>Add a food</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          padding: '9px 12px',
          marginBottom: matches.length ? 8 : 16,
        }}
      >
        <Search />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your foods…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'none', font: '500 13px Figtree', color: COLORS.ink }}
        />
      </div>
      {matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {matches.map((f) => {
            const t = tag(f)
            return (
              <div
                key={f.id}
                onClick={() => {
                  setItems((arr) => [...arr, { foodId: f.id, grams: 100 }])
                  setQ('')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#fff',
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderRadius: 12,
                  padding: '9px 12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: t.tagBg,
                    color: t.tagColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: '700 10px Figtree',
                    flex: 'none',
                  }}
                >
                  {t.tagInitial}
                </div>
                <div style={{ flex: 1, font: '600 12px Figtree', color: COLORS.ink }}>{f.name}</div>
                <Plus color={COLORS.green} />
              </div>
            )
          })}
        </div>
      )}

      <div
        onClick={save}
        style={{
          textAlign: 'center',
          padding: 14,
          borderRadius: 14,
          background: canSave ? COLORS.green : '#C9C1B2',
          font: '700 13px Figtree',
          color: '#fff',
          cursor: canSave ? 'pointer' : 'default',
        }}
      >
        {editing ? 'Save changes' : 'Save meal'}
      </div>
    </Sheet>
  )
}
