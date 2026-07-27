import { useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { Plus, Close } from '../../icons'

export default function MealSlotsSheet() {
  const show = useStore((s) => s.overlay === 'slots')
  const mealSlots = useStore((s) => s.mealSlots)
  const addSlot = useStore((s) => s.addSlot)
  const renameSlot = useStore((s) => s.renameSlot)
  const removeSlot = useStore((s) => s.removeSlot)
  const moveSlot = useStore((s) => s.moveSlot)
  const close = useStore((s) => s.closeOverlay)

  const [newName, setNewName] = useState('')

  if (!show) return null

  const add = () => {
    if (!newName.trim()) return
    addSlot(newName)
    setNewName('')
  }

  const arrowBtn = (disabled: boolean, onClick: () => void, glyph: string) => (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        border: `1px solid ${COLORS.inputBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: '700 12px Figtree',
        color: disabled ? ink(0.2) : ink(0.55),
        background: '#fff',
        cursor: disabled ? 'default' : 'pointer',
        flex: 'none',
      }}
    >
      {glyph}
    </div>
  )

  return (
    <Sheet zIndex={65} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Your meals</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            Add, rename or reorder the meals in your day.
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
        {mealSlots.map((slot, i) => (
          <div
            key={slot.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              padding: '7px 8px 7px 12px',
            }}
          >
            <input
              value={slot.label}
              onChange={(e) => renameSlot(slot.key, e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'none',
                font: '600 13px Figtree',
                color: COLORS.ink,
                minWidth: 0,
              }}
            />
            {arrowBtn(i === 0, () => moveSlot(slot.key, -1), '↑')}
            {arrowBtn(i === mealSlots.length - 1, () => moveSlot(slot.key, 1), '↓')}
            <div
              onClick={mealSlots.length <= 1 ? undefined : () => removeSlot(slot.key)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: mealSlots.length <= 1 ? 'default' : 'pointer',
                flex: 'none',
                opacity: mealSlots.length <= 1 ? 0.3 : 1,
              }}
            >
              <Close size={15} color="#E4572E" strokeWidth={2.4} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ font: '600 11px Figtree', color: ink(0.5), margin: '18px 0 6px' }}>Add a meal</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="e.g. Coffee, Pre-workout, Snack 2"
          style={{
            flex: 1,
            border: `1px solid ${COLORS.inputBorder}`,
            borderRadius: 12,
            padding: '11px 13px',
            font: '500 13px Figtree',
            color: COLORS.ink,
            background: '#fff',
            outline: 'none',
          }}
        />
        <div
          onClick={add}
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '11px 16px',
            borderRadius: 12,
            background: newName.trim() ? COLORS.green : '#C9C1B2',
            font: '700 12.5px Figtree',
            color: '#fff',
            cursor: newName.trim() ? 'pointer' : 'default',
          }}
        >
          <Plus size={14} color="#fff" />
          Add
        </div>
      </div>

      <div style={{ marginTop: 16, font: '500 10.5px/1.5 Figtree', color: ink(0.4), textAlign: 'center' }}>
        These meals apply to every day. Removing one clears its logged items.
      </div>
    </Sheet>
  )
}
