import { useStore } from '../../store'
import { todayISO, relativeLabel } from '../../lib/dates'
import { round, foodById, toNum, frequentPortions } from '../../lib/calc'
import { COLORS, ink } from '../../tokens'
import { Minus, Plus } from '../../icons'
import Sheet from '../Sheet'

export default function GramsSheet() {
  const show = useStore((s) => s.overlay === 'grams' && !!s.chosenId)
  const foods = useStore((s) => s.foods)
  const chosenId = useStore((s) => s.chosenId)
  const gVal = useStore((s) => s.gVal)
  const pickSlot = useStore((s) => s.pickSlot)
  const pickDate = useStore((s) => s.pickDate)
  const mealSlots = useStore((s) => s.mealSlots)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const gStep = useStore((s) => s.gStep)
  const gSet = useStore((s) => s.gSet)
  const confirmGrams = useStore((s) => s.confirmGrams)
  const closeOverlay = useStore((s) => s.closeOverlay)
  const editRef = useStore((s) => s.editRef)
  const deleteEditItem = useStore((s) => s.deleteEditItem)
  const isEdit = !!editRef

  if (!show || !chosenId) return null
  const food = foodById(foods, chosenId)
  if (!food) return null

  const pickDest =
    (mealSlots.find((x) => x.key === pickSlot)?.label ?? pickSlot) +
    (pickDate !== todayISO() ? ' · ' + relativeLabel(pickDate) : '')

  const chip = (active: boolean) =>
    active
      ? { background: COLORS.greenTint, border: `1px solid ${COLORS.green}`, color: COLORS.green }
      : { background: '#fff', border: `1px solid ${COLORS.inputBorder}`, color: ink(0.6) }

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

  return (
    <Sheet zIndex={60} onScrim={closeOverlay}>
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>{food.name}</div>
        <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
          {food.kcal} kcal · per 100g
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
        <div onClick={() => gStep(-5)} style={circleBtn}>
          <Minus color={COLORS.ink} />
        </div>
        <div style={{ textAlign: 'center', minWidth: 110 }}>
          <input
            value={String(gVal)}
            onChange={(e) => gSet(Math.max(0, toNum(e.target.value)))}
            inputMode="decimal"
            style={{
              width: 110,
              border: 'none',
              borderBottom: `2px solid ${COLORS.inputBorder}`,
              background: 'none',
              font: '700 40px/1 Space Grotesk',
              textAlign: 'center',
              color: COLORS.ink,
              outline: 'none',
              padding: '0 0 2px',
            }}
          />
          <div style={{ font: '500 12px Figtree', color: ink(0.5), marginTop: 4 }}>grams</div>
        </div>
        <div onClick={() => gStep(5)} style={circleBtn}>
          <Plus size={20} color={COLORS.ink} />
        </div>
      </div>
      {/* Presets: the food's own servings, then amounts you keep using, then
          plain fallbacks — deduped so nothing repeats. */}
      {(() => {
        const named = (food.servings || []).map((s) => ({
          key: 'n' + s.label + s.grams,
          grams: s.grams,
          label: s.label,
          sub: `${s.grams}g`,
        }))
        const used = frequentPortions(mealsByDay, food.id).map((u) => ({
          key: 'u' + u.grams,
          grams: u.grams,
          label: `${u.grams}g`,
          sub: `used ${u.count}×`,
        }))
        const taken = new Set([...named, ...used].map((x) => x.grams))
        const plain = [50, 100, 150]
          .filter((g) => !taken.has(g))
          .map((g) => ({ key: 'p' + g, grams: g, label: `${g}g`, sub: '' }))
        const presets = [...named, ...used, ...plain].slice(0, 6)
        if (!presets.length) return null
        return (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            {presets.map((p) => {
              const c = chip(p.grams === gVal)
              return (
                <div
                  key={p.key}
                  onClick={() => gSet(p.grams)}
                  style={{
                    padding: p.sub ? '5px 11px' : '6px 11px',
                    borderRadius: 999,
                    background: c.background,
                    border: c.border,
                    color: c.color,
                    cursor: 'pointer',
                    textAlign: 'center',
                    lineHeight: 1.15,
                  }}
                >
                  <div style={{ font: '600 11.5px Figtree' }}>{p.label}</div>
                  {p.sub && <div style={{ font: '500 9px Figtree', opacity: 0.7 }}>{p.sub}</div>}
                </div>
              )
            })}
          </div>
        )
      })()}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <div
          style={{ flex: 1, textAlign: 'center', background: '#EAF5EE', borderRadius: 12, padding: '9px 4px' }}
        >
          <div style={{ font: '700 15px Space Grotesk', color: '#2E9E5B' }}>
            {round((food.kcal * gVal) / 100)}
          </div>
          <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>kcal</div>
        </div>
        <div
          style={{ flex: 1, textAlign: 'center', background: '#FBEEE9', borderRadius: 12, padding: '9px 4px' }}
        >
          <div style={{ font: '700 15px Space Grotesk', color: '#E4572E' }}>
            {round((food.p * gVal) / 100)}g
          </div>
          <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>protein</div>
        </div>
        <div
          style={{ flex: 1, textAlign: 'center', background: '#FBF1E1', borderRadius: 12, padding: '9px 4px' }}
        >
          <div style={{ font: '700 15px Space Grotesk', color: '#EFA23C' }}>
            {round((food.c * gVal) / 100)}g
          </div>
          <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>carbs</div>
        </div>
        <div
          style={{ flex: 1, textAlign: 'center', background: '#E9EFFB', borderRadius: 12, padding: '9px 4px' }}
        >
          <div style={{ font: '700 15px Space Grotesk', color: '#5B8DEF' }}>
            {round((food.f * gVal) / 100)}g
          </div>
          <div style={{ font: '500 9.5px Figtree', color: ink(0.5) }}>fat</div>
        </div>
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
          onClick={confirmGrams}
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
