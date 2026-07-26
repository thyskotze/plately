import { useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import { tag, macroLine, round } from '../../lib/calc'
import { Plus, Sparkle, ChevronRight, Search, Barcode, Grid, Pencil } from '../../icons'

export default function Library() {
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const search = useStore((s) => s.search)
  const openAiImport = useStore((s) => s.openAiImport)
  const openNewFood = useStore((s) => s.openNewFood)
  const openEditFood = useStore((s) => s.openEditFood)
  const openMealDetail = useStore((s) => s.openMealDetail)
  const openCnfSearch = useStore((s) => s.openCnfSearch)
  const openBarcodeScan = useStore((s) => s.openBarcodeScan)
  const setSearch = useStore((s) => s.setSearch)

  const [tab, setTab] = useState<'foods' | 'meals'>('foods')
  const q = search.toLowerCase()
  const filteredFoods = foods.filter((f) => f.name.toLowerCase().includes(q))
  const filteredMeals = meals.filter((m) => m.name.toLowerCase().includes(q))

  const tabBtn = (key: 'foods' | 'meals', label: string) => {
    const on = tab === key
    return (
      <div
        onClick={() => setTab(key)}
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
    <div style={{ padding: '6px 22px 24px', animation: 'fade .25s' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ font: "700 22px 'Bricolage Grotesque'", color: '#1a1a17' }}>Library</div>
        {tab === 'foods' && (
          <div
            onClick={openNewFood}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#2E9E5B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Plus size={17} color="#fff" />
          </div>
        )}
      </div>

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
        {tabBtn('meals', `Meals (${meals.length})`)}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#fff',
          border: '1px solid #EFE9DD',
          borderRadius: 12,
          padding: '9px 12px',
          marginBottom: 10,
        }}
      >
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'foods' ? 'Search foods…' : 'Search meals…'}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'none',
            font: '500 13px Figtree',
            color: '#1a1a17',
          }}
        />
      </div>

      {tab === 'foods' ? (
        <>
          <div
            onClick={openAiImport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'linear-gradient(135deg,#EAF5EE,#F3F0E7)',
              border: '1px solid #CDE6D6',
              borderRadius: 16,
              padding: '13px 14px',
              margin: '2px 0 10px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: '#2E9E5B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <Sparkle />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 13.5px Figtree', color: '#1a1a17' }}>Bulk import with AI</div>
              <div style={{ font: '500 11px Figtree', color: ink(0.55) }}>
                Paste a list from ChatGPT or Claude
              </div>
            </div>
            <ChevronRight />
          </div>

          <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
            <div onClick={openBarcodeScan} style={chipStyle}>
              <Barcode />
              <span style={chipLabel}>Scan barcode</span>
            </div>
            <div onClick={openCnfSearch} style={chipStyle}>
              <Grid />
              <span style={chipLabel}>Food search</span>
            </div>
            <div onClick={openNewFood} style={chipStyle}>
              <Pencil />
              <span style={chipLabel}>Enter manually</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredFoods.map((f) => {
              const { tagColor, tagBg, tagInitial } = tag(f)
              return (
                <div key={f.id} onClick={() => openEditFood(f.id)} style={cardStyle}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: tagBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: '700 12px Figtree',
                      color: tagColor,
                      flex: 'none',
                    }}
                  >
                    {tagInitial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 13px Figtree', color: '#1a1a17' }}>{f.name}</div>
                    <div style={{ font: '500 10.5px Figtree', color: ink(0.45) }}>{macroLine(f)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ font: "700 13px 'Space Grotesk'", color: '#1a1a17' }}>{f.kcal}</div>
                    <div style={{ font: '500 9.5px Figtree', color: ink(0.4) }}>per 100g</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: COLORS.greenTint,
              border: '1px solid #CDE6D6',
              borderRadius: 12,
              padding: '9px 12px',
              margin: '2px 0 10px',
            }}
          >
            <span style={{ fontSize: 15 }}>🥗</span>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 11.5px Figtree', color: COLORS.ink }}>
                Recipes by Coach Vicky
              </div>
              <div style={{ font: '500 10px Figtree', color: ink(0.55) }}>
                Coached by Vicks · BTC 2026 menu
              </div>
            </div>
          </div>
          {filteredMeals.map((m) => (
            <div key={m.id} onClick={() => openMealDetail(m.id)} style={cardStyle}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: COLORS.greenTint,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '700 12px Figtree',
                  color: COLORS.green,
                  flex: 'none',
                  textTransform: 'capitalize',
                }}
              >
                {m.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 13px Figtree', color: '#1a1a17' }}>{m.name}</div>
                <div style={{ font: '500 10.5px Figtree', color: ink(0.45), textTransform: 'capitalize' }}>
                  {m.section} · {round(m.p)}P {round(m.c)}C {round(m.f)}F
                </div>
                {m.source && (
                  <div style={{ font: '600 9.5px Figtree', color: COLORS.green, marginTop: 1 }}>
                    by Coached by Vicks
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: "700 13px 'Space Grotesk'", color: '#1a1a17' }}>{m.kcal}</div>
                <div style={{ font: '500 9.5px Figtree', color: ink(0.4) }}>per serving</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const chipStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 5,
  background: '#fff',
  border: '1px solid #EFE9DD',
  borderRadius: 14,
  padding: '11px 4px',
  cursor: 'pointer',
} as const

const chipLabel = { font: '600 10px Figtree', color: ink(0.6) } as const

const cardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: '#fff',
  border: '1px solid #EFE9DD',
  borderRadius: 14,
  padding: '11px 14px',
  cursor: 'pointer',
} as const
