import { useStore } from '../../store'
import { ink, CAT_COLORS } from '../../tokens'
import { foodById, aggregateWeek, qtyLabel, weekMealIngredients } from '../../lib/calc'
import { CATEGORIES } from '../../types'
import { ChevronLeft, Check } from '../../icons'

export default function Shopping() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const shopChecked = useStore((s) => s.shopChecked)
  const nav = useStore((s) => s.nav)
  const toggleShop = useStore((s) => s.toggleShop)

  const agg = aggregateWeek(foods, mealsByDay)
  const ids = Object.keys(agg)
  // Recipe ingredients from saved meals planned this week (keyed distinctly).
  const mealIngs = weekMealIngredients(meals, mealsByDay).map((line) => ({
    line,
    key: 'ing:' + line.toLowerCase(),
  }))
  const total = ids.length + mealIngs.length
  const done =
    ids.filter((id) => shopChecked[id]).length +
    mealIngs.filter((m) => shopChecked[m.key]).length

  return (
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div
          onClick={() => nav('plan')}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid #EFE9DD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft color="#1a1a17" />
        </div>
        <div style={{ font: "700 22px 'Bricolage Grotesque'", color: '#1a1a17' }}>
          Shopping list
        </div>
      </div>

      <div style={{ font: '500 12px Figtree', color: ink(0.5), marginBottom: 12 }}>
        Auto-built from this week's plan · {done}/{total} in cart
      </div>

      <div
        style={{
          height: 8,
          background: '#ECE7DD',
          borderRadius: 99,
          overflow: 'hidden',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            height: '100%',
            background: '#2E9E5B',
            borderRadius: 99,
            width: `${total ? (done / total) * 100 : 0}%`,
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CATEGORIES.map((cat) => {
          const items = ids.filter((id) => foodById(foods, id)?.cat === cat)
          if (!items.length) return null
          return (
            <div key={cat}>
              <div
                style={{
                  font: '700 11px Figtree',
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: CAT_COLORS[cat],
                  marginBottom: 8,
                }}
              >
                {cat}
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #EFE9DD',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {items.map((id) => {
                  const f = foodById(foods, id)!
                  const isDone = !!shopChecked[id]
                  return (
                    <div
                      key={id}
                      onClick={() => toggleShop(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 14px',
                        borderBottom: '1px solid #F4EFE5',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `2px solid ${isDone ? '#2E9E5B' : '#D8D0C0'}`,
                          background: isDone ? '#2E9E5B' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flex: 'none',
                        }}
                      >
                        <Check style={{ opacity: isDone ? 1 : 0 }} />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          font: '500 13px Figtree',
                          color: isDone ? ink(0.4) : '#1a1a17',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ font: "500 11.5px 'Space Grotesk'", color: ink(0.4) }}>
                        {qtyLabel(agg[id])}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {mealIngs.length > 0 && (
          <div>
            <div
              style={{
                font: '700 11px Figtree',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: ink(0.5),
                marginBottom: 8,
              }}
            >
              From your meals
            </div>
            <div style={{ background: '#fff', border: '1px solid #EFE9DD', borderRadius: 16, overflow: 'hidden' }}>
              {mealIngs.map(({ line, key }) => {
                const isDone = !!shopChecked[key]
                return (
                  <div
                    key={key}
                    onClick={() => toggleShop(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 14px',
                      borderBottom: '1px solid #F4EFE5',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `2px solid ${isDone ? '#2E9E5B' : '#D8D0C0'}`,
                        background: isDone ? '#2E9E5B' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                      }}
                    >
                      <Check style={{ opacity: isDone ? 1 : 0 }} />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        font: '500 13px Figtree',
                        color: isDone ? ink(0.4) : '#1a1a17',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}
                    >
                      {line}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
