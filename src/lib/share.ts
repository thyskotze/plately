// Achievement share cards. Everything here runs on-device: we draw a PNG on a
// canvas and hand it to the OS share sheet (Web Share API). No backend, no upload.

export interface ShareCard {
  kind: 'day' | 'week'
  pct: number // achievement % (eaten / goal)
  eatenKcal: number
  goalKcal: number
  streak: number
  dateLabel: string
  headline: string
  sub: string
  perfectDays?: number // week cards only
}

const W = 1080
const H = 1080
const GREEN = '#2E9E5B'
const INK = '#1A1A17'
const BG = '#FBF9F3'
const TRACK = '#E7E1D4'

/** The public URL the app is served from (localhost in dev, Pages URL in prod). */
export function appUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  return (window.location.origin + base).replace(/\/$/, '')
}

export function shareText(card: ShareCard): string {
  const url = appUrl()
  if (card.kind === 'week') {
    return `${card.perfectDays ?? 0}/7 perfect days on Plately this week 🏆 Try it: ${url}`
  }
  return `I hit ${card.pct}% of my goal today on Plately 🔥 ${card.streak}-day streak. Try it: ${url}`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw the card and return { dataUrl, blob }. */
export async function renderShareImage(
  card: ShareCard,
): Promise<{ dataUrl: string; blob: Blob | null }> {
  // Make sure the web fonts are ready so the canvas uses them, not a fallback.
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* fonts API unavailable — fall back to system fonts */
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // Wordmark + date
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = GREEN
  ctx.font = "800 46px 'Bricolage Grotesque', sans-serif"
  ctx.textAlign = 'left'
  ctx.fillText('Plately', 90, 130)
  ctx.fillStyle = 'rgba(26,26,23,.45)'
  ctx.font = "600 34px Figtree, sans-serif"
  ctx.textAlign = 'right'
  ctx.fillText(card.dateLabel, W - 90, 130)

  // Ring
  const cx = W / 2
  const cy = 470
  const r = 190
  const lw = 46
  const frac = Math.max(0, Math.min(1, card.pct / 100))
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.strokeStyle = TRACK
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = GREEN
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac)
  ctx.stroke()

  // Big % (or perfect-days for week)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  if (card.kind === 'week') {
    ctx.font = "700 150px 'Space Grotesk', sans-serif"
    ctx.fillText(`${card.perfectDays ?? 0}/7`, cx, cy + 30)
    ctx.fillStyle = 'rgba(26,26,23,.5)'
    ctx.font = '600 40px Figtree, sans-serif'
    ctx.fillText('perfect days', cx, cy + 110)
  } else {
    ctx.font = "700 160px 'Space Grotesk', sans-serif"
    ctx.fillText(`${card.pct}%`, cx, cy + 35)
    ctx.fillStyle = 'rgba(26,26,23,.5)'
    ctx.font = '600 40px Figtree, sans-serif'
    ctx.fillText("of today's goal", cx, cy + 115)
  }

  // Headline + sub
  ctx.fillStyle = INK
  ctx.font = "800 66px 'Bricolage Grotesque', sans-serif"
  ctx.fillText(card.headline, cx, 800)
  ctx.fillStyle = 'rgba(26,26,23,.55)'
  ctx.font = '500 38px Figtree, sans-serif'
  ctx.fillText(card.sub, cx, 858)

  // Stat pills
  const pillY = 920
  const pillH = 84
  const gap = 24
  const pills =
    card.kind === 'week'
      ? [`🔥 ${card.streak}-day streak`, `${card.pct}% of weekly goal`]
      : [`🔥 ${card.streak}-day streak`, `${card.eatenKcal.toLocaleString('en-US')} / ${card.goalKcal.toLocaleString('en-US')} kcal`]
  ctx.font = '700 34px Figtree, sans-serif'
  const widths = pills.map((p) => ctx.measureText(p).width + 60)
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (pills.length - 1)
  let x = cx - totalW / 2
  pills.forEach((p, i) => {
    ctx.fillStyle = '#EAF5EE'
    roundRect(ctx, x, pillY, widths[i], pillH, pillH / 2)
    ctx.fill()
    ctx.fillStyle = GREEN
    ctx.textAlign = 'center'
    ctx.fillText(p, x + widths[i] / 2, pillY + pillH / 2 + 12)
    x += widths[i] + gap
  })

  const dataUrl = canvas.toDataURL('image/png')
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
  return { dataUrl, blob }
}

export type ShareResult = 'shared' | 'saved' | 'cancelled' | 'failed'

/** Try the native share sheet with the image file; fall back to a download. */
export async function shareImage(blob: Blob | null, card: ShareCard): Promise<ShareResult> {
  const text = shareText(card)
  const file = blob ? new File([blob], `plately-${card.kind}.png`, { type: 'image/png' }) : null

  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }

  if (file && nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], text, title: 'Plately' })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // fall through to download
    }
  }

  // Fallback: download the PNG so it can be attached manually.
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plately-${card.kind}.png`
    a.click()
    URL.revokeObjectURL(url)
    return 'saved'
  }
  return 'failed'
}
