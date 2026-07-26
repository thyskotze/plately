import { useStore } from '../../store'
import { SLOTS } from '../../types'
import { DAYS } from '../../seed'
import { round, mealById } from '../../lib/calc'
import { COLORS, ink } from '../../tokens'
import { Minus, Plus } from '../../icons'
import Sheet from '../Sheet'

export default function MealAmountSheet() {
  const show = useStore((s) => s.overlay === 'mealamount' && !!s.chosenMealId)
  const meals = useStore((s) => s.meals)
  const chosenMealId = useStore((s) => s.chosenMealId)
  const mVal = useStore((s) => s.mVal)
  const pickSlot = useStore((s) => s.pickSlot)
  const pickDay = useStore((s) => s.pickDay)
  const mStep = useStore((s) => s.mStep)
  const confirmMeal = useStore((s) => s.confirmMeal)
  const closeOverlay = useStore((s) => s.closeOverlay)
  const editRef = useStore((s) => s.editRef)
  const deleteEditItem = useStore((s) => s.deleteEditItem)
  const isEdit = !!editRef

  if (!show || !chosenMealId) return null
  const meal = mealById(meals, chosenMealId)
  if (!meal) return null

  const pickDest =
    SLOTS.find((x) => x.key === pickSlot)!.label + (pickDay !== 1 ? ' · ' + DAYS[pickDay].dow : '')

  const circleBtn = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#fff',
    border: `1px solid ${COLORS.inputBorder}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as const

  const tile = (bg: string, color: string, val: string, label: string) => (
    <div style={{ flex: 1, textAlign: 'center', background: bg, borderRadius: 12, padding: '9px 4px' }}>
      <div style={{ font: '700 15px Space Grotesk', color }}>{val}</div>
      <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>{label}</div>
    </div>
  )

  return (
    <Sheet zIndex={60} onScrim={closeOverlay}>
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>{meal.name}</div>
        <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
          {meal.kcal} kcal · per serving
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          margin: '16px 0',
        }}
      >
        <div onClick={() => mStep(-0.5)} style={circleBtn}>
          <Minus color={COLORS.ink} />
        </div>
        <div style={{ textAlign: 'center', minWidth: 96 }}>
          <div style={{ font: '700 40px/1 Space Grotesk', color: COLORS.ink }}>{mVal}</div>
          <div style={{ font: '500 12px Figtree', color: ink(0.5), marginTop: 2 }}>
            {mVal === 1 ? 'serving' : 'servings'}
          </div>
        </div>
        <div onClick={() => mStep(0.5)} style={circleBtn}>
          <Plus size={20} color={COLORS.ink} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {tile('#EAF5EE', '#2E9E5B', String(round(meal.kcal * mVal)), 'kcal')}
        {tile('#FBEEE9', '#E4572E', round(meal.p * mVal) + 'g', 'protein')}
        {tile('#FBF1E1', '#EFA23C', round(meal.c * mVal) + 'g', 'carbs')}
        {tile('#E9EFFB', '#5B8DEF', round(meal.f * mVal) + 'g', 'fat')}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div
          onClick={isEdit ? deleteEditItem : closeOverlay}
          style={{
            flex: 'none',
            padding: '14px 20px',
            borderRadius: 14,
            background: '#fff',
            border: `1px solid ${isEdit ? '#F0DCD5' : COLORS.inputBorder}`,
            font: '700 13px Figtree',
            color: isEdit ? '#E4572E' : COLORS.ink,
            cursor: 'pointer',
          }}
        >
          {isEdit ? 'Remove' : 'Cancel'}
        </div>
        <div
          onClick={confirmMeal}
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
          {isEdit ? 'Save changes' : `Add to ${pickDest}`}
        </div>
      </div>
    </Sheet>
  )
}
