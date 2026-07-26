import { useStore } from '../../store'
import { Check } from '../../icons'

export default function Toast() {
  const toast = useStore((s) => s.toast)
  const toastKey = useStore((s) => s.toastKey)

  if (!toast) return null

  return (
    <div
      key={toastKey}
      style={{
        position: 'absolute',
        bottom: 96,
        left: '50%',
        zIndex: 80,
        background: '#1a1a17',
        borderRadius: 999,
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        animation: 'toastin 1.8s ease forwards',
      }}
    >
      <Check size={15} color="#46E08A" strokeWidth={2.6} />
      <span style={{ font: '600 12.5px Figtree', color: '#fff' }}>{toast}</span>
    </div>
  )
}
