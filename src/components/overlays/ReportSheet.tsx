import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../store'
import { COLORS, ink } from '../../tokens'
import Sheet, { CloseButton } from '../Sheet'
import { buildReport, buildReportPdf, shareReportPdf, periodLabel, type ReportPeriod } from '../../lib/report'

const PERIODS: ReportPeriod[] = [7, 14, 30]

/** Coach report: pick a period, preview page 1, share the PDF. */
export default function ReportSheet() {
  const show = useStore((s) => s.overlay === 'report')
  const name = useStore((s) => s.name)
  const foods = useStore((s) => s.foods)
  const meals = useStore((s) => s.meals)
  const mealsByDay = useStore((s) => s.mealsByDay)
  const eaten = useStore((s) => s.eaten)
  const goals = useStore((s) => s.goals)
  const weights = useStore((s) => s.weights)
  const close = useStore((s) => s.closeOverlay)
  const showToast = useStore((s) => s.showToast)

  const [period, setPeriod] = useState<ReportPeriod>(7)
  const [preview, setPreview] = useState<string | null>(null)
  const [pdf, setPdf] = useState<{ blob: Blob; filename: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  const report = useMemo(
    () => (show ? buildReport({ name, foods, meals, mealsByDay, eaten, goals, weights }, period) : null),
    [show, period, name, foods, meals, mealsByDay, eaten, goals, weights],
  )

  useEffect(() => {
    if (!report) return
    let alive = true
    setPreview(null)
    setPdf(null)
    setFailed(false)
    buildReportPdf(report)
      .then((res) => {
        if (!alive) return
        setPreview(res.previewUrl)
        setPdf({ blob: res.blob, filename: res.filename })
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [report])

  if (!show || !report) return null

  const onShare = async () => {
    if (!pdf || busy) return
    setBusy(true)
    const res = await shareReportPdf(pdf.blob, pdf.filename, report)
    setBusy(false)
    if (res === 'shared') close()
    else if (res === 'saved') showToast('Report saved — attach it to your message')
    else if (res === 'failed') showToast("Couldn't share on this device")
  }

  const chip = (p: ReportPeriod) => {
    const on = p === period
    return (
      <div
        key={p}
        onClick={() => setPeriod(p)}
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '9px 0',
          borderRadius: 11,
          background: on ? '#fff' : 'transparent',
          boxShadow: on ? '0 1px 3px rgba(26,26,23,.1)' : 'none',
          font: '700 12px Figtree',
          color: on ? COLORS.green : ink(0.5),
          cursor: 'pointer',
        }}
      >
        {p} days
      </div>
    )
  }

  return (
    <Sheet zIndex={62} onScrim={close} scroll maxHeight="94%">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ font: "700 18px 'Bricolage Grotesque'", color: COLORS.ink }}>Coach report</div>
          <div style={{ font: '500 11.5px Figtree', color: ink(0.5) }}>
            A PDF of what you ate, for your coach or dietitian.
          </div>
        </div>
        <CloseButton onClick={close} />
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#EFE9DD', borderRadius: 13, padding: 3, marginBottom: 10 }}>
        {PERIODS.map(chip)}
      </div>

      <div style={{ font: '600 11.5px Figtree', color: ink(0.55), marginBottom: 12, textAlign: 'center' }}>
        {periodLabel(report.start, report.end)} · {report.counted}{' '}
        {report.counted === 1 ? 'complete day' : 'complete days'} · {report.inRange} in range
      </div>

      {report.counted === 0 && (
        <div
          style={{
            background: '#FDF6E9',
            border: '1px solid #F0DFBB',
            borderRadius: 12,
            padding: '10px 12px',
            font: '500 11.5px/1.45 Figtree',
            color: '#8A5A12',
            marginBottom: 12,
          }}
        >
          Nothing to report yet for this period. Only meals you tick off as eaten count, so check off
          your meals and try again.
        </div>
      )}

      <div
        style={{
          width: '100%',
          aspectRatio: '1240 / 1754',
          background: '#fff',
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 6px 18px -10px rgba(26,26,23,.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        {preview ? (
          <img src={preview} alt="Report page 1 preview" style={{ width: '100%', height: '100%', display: 'block' }} />
        ) : (
          <div style={{ font: '500 12px Figtree', color: ink(0.45) }}>
            {failed ? "Couldn't build the report on this device." : 'Building report…'}
          </div>
        )}
      </div>
      <div style={{ font: '500 10.5px Figtree', color: ink(0.4), textAlign: 'center', marginBottom: 16 }}>
        Page 1 of 2 · page 2 is the day-by-day log
      </div>

      <div
        onClick={onShare}
        style={{
          textAlign: 'center',
          padding: 16,
          borderRadius: 14,
          background: pdf ? COLORS.green : '#C9C1B2',
          font: '700 14px Figtree',
          color: '#fff',
          cursor: pdf ? 'pointer' : 'default',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Opening share…' : 'Share PDF'}
      </div>
    </Sheet>
  )
}
