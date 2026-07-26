import { useStore } from '../../store'
import { AI_PROMPT } from '../../seed'
import { parseAi, tag, macroLine } from '../../lib/calc'
import { COLORS, ink } from '../../tokens'
import { Copy, ChevronLeft } from '../../icons'
import Sheet, { CloseButton } from '../Sheet'

export default function AiImportSheet() {
  const show = useStore((s) => s.overlay === 'aiimport')
  const aiStep = useStore((s) => s.aiStep)
  const aiText = useStore((s) => s.aiText)
  const setAiText = useStore((s) => s.setAiText)
  const aiNext = useStore((s) => s.aiNext)
  const aiBack = useStore((s) => s.aiBack)
  const aiConfirm = useStore((s) => s.aiConfirm)
  const copyAiPrompt = useStore((s) => s.copyAiPrompt)
  const closeOverlay = useStore((s) => s.closeOverlay)

  if (!show) return null

  const parsed = parseAi(aiText)

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
              }}
            >
              1
            </div>
            <span style={{ font: '600 12.5px Figtree', color: COLORS.ink }}>
              Copy this into ChatGPT, Claude, or any AI
            </span>
          </div>
          <div style={{ background: '#1E201A', borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
          <div
            onClick={() => copyAiPrompt(AI_PROMPT)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: 12,
              borderRadius: 12,
              background: '#fff',
              border: '1px solid #CDE6D6',
              font: '700 12.5px Figtree',
              color: COLORS.green,
              cursor: 'pointer',
              marginBottom: 18,
            }}
          >
            <Copy />
            Copy prompt
          </div>
          <div
            onClick={aiNext}
            style={{
              textAlign: 'center',
              padding: 14,
              borderRadius: 14,
              background: COLORS.green,
              font: '700 13px Figtree',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            I've got my results →
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
              height: 120,
              border: `1px solid ${COLORS.inputBorder}`,
              borderRadius: 14,
              padding: 12,
              font: '400 11.5px/1.5 ui-monospace,Menlo,monospace',
              color: COLORS.ink,
              background: '#fff',
              outline: 'none',
              resize: 'none',
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            {parsed.slice(0, 40).map((f) => {
              const t = tag(f)
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
                    }}
                  >
                    {t.tagInitial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '600 12px Figtree', color: COLORS.ink }}>{f.name}</div>
                    <div style={{ font: '500 10px Figtree', color: ink(0.45) }}>{macroLine(f)}</div>
                  </div>
                  <div style={{ font: '700 12px Space Grotesk', color: ink(0.6) }}>{f.kcal}</div>
                </div>
              )
            })}
          </div>
          <div
            onClick={() => aiConfirm(parsed)}
            style={{
              textAlign: 'center',
              padding: 14,
              borderRadius: 14,
              background: parsed.length ? COLORS.green : '#C9C1B2',
              font: '700 13px Figtree',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Add {parsed.length} foods to library
          </div>
        </div>
      )}
    </Sheet>
  )
}
