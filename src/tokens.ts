import type { Category } from './types'

/** Design tokens transcribed from the handoff README. */
export const COLORS = {
  green: '#2E9E5B',
  greenHover: '#237a46',
  greenTint: '#EAF5EE',
  ink: '#1A1A17',
  appBg: '#FBF9F3',
  canvas: '#efece5',
  cardBorder: '#EFE9DD',
  hairline: '#F4EFE5',
  inputBorder: '#E4DDCD',
  track: '#ECE7DD',
  scrim: 'rgba(26,26,23,.35)',
}

/** ink at N% opacity — matches the prototype's rgba(26,26,23,.NN) usages. */
export const ink = (pct: number) => `rgba(26,26,23,${pct})`

export const MACRO = {
  protein: { color: '#E4572E', bg: '#F1E5E0' },
  carbs: { color: '#EFA23C', bg: '#F4EBDA' },
  fat: { color: '#5B8DEF', bg: '#E4E9F5' },
}

export const CAT_COLORS: Record<Category, string> = {
  Produce: '#3E9B4F',
  'Meat & Fish': '#E4572E',
  'Dairy & Eggs': '#EFA23C',
  Bakery: '#B07A3C',
  Pantry: '#7C6BD9',
  Frozen: '#5B8DEF',
  Other: '#7A8A80',
}
