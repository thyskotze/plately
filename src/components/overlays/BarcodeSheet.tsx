import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { offLookup, OFF_ATTRIBUTION } from '../../lib/off'

export default function BarcodeSheet() {
  const show = useStore((s) => s.overlay === 'barcode')
  const close = useStore((s) => s.closeOverlay)
  const addImportedFood = useStore((s) => s.addImportedFood)
  const barcodeToSlot = useStore((s) => s.barcodeToSlot)
  const chooseFood = useStore((s) => s.chooseFood)

  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [status, setStatus] = useState<string>('Point your camera at a barcode')
  const [camActive, setCamActive] = useState(false)
  const [manual, setManual] = useState('')
  const [busy, setBusy] = useState(false)

  const lookup = async (barcode: string) => {
    const code = barcode.trim()
    if (!code || busy) return
    setBusy(true)
    setStatus(`Looking up ${code}…`)
    try {
      const food = await offLookup(code)
      if (!food) {
        setStatus(`No product found for ${code}. Try "Enter manually".`)
        return
      }
      addImportedFood(food)
      // Scanning while adding to a meal: go straight to the portion step, which
      // keeps the day/slot we were adding to.
      if (barcodeToSlot) chooseFood(food.id)
      else close()
    } catch {
      setStatus("Couldn't reach Open Food Facts. Check your connection.")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!show) return
    let cancelled = false
    const reader = new BrowserMultiFormatReader()
    ;(async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
          if (result && !cancelled) {
            controlsRef.current?.stop()
            setCamActive(false)
            lookup(result.getText())
          }
        })
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setCamActive(true)
      } catch {
        setCamActive(false)
        setStatus('Camera unavailable — enter the barcode number below instead.')
      }
    })()
    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!show) return null

  return (
    <Sheet zIndex={65} onScrim={close} scroll maxHeight="92%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Scan a barcode</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>Packaged foods, via Open Food Facts</div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: '#1E201A',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: camActive ? 'block' : 'none' }}
        />
        {!camActive && (
          <div style={{ font: '500 12px/1.5 Figtree', color: '#D7DBCE', textAlign: 'center', padding: 20 }}>
            {status}
          </div>
        )}
        {camActive && (
          <div
            style={{
              position: 'absolute',
              inset: '28% 12%',
              border: '2px solid rgba(255,255,255,.85)',
              borderRadius: 12,
              boxShadow: '0 0 0 2000px rgba(0,0,0,.15)',
            }}
          />
        )}
      </div>

      <div style={{ font: '500 11.5px Figtree', color: ink(0.55), textAlign: 'center', marginBottom: 14 }}>
        {camActive ? 'Point your camera at a barcode' : status}
      </div>

      <div style={{ font: '600 11px Figtree', color: ink(0.5), marginBottom: 6 }}>Or enter the barcode number</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookup(manual)}
          inputMode="numeric"
          placeholder="e.g. 6001234567890"
          style={{
            flex: 1,
            border: `1px solid ${COLORS.inputBorder}`,
            borderRadius: 12,
            padding: '11px 13px',
            font: '500 13px Figtree',
            color: COLORS.ink,
            background: '#fff',
            outline: 'none',
          }}
        />
        <div
          onClick={() => lookup(manual)}
          style={{
            flex: 'none',
            padding: '11px 18px',
            borderRadius: 12,
            background: busy ? '#C9C1B2' : COLORS.green,
            font: '700 12.5px Figtree',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          Look up
        </div>
      </div>

      <div style={{ marginTop: 12, font: '500 10px Figtree', color: ink(0.4), textAlign: 'center' }}>
        {OFF_ATTRIBUTION}
      </div>
    </Sheet>
  )
}
