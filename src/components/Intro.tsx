import { useState } from 'react'
import { useStore } from '../store'
import { COLORS, ink } from '../tokens'

// Copy mirrored from WELCOME.md (in-app first-run intro).
const CARDS = [
  {
    title: 'Welcome to Plately',
    body: 'Plan meals, hit your goals, and shop smarter — all on your phone. No account, nothing to sign up for.',
  },
  {
    title: 'Start with your foods',
    body: 'Add the foods you eat to your Library — scan a barcode, search, type them in, or paste a ready-made list from ChatGPT/Claude with Bulk import with AI.',
  },
  {
    title: 'Set a goal, then log',
    body: 'Tell Plately your daily target (or let it work one out for you). Tap ＋ on any meal to log food — watch your rings fill as you go.',
  },
  {
    title: 'Plan the week, get a list',
    body: 'Lay out meals for each day in the Planner, and Plately builds your shopping list automatically. Tick items off as you shop.',
    footer:
      'Tip: back up your data anytime from your profile → Export. It’s the only way to move it to another phone.',
  },
]

export default function Intro() {
  const dismiss = useStore((s) => s.dismissIntro)
  const [i, setI] = useState(0)
  const card = CARDS[i]
  const last = i === CARDS.length - 1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: COLORS.scrim,
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fade .2s',
      }}
    >
      <div
        style={{
          background: COLORS.appBg,
          borderRadius: '26px 26px 0 0',
          padding: '18px 22px 26px',
          animation: 'slideup .28s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        <div style={{ width: 38, height: 4, background: '#DDD5C6', borderRadius: 99, margin: '0 auto 18px' }} />

        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: COLORS.greenTint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            font: "800 24px 'Bricolage Grotesque', sans-serif",
            color: COLORS.green,
          }}
        >
          🥗
        </div>

        <div style={{ font: "700 20px 'Bricolage Grotesque', sans-serif", color: COLORS.ink, marginBottom: 8 }}>
          {card.title}
        </div>
        <div style={{ font: '500 13.5px/1.55 Figtree, sans-serif', color: ink(0.6), marginBottom: card.footer ? 12 : 22 }}>
          {card.body}
        </div>
        {card.footer && (
          <div
            style={{
              font: '500 11.5px/1.5 Figtree, sans-serif',
              color: ink(0.5),
              background: '#fff',
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 12,
              padding: '10px 12px',
              marginBottom: 22,
            }}
          >
            {card.footer}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
          {CARDS.map((_, k) => (
            <div
              key={k}
              style={{
                width: k === i ? 20 : 7,
                height: 7,
                borderRadius: 99,
                background: k === i ? COLORS.green : '#DDD5C6',
                transition: 'width .2s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div
            onClick={dismiss}
            style={{
              flex: 'none',
              padding: '14px 20px',
              borderRadius: 14,
              background: '#fff',
              border: `1px solid ${COLORS.inputBorder}`,
              font: '700 13px Figtree, sans-serif',
              color: COLORS.ink,
              cursor: 'pointer',
            }}
          >
            Skip
          </div>
          <div
            onClick={() => (last ? dismiss() : setI(i + 1))}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: 14,
              borderRadius: 14,
              background: COLORS.green,
              font: '700 13px Figtree, sans-serif',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {last ? 'Get started' : 'Next'}
          </div>
        </div>
      </div>
    </div>
  )
}
