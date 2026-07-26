import { useStore } from '../../store'
import { SLOTS } from '../../types'
import { mealById } from '../../lib/calc'
import { COLORS, ink, MACRO } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'

const TODAY = 1

export default function MealDetailSheet() {
  const show = useStore((s) => s.overlay === 'mealdetail' && !!s.chosenMealId)
  const meals = useStore((s) => s.meals)
  const chosenMealId = useStore((s) => s.chosenMealId)
  const addMeal = useStore((s) => s.addMeal)
  const close = useStore((s) => s.closeOverlay)

  if (!show || !chosenMealId) return null
  const meal = mealById(meals, chosenMealId)
  if (!meal) return null

  const macro = (label: string, val: number, color: string) => (
    <div style={{ flex: 1, textAlign: 'center', background: '#fff', border: `1px solid ${COLORS.cardBorder}`, borderRadius: 12, padding: '10px 4px' }}>
      <div style={{ font: '700 15px Space Grotesk', color }}>{val}</div>
      <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>{label}</div>
    </div>
  )

  return (
    <Sheet zIndex={60} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ flex: 1, paddingRight: 10 }}>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>{meal.name}</div>
          {meal.source && (
            <div style={{ font: '500 11px Figtree', color: ink(0.5) }}>{meal.source}</div>
          )}
        </div>
        <CloseButton onClick={close} />
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
        {macro('kcal', meal.kcal, COLORS.green)}
        {macro('protein', meal.p, MACRO.protein.color)}
        {macro('carbs', meal.c, MACRO.carbs.color)}
        {macro('fat', meal.f, MACRO.fat.color)}
      </div>

      <div style={{ font: '700 12px Figtree', color: ink(0.6), margin: '4px 0 8px' }}>
        Ingredients (1 serving)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {meal.ingredients.map((ing, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: COLORS.green, marginTop: 5, flex: 'none' }} />
            <div style={{ font: '500 12.5px/1.4 Figtree', color: ink(0.75) }}>{ing}</div>
          </div>
        ))}
      </div>

      {meal.method.length > 0 && (
        <>
          <div style={{ font: '700 12px Figtree', color: ink(0.6), margin: '4px 0 8px' }}>Method</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {meal.method.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: COLORS.greenTint,
                    color: COLORS.green,
                    font: '700 10px Figtree',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ font: '500 12.5px/1.45 Figtree', color: ink(0.75) }}>{step}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ font: '700 12px Figtree', color: ink(0.6), marginBottom: 8 }}>
        Add to today
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {SLOTS.map(({ key, label }) => (
          <div
            key={key}
            onClick={() => addMeal(TODAY, key, meal.id, 1)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '11px 2px',
              borderRadius: 12,
              background: COLORS.green,
              font: '700 11px Figtree',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </Sheet>
  )
}
