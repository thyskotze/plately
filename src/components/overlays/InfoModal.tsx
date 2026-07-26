import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import { Info } from '../../icons'

export default function InfoModal() {
  const show = useStore((s) => s.overlay === 'info' && !!s.info)
  const info = useStore((s) => s.info)
  const closeOverlay = useStore((s) => s.closeOverlay)

  if (!show || !info) return null

  return (
    <div
      onClick={closeOverlay}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(26,26,23,.4)',
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 26,
        animation: 'fade .2s',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.appBg,
          borderRadius: 22,
          padding: 22,
          textAlign: 'center',
          animation: 'pop .3s',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: COLORS.greenTint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <Info />
        </div>
        <div style={{ font: "700 16px 'Bricolage Grotesque'", color: COLORS.ink, marginBottom: 6 }}>
          {info.title}
        </div>
        <div style={{ font: '500 12.5px/1.5 Figtree', color: ink(0.6), marginBottom: 16 }}>
          {info.body}
        </div>
        <div
          onClick={closeOverlay}
          style={{
            padding: 12,
            borderRadius: 12,
            background: COLORS.green,
            font: '700 13px Figtree',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Got it
        </div>
      </div>
    </div>
  )
}
