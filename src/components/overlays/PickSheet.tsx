import { useStore } from '../../store'
import { SLOTS } from '../../types'
import { DAYS } from '../../seed'
import { tag, macroLine, round } from '../../lib/calc'
import { COLORS, ink } from '../../tokens'
import { Search } from '../../icons'
import Sheet, { CloseButton } from '../Sheet'

export default function PickSheet() {
  const show = useStore((s) => s.overlay === 'pick')
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const pickSearch = useStore((s) => s.pickSearch)
  const pickSlot = useStore((s) => s.pickSlot)
  const pickDay = useStore((s) => s.pickDay)
  const pickTab = useStore((s) => s.pickTab)
  const setPickSearch = useStore((s) => s.setPickSearch)
  const setPickTab = useStore((s) => s.setPickTab)
  const chooseFood = useStore((s) => s.chooseFood)
  const chooseMeal = useStore((s) => s.chooseMeal)
  const closeOverlay = useStore((s) => s.closeOverlay)

  if (!show) return null

  const pickDest =
    SLOTS.find((x) => x.key === pickSlot)!.label +
    (pickDay !== 1 ? ' · ' + DAYS[pickDay].dow : '')

  const q = pickSearch.toLowerCase()
  const foodList = foods.filter((f) => f.name.toLowerCase().includes(q))
  const mealList = meals.filter((m) => m.name.toLowerCase().includes(q))

  const tabBtn = (key: 'foods' | 'meals', label: string) => {
    const on = pickTab === key
    return (
      <div
        onClick={() => setPickTab(key)}
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '8px 0',
          borderRadius: 10,
          background: on ? '#fff' : 'transparent',
          boxShadow: on ? '0 1px 3px rgba(26,26,23,.1)' : 'none',
          font: '700 12px Figtree',
          color: on ? COLORS.green : ink(0.5),
          cursor: 'pointer',
        }}
      >
        {label}
      </div>
    )
  }

  return (
    <Sheet zIndex={50} onScrim={closeOverlay}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ font: "700 17px 'Bricolage Grotesque'", color: COLORS.ink }}>
            Add to {pickDest}
          </div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            Pick a food or a saved meal
          </div>
        </div>
        <CloseButton onClick={closeOverlay} />
      </div>

      {/* Foods | Meals toggle */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#EFE9DD',
          borderRadius: 12,
          padding: 3,
          marginBottom: 12,
        }}
      >
        {tabBtn('foods', 'Foods')}
        {tabBtn('meals', 'Meals')}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          padding: '9px 12px',
          marginBottom: 12,
        }}
      >
        <Search />
        <input
          value={pickSearch}
          onChange={(e) => setPickSearch(e.target.value)}
          placeholder={pickTab === 'foods' ? 'Search your foods…' : 'Search saved meals…'}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'none',
            font: '500 13px Figtree',
            color: COLORS.ink,
          }}
        />
      </div>

      <div
        className="noscroll"
        style={{ overflowY: 'auto', maxHeight: '52vh', display: 'flex', flexDirection: 'column', gap: 7 }}
      >
        {pickTab === 'foods'
          ? foodList.map((f) => {
              const t = tag(f)
              return (
                <div
                  key={f.id}
                  onClick={() => chooseFood(f.id)}
                  style={rowStyle}
                >
                  <div style={{ ...tileStyle, background: t.tagBg, color: t.tagColor }}>
                    {t.tagInitial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 12.5px Figtree', color: COLORS.ink }}>{f.name}</div>
                    <div style={{ font: '500 10px Figtree', color: ink(0.45) }}>{macroLine(f)}</div>
                  </div>
                  <div style={{ font: '700 12px Space Grotesk', color: ink(0.6) }}>{f.kcal}</div>
                </div>
              )
            })
          : mealList.map((m) => (
              <div key={m.id} onClick={() => chooseMeal(m.id)} style={rowStyle}>
                <div style={{ ...tileStyle, background: COLORS.greenTint, color: COLORS.green }}>
                  {m.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 12.5px Figtree', color: COLORS.ink }}>{m.name}</div>
                  <div style={{ font: '500 10px Figtree', color: ink(0.45) }}>
                    {round(m.p)}P {round(m.c)}C {round(m.f)}F · {m.section}
                  </div>
                </div>
                <div style={{ font: '700 12px Space Grotesk', color: ink(0.6) }}>{m.kcal}</div>
              </div>
            ))}
      </div>
    </Sheet>
  )
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: '#fff',
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: 13,
  padding: '10px 13px',
  cursor: 'pointer',
} as const

const tileStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: '700 11px Figtree',
  flex: 'none',
} as const
