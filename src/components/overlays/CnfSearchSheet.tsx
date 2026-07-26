import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { Search, Plus, Check } from '../../icons'
import { cnfFoodList, cnfFood, CNF_ATTRIBUTION, CNF_DISCLAIMER, type CnfListItem } from '../../lib/cnf'
import { usdaSearch, usdaToFood, USDA_ATTRIBUTION, type UsdaItem } from '../../lib/usda'
import type { Food } from '../../types'

type Source = 'cnf' | 'usda'

export default function CnfSearchSheet() {
  const show = useStore((s) => s.overlay === 'cnfsearch')
  const close = useStore((s) => s.closeOverlay)
  const addImportedFood = useStore((s) => s.addImportedFood)
  const toast = useStore((s) => s.showToast)

  const [source, setSource] = useState<Source>('cnf')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [added, setAdded] = useState<Record<string, boolean>>({})

  // CNF: full list loaded once, filtered locally
  const [cnfList, setCnfList] = useState<CnfListItem[] | null>(null)
  const [cnfErr, setCnfErr] = useState(false)
  // USDA: searched on submit
  const [usda, setUsda] = useState<UsdaItem[] | null>(null)
  const [usdaLoading, setUsdaLoading] = useState(false)
  const [usdaErr, setUsdaErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (show && source === 'cnf' && !cnfList && !cnfErr) {
      cnfFoodList()
        .then((l) => alive && setCnfList(l))
        .catch(() => alive && setCnfErr(true))
    }
    return () => {
      alive = false
    }
  }, [show, source, cnfList, cnfErr])

  if (!show) return null

  const query = q.trim().toLowerCase()
  const cnfResults =
    query && cnfList ? cnfList.filter((f) => f.name.toLowerCase().includes(query)).slice(0, 40) : []

  const runUsda = async () => {
    if (!q.trim()) return
    setUsdaLoading(true)
    setUsdaErr(null)
    try {
      setUsda(await usdaSearch(q.trim()))
    } catch (e) {
      setUsdaErr(
        e instanceof Error && e.message === 'rate'
          ? 'USDA is rate-limited right now — add your free API key for more.'
          : "Couldn't reach USDA. Check your connection.",
      )
    } finally {
      setUsdaLoading(false)
    }
  }

  const commit = async (id: string, get: () => Promise<Food>) => {
    setBusy(id)
    try {
      addImportedFood(await get())
      setAdded((a) => ({ ...a, [id]: true }))
    } catch {
      toast("Couldn't fetch that food — try again")
    } finally {
      setBusy(null)
    }
  }

  const attribution = source === 'cnf' ? CNF_ATTRIBUTION : USDA_ATTRIBUTION

  const tabBtn = (key: Source, label: string) => {
    const on = source === key
    return (
      <div
        onClick={() => setSource(key)}
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

  const Row = ({ id, name, onAdd }: { id: string; name: string; onAdd: () => void }) => {
    const isAdded = added[id]
    const isBusy = busy === id
    return (
      <div
        onClick={() => !isBusy && !isAdded && onAdd()}
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
        <div style={{ flex: 1, font: '500 12.5px/1.35 Figtree', color: COLORS.ink }}>{name}</div>
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
  }

  const hint = (msg: string) => (
    <div style={{ font: '500 12.5px/1.5 Figtree', color: ink(0.45), textAlign: 'center', padding: '20px 10px' }}>
      {msg}
    </div>
  )

  return (
    <Sheet zIndex={65} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Search a database</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            {source === 'cnf' ? 'Canadian Nutrient File · 5,690 foods' : 'USDA FoodData Central'}
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#EFE9DD', borderRadius: 12, padding: 3, marginBottom: 12 }}>
        {tabBtn('cnf', 'CNF')}
        {tabBtn('usda', 'USDA')}
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && source === 'usda') runUsda()
          }}
          placeholder={source === 'cnf' ? 'Search foods…' : 'Type a food, then press Enter'}
          autoFocus
          style={{ flex: 1, border: 'none', outline: 'none', background: 'none', font: '500 13px Figtree', color: COLORS.ink }}
        />
        {source === 'usda' && (
          <div
            onClick={runUsda}
            style={{ font: '700 12px Figtree', color: COLORS.green, cursor: 'pointer', padding: '2px 4px' }}
          >
            Search
          </div>
        )}
      </div>

      <div style={{ minHeight: 120 }}>
        {source === 'cnf' ? (
          cnfErr ? (
            hint("Couldn't reach the CNF database. Check your connection and reopen.")
          ) : !cnfList ? (
            hint('Loading foods…')
          ) : !query ? (
            hint("Type to search Health Canada's food database. Tap a result to add it.")
          ) : cnfResults.length === 0 ? (
            hint(`No matches for “${q}”.`)
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {cnfResults.map((item) => (
                <Row
                  key={item.code}
                  id={'cnf-' + item.code}
                  name={item.name}
                  onAdd={() => commit('cnf-' + item.code, () => cnfFood(item.code, item.name))}
                />
              ))}
            </div>
          )
        ) : usdaLoading ? (
          hint('Searching USDA…')
        ) : usdaErr ? (
          hint(usdaErr)
        ) : !usda ? (
          hint('Type a food and press Enter to search USDA FoodData Central.')
        ) : usda.length === 0 ? (
          hint(`No USDA matches for “${q}”.`)
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {usda.map((item) => (
              <Row
                key={item.fdcId}
                id={'usda-' + item.fdcId}
                name={`${item.name} · ${item.kcal} kcal`}
                onAdd={() => commit('usda-' + item.fdcId, async () => usdaToFood(item))}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, font: '500 10px/1.5 Figtree', color: ink(0.4), textAlign: 'center' }}>
        {attribution}
        {source === 'cnf' && (
          <>
            <br />
            {CNF_DISCLAIMER}
          </>
        )}
      </div>
    </Sheet>
  )
}
