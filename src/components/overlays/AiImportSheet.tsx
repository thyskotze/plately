import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../store'
import { AI_PROMPT } from '../../seed'
import { parseAi, tag, macroLine, findSimilarFood } from '../../lib/calc'
import { COLORS, ink } from '../../tokens'
import { Copy, ChevronLeft, ChevronRight } from '../../icons'
import Sheet, { CloseButton } from '../Sheet'
import type { Food } from '../../types'

/** What to do with a parsed food that already looks like something in the library. */
type Choice = 'skip' | 'replace' | 'add'

const WARN = '#B8791F'
const WARN_BG = '#FDF6E9'
const WARN_BORDER = '#F0DFBB'

export default function AiImportSheet() {
  const show = useStore((s) => s.overlay === 'aiimport')
  const aiStep = useStore((s) => s.aiStep)
  const aiText = useStore((s) => s.aiText)
  const foods = useStore((s) => s.foods)
  const setAiText = useStore((s) => s.setAiText)
  const aiNext = useStore((s) => s.aiNext)
  const aiBack = useStore((s) => s.aiBack)
  const aiConfirm = useStore((s) => s.aiConfirm)
  const copyAiPrompt = useStore((s) => s.copyAiPrompt)
  const closeOverlay = useStore((s) => s.closeOverlay)

  const [showPrompt, setShowPrompt] = useState(false)
  // Per-food decisions, keyed by the parsed food's id. Only overrides are stored;
  // anything absent falls back to the default (skip if it clashes, else add).
  const [choices, setChoices] = useState<Record<string, Choice>>({})

  // Memoised so parsed ids stay stable between renders (parseAi assigns random
  // ids), which is what lets `choices` key off them.
  const parsed = useMemo(() => parseAi(aiText), [aiText])

  // A fresh paste means fresh decisions.
  useEffect(() => {
    setChoices({})
  }, [aiText])

  if (!show) return null

  // Pair each parsed food with an existing library food that means the same thing.
  const rows = parsed.map((f) => {
    const match = findSimilarFood(foods, f.name)
    return { food: f, match, choice: choices[f.id] ?? (match ? ('skip' as Choice) : ('add' as Choice)) }
  })

  const clashes = rows.filter((r) => r.match)
  const adds = rows.filter((r) => r.choice === 'add').map((r) => r.food)
  const replacements = rows
    .filter((r) => r.choice === 'replace' && r.match)
    .map((r) => ({ existingId: r.match!.id, food: r.food }))
  const totalActions = adds.length + replacements.length

  const setChoice = (id: string, c: Choice) => setChoices((prev) => ({ ...prev, [id]: c }))

  const confirmLabel = () => {
    if (!parsed.length) return 'Nothing to import'
    if (!totalActions) return 'Nothing selected'
    const bits: string[] = []
    if (adds.length) bits.push(`Add ${adds.length}`)
    if (replacements.length) bits.push(`update ${replacements.length}`)
    return bits.join(' · ')
  }

  const macroBits = (f: Pick<Food, 'kcal' | 'p' | 'c' | 'f'>) =>
    `${f.kcal} kcal · ${f.p}P ${f.c}C ${f.f}F`

  const choiceBtn = (id: string, c: Choice, label: string, active: boolean) => (
    <div
      onClick={() => setChoice(id, c)}
      style={{
        flex: 1,
        textAlign: 'center',
        padding: '6px 2px',
        borderRadius: 8,
        background: active ? COLORS.green : '#fff',
        border: `1px solid ${active ? COLORS.green : COLORS.inputBorder}`,
        font: '700 10px Figtree',
        color: active ? '#fff' : ink(0.6),
        cursor: 'pointer',
      }}
    >
      {label}
    </div>
  )

  return (
    <Sheet zIndex={65} onScrim={closeOverlay} scroll maxHeight="92%">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>
            Bulk import with AI
          </div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            Let your AI do the data entry — no AI runs inside the app.
          </div>
        </div>
        <CloseButton onClick={closeOverlay} />
      </div>

      {aiStep === 'prompt' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: COLORS.green,
                color: '#fff',
                font: '700 11px Figtree',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              1
            </div>
            <span style={{ font: '600 12.5px Figtree', color: COLORS.ink }}>
              Copy this into ChatGPT, Claude, or any AI
            </span>
          </div>

          <div
            onClick={() => copyAiPrompt(AI_PROMPT)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 13,
              borderRadius: 12,
              background: COLORS.green,
              font: '700 12.5px Figtree',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <Copy color="#fff" />
            Copy prompt
          </div>

          <div style={{ font: '500 11px/1.5 Figtree', color: ink(0.5), marginBottom: 10 }}>
            The prompt tells the AI to double-check its own numbers, and to trust a
            nutrition label over what it remembers. Paste a label photo along with it
            for the most accurate results.
          </div>

          {/* Collapsed by default — the prompt is long and rarely needs reading. */}
          <div
            onClick={() => setShowPrompt((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              font: '600 11.5px Figtree',
              color: ink(0.5),
              cursor: 'pointer',
              marginBottom: showPrompt ? 8 : 18,
            }}
          >
            <span style={{ display: 'inline-flex', transform: showPrompt ? 'rotate(90deg)' : 'none' }}>
              <ChevronRight size={13} color={ink(0.5)} />
            </span>
            {showPrompt ? 'Hide prompt' : 'View prompt'}
          </div>

          {showPrompt && (
            <div style={{ background: '#1E201A', borderRadius: 14, padding: 14, marginBottom: 18 }}>
              <div
                style={{
                  font: '400 11px/1.55 ui-monospace,Menlo,monospace',
                  color: '#D7DBCE',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {AI_PROMPT}
              </div>
            </div>
          )}

          <div
            onClick={aiNext}
            style={{
              textAlign: 'center',
              padding: 18,
              borderRadius: 14,
              background: '#fff',
              border: `2px solid ${COLORS.green}`,
              font: '700 14.5px Figtree',
              color: COLORS.green,
              cursor: 'pointer',
            }}
          >
            Paste my results →
          </div>
        </div>
      ) : (
        <div>
          <div
            onClick={aiBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              font: '600 11.5px Figtree',
              color: ink(0.5),
              marginBottom: 12,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={13} color={ink(0.5)} />
            Back to prompt
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: COLORS.green,
                color: '#fff',
                font: '700 11px Figtree',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              2
            </div>
            <span style={{ font: '600 12.5px Figtree', color: COLORS.ink }}>
              Paste the AI's answer here
            </span>
          </div>
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder={
              'Chicken thigh | Meat & Fish | 209 | 26 | 0 | 11\nJasmine rice | Pantry | 130 | 2.7 | 28 | 0.3'
            }
            style={{
              width: '100%',
              height: 200,
              border: `1px solid ${COLORS.inputBorder}`,
              borderRadius: 14,
              padding: 14,
              font: '400 12.5px/1.55 ui-monospace,Menlo,monospace',
              color: COLORS.ink,
              background: '#fff',
              outline: 'none',
              resize: 'none',
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: parsed.length ? '#2E9E5B' : '#DDD5C6',
              }}
            />
            <span style={{ font: '600 12px Figtree', color: COLORS.ink }}>
              {parsed.length} foods detected
            </span>
          </div>
          {clashes.length > 0 && (
            <div style={{ font: '600 11px Figtree', color: WARN, marginBottom: 8 }}>
              {clashes.length} already {clashes.length === 1 ? 'looks' : 'look'} like something in
              your library — choose what to do below.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {rows.slice(0, 40).map(({ food: f, match, choice }) => {
              const t = tag(f)
              if (!match) {
                return (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      background: '#fff',
                      border: `1px solid ${COLORS.cardBorder}`,
                      borderRadius: 12,
                      padding: '9px 12px',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: t.tagBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: '700 11px Figtree',
                        color: t.tagColor,
                        flex: 'none',
                      }}
                    >
                      {t.tagInitial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: '600 12px Figtree', color: COLORS.ink }}>{f.name}</div>
                      <div style={{ font: '500 10px Figtree', color: ink(0.45) }}>{macroLine(f)}</div>
                    </div>
                    <div style={{ font: "700 12px 'Space Grotesk'", color: ink(0.6) }}>{f.kcal}</div>
                  </div>
                )
              }
              // Possible duplicate: show existing vs new, and let the user pick.
              return (
                <div
                  key={f.id}
                  style={{
                    background: WARN_BG,
                    border: `1px solid ${WARN_BORDER}`,
                    borderRadius: 12,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ font: '700 11.5px Figtree', color: WARN, marginBottom: 7 }}>
                    Already in your library
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 9 }}>
                    <div
                      style={{
                        flex: 1,
                        background: '#fff',
                        border: `1px solid ${COLORS.cardBorder}`,
                        borderRadius: 9,
                        padding: '7px 9px',
                      }}
                    >
                      <div style={{ font: '500 9px Figtree', color: ink(0.4), marginBottom: 2 }}>
                        Current
                      </div>
                      <div style={{ font: '600 11px Figtree', color: COLORS.ink }}>{match.name}</div>
                      <div style={{ font: "500 9.5px 'Space Grotesk'", color: ink(0.5) }}>
                        {macroBits(match)}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: '#fff',
                        border: `1px solid ${COLORS.cardBorder}`,
                        borderRadius: 9,
                        padding: '7px 9px',
                      }}
                    >
                      <div style={{ font: '500 9px Figtree', color: ink(0.4), marginBottom: 2 }}>
                        New
                      </div>
                      <div style={{ font: '600 11px Figtree', color: COLORS.ink }}>{f.name}</div>
                      <div style={{ font: "500 9.5px 'Space Grotesk'", color: COLORS.green }}>
                        {macroBits(f)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {choiceBtn(f.id, 'skip', 'Skip', choice === 'skip')}
                    {choiceBtn(f.id, 'replace', 'Update', choice === 'replace')}
                    {choiceBtn(f.id, 'add', 'Add both', choice === 'add')}
                  </div>
                  {choice === 'replace' && (
                    <div style={{ font: '500 9.5px Figtree', color: ink(0.45), marginTop: 6 }}>
                      Keeps this food in any meals you've already logged.
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div
            onClick={() => aiConfirm(adds, replacements)}
            style={{
              textAlign: 'center',
              padding: 18,
              borderRadius: 14,
              background: totalActions ? COLORS.green : '#C9C1B2',
              font: '700 14.5px Figtree',
              color: '#fff',
              cursor: totalActions ? 'pointer' : 'default',
            }}
          >
            {confirmLabel()}
          </div>
        </div>
      )}
    </Sheet>
  )
}
