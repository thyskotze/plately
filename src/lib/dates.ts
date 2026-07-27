// Local calendar-date helpers. Day keys are local `YYYY-MM-DD` strings — never
// use toISOString() for keys (it is UTC and breaks near midnight).
export type ISODate = string

const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const toISO = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = (): ISODate => toISO(new Date())

/** Parse a local date string to a Date at local midnight. */
export const parseISO = (iso: ISODate): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (iso: ISODate, n: number): ISODate => {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Monday of the week containing `iso`. */
export const startOfWeek = (iso: ISODate): ISODate => {
  const d = parseISO(iso)
  const dow = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - dow)
  return toISO(d)
}

export const weekDates = (iso: ISODate): ISODate[] => {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const weekdayShort = (iso: ISODate): string => DOW[parseISO(iso).getDay()]
export const dayOfMonth = (iso: ISODate): string => String(parseISO(iso).getDate())

/** "Monday, Jul 27" */
export const longLabel = (iso: ISODate): string => {
  const d = parseISO(iso)
  return `${FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "Today" / "Tomorrow" / "Yesterday" / else longLabel. */
export const relativeLabel = (iso: ISODate): string => {
  const t = todayISO()
  if (iso === t) return 'Today'
  if (iso === addDays(t, 1)) return 'Tomorrow'
  if (iso === addDays(t, -1)) return 'Yesterday'
  return longLabel(iso)
}

/**
 * Remap a map whose keys may be old integer strings ('0'..'6') to date keys,
 * anchored so index 1 (the old "today") = `today` and index i = today+(i-1).
 * Keys that are already dates pass through unchanged. Used by the persist
 * migration and by backup import.
 */
export const remapWeekKeys = <T>(
  obj: Record<string, T> | undefined,
  today: ISODate,
): Record<string, T> => {
  const out: Record<string, T> = {}
  Object.keys(obj || {}).forEach((k) => {
    const i = Number(k)
    const key = /^\d+$/.test(k) && Number.isInteger(i) ? addDays(today, i - 1) : k
    out[key] = (obj as Record<string, T>)[k]
  })
  return out
}
