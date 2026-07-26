import { useStore } from '../../store'
import { CATEGORIES } from '../../types'
import { COLORS, ink } from '../../tokens'
import Sheet from '../Sheet'

export default function NewFoodSheet() {
  const show = useStore((s) => s.overlay === 'newfood')
  const nf = useStore((s) => s.nf)
  const setNf = useStore((s) => s.setNf)
  const saveNewFood = useStore((s) => s.saveNewFood)
  const closeOverlay = useStore((s) => s.closeOverlay)
  const editFoodId = useStore((s) => s.editFoodId)
  const deleteFood = useStore((s) => s.deleteFood)
  const isEdit = !!editFoodId

  if (!show) return null

  const label = { font: '600 11px Figtree', color: ink(0.55), marginBottom: 6 } as const

  const numInput = (color: string) =>
    ({
      width: '100%',
      border: `1px solid ${COLORS.inputBorder}`,
      borderRadius: 12,
      padding: '11px 8px',
      font: '700 15px Space Grotesk',
      textAlign: 'center' as const,
      color,
      background: '#fff',
      outline: 'none',
    }) as const

  const numLabel = {
    textAlign: 'center' as const,
    font: '500 9.5px Figtree',
    color: ink(0.45),
    marginTop: 4,
  }

  return (
    <Sheet zIndex={60} onScrim={closeOverlay} scroll maxHeight="90%">
      <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink, marginBottom: 3 }}>
        {isEdit ? 'Edit food' : 'New food'}
      </div>
      <div style={{ font: '500 11.5px Figtree', color: ink(0.5), marginBottom: 16 }}>
        {isEdit ? 'Update this item in your library.' : 'Add a custom item to your library.'}
      </div>
      <div style={label}>Name</div>
      <input
        value={nf.name}
        onChange={(e) => setNf('name', e.target.value)}
        placeholder="e.g. Homemade granola"
        style={{
          width: '100%',
          border: `1px solid ${COLORS.inputBorder}`,
          borderRadius: 12,
          padding: '11px 13px',
          font: '500 13px Figtree',
          color: COLORS.ink,
          background: '#fff',
          outline: 'none',
          marginBottom: 14,
        }}
      />
      <div style={label}>Category</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {CATEGORIES.map((c) => {
          const active = c === nf.cat
          return (
            <div
              key={c}
              onClick={() => setNf('cat', c)}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                background: active ? COLORS.greenTint : '#fff',
                border: `1px solid ${active ? COLORS.green : COLORS.inputBorder}`,
                font: '600 11px Figtree',
                color: active ? COLORS.green : ink(0.6),
                cursor: 'pointer',
              }}
            >
              {c}
            </div>
          )
        })}
      </div>
      <div style={label}>Nutrition per 100g</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <input
            value={nf.kcal}
            onChange={(e) => setNf('kcal', e.target.value)}
            inputMode="decimal"
            placeholder="0"
            style={numInput('#1a1a17')}
          />
          <div style={numLabel}>kcal</div>
        </div>
        <div style={{ flex: 1 }}>
          <input
            value={nf.p}
            onChange={(e) => setNf('p', e.target.value)}
            inputMode="decimal"
            placeholder="0"
            style={numInput('#E4572E')}
          />
          <div style={numLabel}>protein</div>
        </div>
        <div style={{ flex: 1 }}>
          <input
            value={nf.c}
            onChange={(e) => setNf('c', e.target.value)}
            inputMode="decimal"
            placeholder="0"
            style={numInput('#EFA23C')}
          />
          <div style={numLabel}>carbs</div>
        </div>
        <div style={{ flex: 1 }}>
          <input
            value={nf.f}
            onChange={(e) => setNf('f', e.target.value)}
            inputMode="decimal"
            placeholder="0"
            style={numInput('#5B8DEF')}
          />
          <div style={numLabel}>fat</div>
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
          onClick={saveNewFood}
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
          {isEdit ? 'Save changes' : 'Save to library'}
        </div>
      </div>
      {isEdit && (
        <div
          onClick={deleteFood}
          style={{
            textAlign: 'center',
            padding: '12px 14px',
            marginTop: 10,
            borderRadius: 14,
            background: '#fff',
            border: '1px solid #F0DCD5',
            font: '700 12.5px Figtree',
            color: '#E4572E',
            cursor: 'pointer',
          }}
        >
          Delete food
        </div>
      )}
    </Sheet>
  )
}
