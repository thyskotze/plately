import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { renderShareImage, shareImage } from '../../lib/share'

export default function ShareSheet() {
  const show = useStore((s) => s.overlay === 'share')
  const card = useStore((s) => s.shareData)
  const close = useStore((s) => s.closeOverlay)
  const toast = useStore((s) => s.showToast)

  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    if (show && card) {
      setDataUrl(null)
      renderShareImage(card).then((r) => {
        if (!alive) return
        setDataUrl(r.dataUrl)
        setBlob(r.blob)
      })
    }
    return () => {
      alive = false
    }
  }, [show, card])

  if (!show || !card) return null

  const onShare = async () => {
    setBusy(true)
    const res = await shareImage(blob, card)
    setBusy(false)
    if (res === 'shared') {
      close()
    } else if (res === 'saved') {
      toast('Image saved — attach it in your group')
      close()
    } else if (res === 'failed') {
      toast("Couldn't share on this device")
    }
    // 'cancelled' — leave the sheet open
  }

  const primary = {
    flex: 1,
    textAlign: 'center' as const,
    padding: 14,
    borderRadius: 14,
    background: COLORS.green,
    font: '700 13px Figtree',
    color: '#fff',
    cursor: 'pointer',
    opacity: busy ? 0.6 : 1,
  }

  return (
    <Sheet zIndex={70} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Share your win</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            Post it to your group and rally the crew.
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          border: `1px solid ${COLORS.cardBorder}`,
          background: '#fff',
          aspectRatio: '1 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {dataUrl ? (
          <img src={dataUrl} alt="Achievement card" style={{ width: '100%', display: 'block' }} />
        ) : (
          <div style={{ font: '500 12px Figtree', color: ink(0.4) }}>Creating your card…</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div
          onClick={close}
          style={{
            flex: 'none',
            padding: '14px 20px',
            borderRadius: 14,
            background: '#fff',
            border: `1px solid ${COLORS.inputBorder}`,
            font: '700 13px Figtree',
            color: COLORS.ink,
            cursor: 'pointer',
          }}
        >
          Cancel
        </div>
        <div onClick={dataUrl && !busy ? onShare : undefined} style={primary}>
          Share
        </div>
      </div>
    </Sheet>
  )
}
