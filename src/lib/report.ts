// Coach report: turns the user's eaten-meal history into a two-page PDF
// (charts + day-by-day log) drawn on canvases, entirely on-device.

import type { Food, Meal, MealsByDay, SlotKey, Goals, WeightEntry } from '../types'
import type { DayScore } from './calc'
import { eatenTotals, scoreDay, kcalWindow, round, fmt } from './calc'
import { todayISO, addDays, parseISO, weekdayShort, dayOfMonth, type ISODate } from './dates'
import { computeStreak } from './streak'
import { buildPdf } from './pdf'
import type { ShareResult } from './share'
import { MACRO } from '../tokens'

export type ReportPeriod = 7 | 14 | 30

/** in/over/under = a finished day; progress = today, not yet in range or over. */
export type DayStatus = 'in' | 'over' | 'under' | 'progress' | 'none'

export interface ReportDay {
  date: ISODate
  kcal: number
  p: number
  c: number
  f: number
  score: DayScore
  status: DayStatus
  /** Counts toward averages and tallies: logged, and not an unfinished today. */
  counted: boolean
}

export interface ReportInput {
  name: string
  foods: Food[]
  meals: Meal[]
  mealsByDay: MealsByDay
  eaten: Record<ISODate, Partial<Record<SlotKey, boolean>>>
  goals: Goals
  weights: WeightEntry[]
}

export interface ReportData {
  name: string
  period: ReportPeriod
  start: ISODate
  end: ISODate
  goals: Goals
  win: { min: number; max: number }
  days: ReportDay[]
  counted: number
  inRange: number
  over: number
  under: number
  proteinHit: number
  avg: { kcal: number; p: number; c: number; f: number }
  /** Share of average calories from each macro, summing to 100. */
  macroPct: { p: number; c: number; f: number }
  /** Dated weigh-ins inside the period, oldest first. */
  weights: { date: ISODate; kg: number }[]
  weightChange: number | null
  latestKg: number | null
  streak: number
}

const round1 = (n: number) => Math.round(n * 10) / 10
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function periodLabel(start: ISODate, end: ISODate): string {
  const a = parseISO(start)
  const b = parseISO(end)
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
  }
  return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
}

const longDate = (iso: ISODate) => {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Crunch the numbers for a report ending today. Uses *eaten* meals and the same
 * scoreDay rule as the streak: today only counts once it's in range or over, so
 * a half-logged day doesn't show up as "under" or drag the averages down.
 */
export function buildReport(input: ReportInput, period: ReportPeriod, today: ISODate = todayISO()): ReportData {
  const { foods, meals, mealsByDay, eaten, goals } = input
  const start = addDays(today, -(period - 1))

  const days: ReportDay[] = Array.from({ length: period }, (_, i) => {
    const date = addDays(start, i)
    const totals = eatenTotals(foods, meals, mealsByDay[date], eaten[date])
    const score = scoreDay(totals, goals)
    const isToday = date === today
    let status: DayStatus
    if (score.over) status = 'over'
    else if (score.onTarget) status = 'in'
    else if (isToday) status = 'progress'
    else if (score.empty) status = 'none'
    else status = 'under'
    const counted = status === 'in' || status === 'over' || status === 'under'
    return { date, ...totals, score, status, counted }
  })

  const done = days.filter((d) => d.counted)
  const mean = (pick: (d: ReportDay) => number) =>
    done.length ? done.reduce((a, d) => a + pick(d), 0) / done.length : 0
  const avg = {
    kcal: round(mean((d) => d.kcal)),
    p: round(mean((d) => d.p)),
    c: round(mean((d) => d.c)),
    f: round(mean((d) => d.f)),
  }

  const pk = avg.p * 4
  const ck = avg.c * 4
  const fk = avg.f * 9
  const total = pk + ck + fk
  const macroPct = total
    ? (() => {
        const p = round((pk / total) * 100)
        const c = round((ck / total) * 100)
        return { p, c, f: 100 - p - c }
      })()
    : { p: 0, c: 0, f: 0 }

  const weights = input.weights
    .filter((w): w is WeightEntry & { date: string } => !!w.date && w.date >= start && w.date <= today)
    .map((w) => ({ date: w.date, kg: w.kg }))
    .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0))

  return {
    name: input.name.trim(),
    period,
    start,
    end: today,
    goals,
    win: kcalWindow(goals),
    days,
    counted: done.length,
    inRange: done.filter((d) => d.status === 'in').length,
    over: done.filter((d) => d.status === 'over').length,
    under: done.filter((d) => d.status === 'under').length,
    proteinHit: done.filter((d) => d.score.proteinHit).length,
    avg,
    macroPct,
    weights,
    weightChange: weights.length >= 2 ? round1(weights[weights.length - 1].kg - weights[0].kg) : null,
    latestKg: input.weights.length ? input.weights[input.weights.length - 1].kg : null,
    streak: computeStreak(foods, meals, mealsByDay, eaten, goals, today),
  }
}

// ─── Drawing ────────────────────────────────────────────────────────────────

const PW = 1240 // A4 at ~150 dpi
const PH = 1754
const M = 80
const GREEN = '#2E9E5B'
const INK = '#1A1A17'
const MUTED = 'rgba(26,26,23,.58)'
const FAINT = 'rgba(26,26,23,.38)'
const LINE = '#E9E3D6'
const CARD = '#F7F4EC'
const OVER = '#E4572E'
const UNDER_BAR = '#E0A43A'
const UNDER_TEXT = '#B8791F'
const PENDING = '#BDB6A6'
const BELOW_TARGET = '#D9CFA8'
const DISPLAY = "'Bricolage Grotesque', sans-serif"
const BODY = 'Figtree, sans-serif'
const NUM = "'Space Grotesk', sans-serif"

type Ctx = CanvasRenderingContext2D

function newPage(): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas')
  canvas.width = PW
  canvas.height = PH
  const ctx = canvas.getContext('2d')!
  // JPEG has no alpha — paint white or the page comes out black.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, PW, PH)
  ctx.textBaseline = 'alphabetic'
  return [canvas, ctx]
}

function text(ctx: Ctx, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left') {
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(s, x, y)
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function hLine(ctx: Ctx, x1: number, x2: number, y: number, color: string, width = 2, dash: number[] = []) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dash)
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.restore()
}

function niceStep(max: number, ticks = 4): number {
  const raw = Math.max(max, 1) / ticks
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}

/** Legend drawn right-aligned ending at `right`. */
function legend(ctx: Ctx, items: { label: string; color: string; dashed?: boolean }[], right: number, y: number) {
  ctx.font = `600 21px ${BODY}`
  const sw = 22
  const gap = 28
  const widths = items.map((it) => sw + 10 + ctx.measureText(it.label).width)
  let x = right - widths.reduce((a, b) => a + b, 0) - gap * (items.length - 1)
  items.forEach((it, i) => {
    if (it.dashed) {
      hLine(ctx, x, x + sw, y - 7, it.color, 3, [6, 4])
    } else {
      ctx.fillStyle = it.color
      roundRect(ctx, x, y - 17, sw, 17, 4)
      ctx.fill()
    }
    text(ctx, it.label, x + sw + 10, y, `600 21px ${BODY}`, MUTED)
    x += widths[i] + gap
  })
}

function header(ctx: Ctx, r: ReportData, title: string, page: number, pages: number) {
  text(ctx, 'Plately', M, M + 40, `800 42px ${DISPLAY}`, GREEN)
  text(ctx, title, M, M + 96, `700 38px ${DISPLAY}`, INK)
  text(ctx, r.name || 'Plately user', PW - M, M + 34, `700 28px ${BODY}`, INK, 'right')
  text(ctx, periodLabel(r.start, r.end), PW - M, M + 70, `600 24px ${BODY}`, MUTED, 'right')
  text(ctx, `Generated ${longDate(r.end)}`, PW - M, M + 102, `500 21px ${BODY}`, FAINT, 'right')
  hLine(ctx, M, PW - M, M + 132, LINE, 2)

  hLine(ctx, M, PW - M, PH - 86, LINE, 2)
  text(ctx, 'Based on meals marked as eaten in Plately.', M, PH - 50, `500 20px ${BODY}`, FAINT)
  text(ctx, `Page ${page} of ${pages}`, PW - M, PH - 50, `600 20px ${BODY}`, FAINT, 'right')
}

function dayLabel(ctx: Ctx, iso: ISODate, cx: number, y: number, period: ReportPeriod) {
  if (period === 30) {
    text(ctx, dayOfMonth(iso), cx, y, `600 18px ${NUM}`, FAINT, 'center')
    return
  }
  text(ctx, weekdayShort(iso), cx, y, `600 ${period === 7 ? 21 : 18}px ${BODY}`, MUTED, 'center')
  text(ctx, dayOfMonth(iso), cx, y + 24, `500 ${period === 7 ? 19 : 17}px ${NUM}`, FAINT, 'center')
}

function drawBars(
  ctx: Ctx,
  r: ReportData,
  o: {
    x: number
    y: number
    w: number
    h: number
    value: (d: ReportDay) => number
    color: (d: ReportDay) => string
    maxV: number
    band?: [number, number]
    target?: number
    showValues: boolean
  },
) {
  const axisW = 86
  const x0 = o.x + axisW
  const cw = o.w - axisW
  const step = niceStep(o.maxV)
  const top = Math.ceil(o.maxV / step) * step
  const yOf = (v: number) => o.y + o.h - (v / top) * o.h

  for (let v = 0; v <= top + 1e-6; v += step) {
    hLine(ctx, x0, o.x + o.w, yOf(v), v === 0 ? 'rgba(26,26,23,.25)' : LINE, 2)
    text(ctx, fmt(round(v)), x0 - 14, yOf(v) + 7, `500 19px ${NUM}`, FAINT, 'right')
  }

  if (o.band) {
    const [lo, hi] = o.band
    ctx.fillStyle = 'rgba(46,158,91,.10)'
    ctx.fillRect(x0, yOf(hi), cw, yOf(lo) - yOf(hi))
    hLine(ctx, x0, o.x + o.w, yOf(lo), 'rgba(46,158,91,.55)', 2, [10, 8])
    hLine(ctx, x0, o.x + o.w, yOf(hi), 'rgba(46,158,91,.55)', 2, [10, 8])
  }
  if (o.target) {
    hLine(ctx, x0, o.x + o.w, yOf(o.target), GREEN, 3, [12, 8])
  }

  const n = r.days.length
  const slot = cw / n
  const bw = Math.min(slot * 0.62, 64)
  const labelEvery = r.period === 30 ? 3 : 1

  r.days.forEach((d, i) => {
    const cx = x0 + slot * i + slot / 2
    const v = o.value(d)
    if (v > 0) {
      ctx.fillStyle = o.color(d)
      roundRect(ctx, cx - bw / 2, yOf(v), bw, o.y + o.h - yOf(v), Math.min(8, bw / 3))
      ctx.fill()
      if (o.showValues) {
        text(ctx, fmt(round(v)), cx, yOf(v) - 10, `600 ${r.period === 7 ? 20 : 16}px ${NUM}`, MUTED, 'center')
      }
    } else {
      hLine(ctx, cx - bw / 4, cx + bw / 4, o.y + o.h - 6, PENDING, 3)
    }
    if (i % labelEvery === 0 || i === n - 1) dayLabel(ctx, d.date, cx, o.y + o.h + 34, r.period)
  })
}

function drawPage1(ctx: Ctx, r: ReportData) {
  header(ctx, r, 'Nutrition report', 1, 2)
  const { win, goals } = r
  const innerW = PW - 2 * M

  text(
    ctx,
    `Targets  ${fmt(win.min)}–${fmt(win.max)} kcal  ·  ${fmt(goals.protein)} g protein  ·  Current streak ${r.streak} ${r.streak === 1 ? 'day' : 'days'}`,
    M,
    M + 180,
    `600 23px ${BODY}`,
    MUTED,
  )

  // Summary tiles, 2 × 3.
  const gap = 22
  const tileW = (innerW - gap * 2) / 3
  const tileH = 128
  const avgStatus =
    r.counted === 0
      ? { s: 'no complete days yet', c: FAINT }
      : r.avg.kcal > win.max
        ? { s: 'above your range', c: OVER }
        : r.avg.kcal < win.min
          ? { s: 'below your range', c: UNDER_TEXT }
          : { s: 'within your range', c: GREEN }
  const wc = r.weightChange
  const tiles: { label: string; value: string; sub: string; subColor?: string }[] = [
    {
      label: 'Days in range',
      value: `${r.inRange}/${r.counted}`,
      sub: r.counted ? `of ${r.counted} complete ${r.counted === 1 ? 'day' : 'days'}` : 'no complete days yet',
    },
    { label: 'Average calories', value: `${fmt(r.avg.kcal)}`, sub: avgStatus.s, subColor: avgStatus.c },
    { label: 'Average protein', value: `${r.avg.p} g`, sub: `target ${fmt(goals.protein)} g` },
    { label: 'Protein target hit', value: `${r.proteinHit}/${r.counted}`, sub: 'days' },
    { label: 'Days over range', value: `${r.over}`, sub: `${r.under} under` },
    {
      label: 'Weight change',
      value: wc === null ? (r.latestKg !== null ? `${r.latestKg} kg` : '—') : `${wc > 0 ? '+' : wc < 0 ? '−' : ''}${Math.abs(wc)} kg`,
      sub:
        wc !== null
          ? `${r.weights.length} weigh-ins this period`
          : r.latestKg !== null
            ? 'latest — not enough weigh-ins to compare'
            : 'no weigh-ins logged',
    },
  ]
  const tilesY = M + 206
  tiles.forEach((t, i) => {
    const tx = M + (i % 3) * (tileW + gap)
    const ty = tilesY + Math.floor(i / 3) * (tileH + gap)
    ctx.fillStyle = CARD
    roundRect(ctx, tx, ty, tileW, tileH, 18)
    ctx.fill()
    text(ctx, t.label, tx + 22, ty + 38, `600 21px ${BODY}`, MUTED)
    text(ctx, t.value, tx + 22, ty + 88, `700 42px ${NUM}`, INK)
    text(ctx, t.sub, tx + 22, ty + 114, `500 18px ${BODY}`, t.subColor ?? FAINT)
  })

  // Calories chart.
  const calTitleY = tilesY + tileH * 2 + gap + 70
  text(ctx, 'Calories per day', M, calTitleY, `700 28px ${DISPLAY}`, INK)
  legend(
    ctx,
    [
      { label: 'In range', color: GREEN },
      { label: 'Over', color: OVER },
      { label: 'Under', color: UNDER_BAR },
      { label: 'Target range', color: 'rgba(46,158,91,.55)', dashed: true },
    ],
    PW - M,
    calTitleY,
  )
  const calMax = Math.max(win.max * 1.15, ...r.days.map((d) => d.kcal))
  drawBars(ctx, r, {
    x: M,
    y: calTitleY + 46,
    w: innerW,
    h: 240,
    value: (d) => d.kcal,
    color: (d) => (d.status === 'over' ? OVER : d.status === 'in' ? GREEN : d.status === 'under' ? UNDER_BAR : PENDING),
    maxV: calMax,
    band: [win.min, win.max],
    showValues: r.period <= 14,
  })

  // Protein chart.
  const proTitleY = calTitleY + 46 + 240 + 110
  text(ctx, 'Protein per day', M, proTitleY, `700 28px ${DISPLAY}`, INK)
  legend(
    ctx,
    [
      { label: 'Target met', color: GREEN },
      { label: 'Below target', color: BELOW_TARGET },
      { label: `${fmt(goals.protein)} g target`, color: GREEN, dashed: true },
    ],
    PW - M,
    proTitleY,
  )
  const proMax = Math.max((goals.protein || 0) * 1.25, ...r.days.map((d) => d.p), 10)
  drawBars(ctx, r, {
    x: M,
    y: proTitleY + 46,
    w: innerW,
    h: 210,
    value: (d) => d.p,
    color: (d) => (d.status === 'progress' ? PENDING : d.score.proteinHit ? GREEN : BELOW_TARGET),
    maxV: proMax,
    target: goals.protein || undefined,
    showValues: r.period <= 14,
  })

  // Bottom row: macro split + weight trend.
  const cardY = proTitleY + 46 + 210 + 84
  const cardH = PH - 110 - cardY
  const cardW = (innerW - gap) / 2
  ;[0, 1].forEach((i) => {
    ctx.fillStyle = CARD
    roundRect(ctx, M + i * (cardW + gap), cardY, cardW, cardH, 20)
    ctx.fill()
  })

  // Macro split.
  const mx = M + 28
  text(ctx, 'Average macro split', mx, cardY + 46, `700 25px ${DISPLAY}`, INK)
  if (r.counted === 0) {
    text(ctx, 'No complete days logged yet.', mx, cardY + 100, `500 21px ${BODY}`, FAINT)
  } else {
    const barW = cardW - 56
    const barY = cardY + 76
    const segs = [
      { label: 'Protein', g: r.avg.p, pct: r.macroPct.p, color: MACRO.protein.color },
      { label: 'Carbs', g: r.avg.c, pct: r.macroPct.c, color: MACRO.carbs.color },
      { label: 'Fat', g: r.avg.f, pct: r.macroPct.f, color: MACRO.fat.color },
    ]
    ctx.save()
    roundRect(ctx, mx, barY, barW, 40, 12)
    ctx.clip()
    let sx = mx
    segs.forEach((s) => {
      const sw = (barW * s.pct) / 100
      ctx.fillStyle = s.color
      ctx.fillRect(sx, barY, sw + 1, 40)
      sx += sw
    })
    ctx.restore()
    segs.forEach((s, i) => {
      const ly = barY + 86 + i * 34
      ctx.fillStyle = s.color
      roundRect(ctx, mx, ly - 17, 18, 18, 4)
      ctx.fill()
      text(ctx, s.label, mx + 30, ly, `600 21px ${BODY}`, MUTED)
      text(ctx, `${s.g} g · ${s.pct}% of kcal`, mx + barW, ly, `600 21px ${NUM}`, INK, 'right')
    })
  }

  // Weight trend.
  const wx = M + cardW + gap + 28
  const ww = cardW - 56
  text(ctx, 'Weight', wx, cardY + 46, `700 25px ${DISPLAY}`, INK)
  if (r.weights.length >= 2 && r.weightChange !== null) {
    const change = r.weightChange
    text(
      ctx,
      `${r.weights[0].kg} → ${r.weights[r.weights.length - 1].kg} kg (${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)})`,
      wx + ww,
      cardY + 46,
      `600 20px ${NUM}`,
      MUTED,
      'right',
    )
    const gy = cardY + 80
    const gh = cardH - 120
    const kgs = r.weights.map((w) => w.kg)
    const lo = Math.min(...kgs) - 0.5
    const hi = Math.max(...kgs) + 0.5
    const xOfDate = (iso: ISODate) => {
      const idx = r.days.findIndex((d) => d.date === iso)
      return wx + (r.days.length > 1 ? (idx / (r.days.length - 1)) * ww : ww / 2)
    }
    const yOfKg = (kg: number) => gy + gh - ((kg - lo) / (hi - lo)) * gh
    hLine(ctx, wx, wx + ww, gy + gh, 'rgba(26,26,23,.18)', 2)
    ctx.strokeStyle = GREEN
    ctx.lineWidth = 4
    ctx.lineJoin = 'round'
    ctx.beginPath()
    r.weights.forEach((w, i) => {
      const px = xOfDate(w.date)
      const py = yOfKg(w.kg)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.stroke()
    r.weights.forEach((w) => {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(xOfDate(w.date), yOfKg(w.kg), 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = GREEN
      ctx.lineWidth = 3
      ctx.stroke()
    })
    text(ctx, periodLabel(r.start, r.end), wx, gy + gh + 30, `500 18px ${BODY}`, FAINT)
  } else {
    const lines =
      r.latestKg !== null
        ? [`Latest weight: ${r.latestKg} kg`, 'Log your weight a few times in a', 'period to see a trend here.']
        : ['No weigh-ins yet.', 'Log your weight on the Progress tab', 'to see a trend here.']
    lines.forEach((l, i) =>
      text(ctx, l, wx, cardY + 100 + i * 32, i === 0 ? `600 22px ${BODY}` : `500 20px ${BODY}`, i === 0 ? INK : FAINT),
    )
  }
}

function statusFor(d: ReportDay, r: ReportData): { label: string; color: string } {
  switch (d.status) {
    case 'in':
      return { label: 'In range', color: GREEN }
    case 'over':
      return { label: `Over by ${fmt(d.kcal - r.win.max)}`, color: OVER }
    case 'under':
      return { label: `Under by ${fmt(r.win.min - d.kcal)}`, color: UNDER_TEXT }
    case 'progress':
      return { label: 'In progress', color: FAINT }
    default:
      return { label: 'Not logged', color: FAINT }
  }
}

function drawPage2(ctx: Ctx, r: ReportData) {
  header(ctx, r, 'Daily log', 2, 2)

  const cols = {
    date: M + 20,
    kcal: M + 470,
    p: M + 640,
    c: M + 780,
    f: M + 900,
    status: M + 940,
  }
  const small = r.period === 30
  const top = M + 176
  const headH = 50
  const tableBottom = PH - 250
  const rowH = Math.min(52, (tableBottom - top - headH - 60) / r.days.length)
  const fs = small ? 20 : 24

  ctx.fillStyle = CARD
  roundRect(ctx, M, top, PW - 2 * M, headH, 12)
  ctx.fill()
  const hy = top + 33
  const hf = `700 19px ${BODY}`
  text(ctx, 'DATE', cols.date, hy, hf, MUTED)
  text(ctx, 'CALORIES', cols.kcal, hy, hf, MUTED, 'right')
  text(ctx, 'PROTEIN', cols.p, hy, hf, MUTED, 'right')
  text(ctx, 'CARBS', cols.c, hy, hf, MUTED, 'right')
  text(ctx, 'FAT', cols.f, hy, hf, MUTED, 'right')
  text(ctx, 'STATUS', cols.status, hy, hf, MUTED)

  let y = top + headH
  r.days.forEach((d, i) => {
    if (i % 2 === 1) {
      ctx.fillStyle = '#FBF9F4'
      ctx.fillRect(M, y, PW - 2 * M, rowH)
    }
    const ty = y + rowH / 2 + fs * 0.36
    const dl = parseISO(d.date)
    const empty = d.kcal <= 0
    text(ctx, `${weekdayShort(d.date)} ${dl.getDate()} ${MONTHS[dl.getMonth()]}`, cols.date, ty, `600 ${fs}px ${BODY}`, INK)
    text(ctx, empty ? '—' : fmt(d.kcal), cols.kcal, ty, `700 ${fs}px ${NUM}`, empty ? FAINT : INK, 'right')
    text(
      ctx,
      empty ? '—' : `${d.score.proteinHit ? '★ ' : ''}${round(d.p)} g`,
      cols.p,
      ty,
      `600 ${fs}px ${NUM}`,
      empty ? FAINT : d.score.proteinHit ? GREEN : INK,
      'right',
    )
    text(ctx, empty ? '—' : `${round(d.c)} g`, cols.c, ty, `500 ${fs}px ${NUM}`, empty ? FAINT : MUTED, 'right')
    text(ctx, empty ? '—' : `${round(d.f)} g`, cols.f, ty, `500 ${fs}px ${NUM}`, empty ? FAINT : MUTED, 'right')
    const st = statusFor(d, r)
    text(ctx, st.label, cols.status, ty, `600 ${small ? 19 : 22}px ${BODY}`, st.color)
    y += rowH
  })

  // Averages row.
  hLine(ctx, M, PW - M, y + 4, 'rgba(26,26,23,.3)', 2)
  const ay = y + 44
  text(ctx, `Average · ${r.counted} ${r.counted === 1 ? 'day' : 'days'}`, cols.date, ay, `700 ${fs}px ${BODY}`, INK)
  if (r.counted) {
    text(ctx, fmt(r.avg.kcal), cols.kcal, ay, `700 ${fs}px ${NUM}`, INK, 'right')
    text(ctx, `${r.avg.p} g`, cols.p, ay, `700 ${fs}px ${NUM}`, INK, 'right')
    text(ctx, `${r.avg.c} g`, cols.c, ay, `600 ${fs}px ${NUM}`, MUTED, 'right')
    text(ctx, `${r.avg.f} g`, cols.f, ay, `600 ${fs}px ${NUM}`, MUTED, 'right')
    text(ctx, `${r.inRange}/${r.counted} in range`, cols.status, ay, `700 ${small ? 19 : 22}px ${BODY}`, GREEN)
  }

  // Key.
  const ky = PH - 196
  text(ctx, 'How to read this', M, ky, `700 23px ${DISPLAY}`, INK)
  text(
    ctx,
    `In range = ${fmt(r.win.min)}–${fmt(r.win.max)} kcal. Going over counts against the day, the same as falling short.`,
    M,
    ky + 36,
    `500 20px ${BODY}`,
    MUTED,
  )
  text(
    ctx,
    `★ = protein target (${fmt(r.goals.protein)} g) met. Today is shown as in progress until it's in range or over.`,
    M,
    ky + 66,
    `500 20px ${BODY}`,
    MUTED,
  )
  if (r.weights.length) {
    const wl = r.weights
      .slice(-6)
      .map((w) => `${dayOfMonth(w.date)} ${MONTHS[parseISO(w.date).getMonth()]}: ${w.kg} kg`)
      .join('   ·   ')
    text(ctx, `Weigh-ins  ${wl}`, M, ky + 96, `600 20px ${BODY}`, MUTED)
  }
}

async function fontsReady() {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* fall back to system fonts */
  }
}

const toJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Uint8Array>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)), reject) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.9,
    ),
  )

/** Draw both pages and wrap them into a PDF. */
export async function buildReportPdf(r: ReportData): Promise<{ blob: Blob; filename: string; previewUrl: string }> {
  await fontsReady()
  const [c1, x1] = newPage()
  drawPage1(x1, r)
  const [c2, x2] = newPage()
  drawPage2(x2, r)
  const pages = await Promise.all([c1, c2].map(async (c) => ({ jpeg: await toJpeg(c), width: PW, height: PH })))
  const title = `Plately report ${r.start} to ${r.end}`
  return {
    blob: buildPdf(pages, { title }),
    filename: `plately-report-${r.start}-to-${r.end}.pdf`,
    previewUrl: c1.toDataURL('image/jpeg', 0.75),
  }
}

/** Hand the PDF to the share sheet (WhatsApp, email…); fall back to a download. */
export async function shareReportPdf(blob: Blob, filename: string, r: ReportData): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'application/pdf' })
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({
        files: [file],
        title: 'Plately nutrition report',
        text: `My Plately nutrition report, ${periodLabel(r.start, r.end)}`,
      })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return 'saved'
  } catch {
    return 'failed'
  }
}
