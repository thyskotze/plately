import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { Search, Plus, Check } from '../../icons'
import {
  cnfFoodList,
  cnfFood,
  CNF_ATTRIBUTION,
  CNF_DISCLAIMER,
  type CnfListItem,
} from '../../lib/cnf'

export default function CnfSearchSheet() {
  const show = useStore((s) => s.overlay === 'cnfsearch')
  const close = useStore((s) => s.closeOverlay)
  const addImportedFood = useStore((s) => s.addImportedFood)
  const toast = useStore((s) => s.showToast)

  const [list, setList] = useState<CnfListItem[] | null>(null)
  const [loadErr, setLoadErr] = useState(false)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [added, setAdded] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let alive = true
    if (show && !list && !loadErr) {
      cnfFoodList()
        .then((l) => alive && setList(l))
        .catch(() => alive && setLoadErr(true))
    }
    return () => {
      alive = false
    }
  }, [show, list, loadErr])

  if (!show) return null

  const query = q.trim().toLowerCase()
  const results = query && list ? list.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 40) : []

  const addFood = async (item: CnfListItem) => {
    setBusy(item.code)
    try {
      const food = await cnfFood(item.code, item.name)
      addImportedFood(food)
      setAdded((a) => ({ ...a, [item.code]: true }))
    } catch {
      toast("Couldn't fetch that food — try again")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet zIndex={65} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Search CNF</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            Canadian Nutrient File · 5,690 foods
          </div>
        </div>
        <CloseButton onClick={close} />
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search foods (e.g. cheddar)…"
          autoFocus
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

      <div style={{ minHeight: 120 }}>
        {loadErr ? (
          <div style={{ font: '500 12.5px/1.5 Figtree', color: ink(0.5), textAlign: 'center', padding: '20px 10px' }}>
            Couldn't reach the CNF database. Check your connection and reopen.
          </div>
        ) : !list ? (
          <div style={{ font: '500 12.5px Figtree', color: ink(0.45), textAlign: 'center', padding: '20px 10px' }}>
            Loading foods…
          </div>
        ) : !query ? (
          <div style={{ font: '500 12.5px/1.5 Figtree', color: ink(0.45), textAlign: 'center', padding: '20px 10px' }}>
            Type to search Health Canada's food database. Tap a result to add it to your library.
          </div>
        ) : results.length === 0 ? (
          <div style={{ font: '500 12.5px Figtree', color: ink(0.45), textAlign: 'center', padding: '20px 10px' }}>
            No matches for “{q}”.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {results.map((item) => {
              const isAdded = added[item.code]
              const isBusy = busy === item.code
              return (
                <div
                  key={item.code}
                  onClick={() => !isBusy && !isAdded && addFood(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#fff',
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: 13,
                    padding: '10px 13px',
                    cursor: isAdded ? 'default' : 'pointer',
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  <div style={{ flex: 1, font: '500 12.5px/1.35 Figtree', color: COLORS.ink }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isAdded ? COLORS.green : COLORS.greenTint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                    }}
                  >
                    {isAdded ? <Check size={14} color="#fff" strokeWidth={3} /> : <Plus color={COLORS.green} />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, font: '500 10px/1.5 Figtree', color: ink(0.4), textAlign: 'center' }}>
        {CNF_ATTRIBUTION}
        <br />
        {CNF_DISCLAIMER}
      </div>
    </Sheet>
  )
}
