import { useStore } from '../store'
import { COLORS, ink } from '../tokens'
import { forceUpdate } from '../lib/update'
import { Close, Download, Refresh } from '../icons'

// Shown when a newer build is live. Nudges the user to export a backup before
// updating — a safety net in case a future release changes the data shape.
export default function UpdateBanner() {
  const show = useStore((s) => s.updateAvailable)
  const exportBackup = useStore((s) => s.exportBackup)
  const dismiss = useStore((s) => s.dismissUpdate)

  if (!show) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 74,
        zIndex: 50,
        background: '#fff',
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 16,
        boxShadow: '0 12px 30px -12px rgba(26,26,23,.35)',
        padding: '12px 12px 12px 14px',
        animation: 'fade .25s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: COLORS.greenTint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Refresh size={16} color={COLORS.green} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 12.5px Figtree', color: COLORS.ink }}>New version available</div>
          <div style={{ font: '500 11px/1.4 Figtree', color: ink(0.55) }}>
            Export a backup first, then update — your data stays on this device.
          </div>
        </div>
        <div onClick={dismiss} style={{ cursor: 'pointer', padding: 4, display: 'flex', flex: 'none' }}>
          <Close size={14} color="#C9C1B2" strokeWidth={2.4} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <div
          onClick={exportBackup}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 8px',
            borderRadius: 11,
            background: '#fff',
            border: `1px solid ${COLORS.inputBorder}`,
            font: '700 12px Figtree',
            color: COLORS.ink,
            cursor: 'pointer',
          }}
        >
          <Download size={15} color={COLORS.ink} />
          Export
        </div>
        <div
          onClick={() => forceUpdate()}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '9px 8px',
            borderRadius: 11,
            background: COLORS.green,
            font: '700 12px Figtree',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Update now
        </div>
      </div>
    </div>
  )
}
