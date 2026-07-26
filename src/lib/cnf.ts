import type { Food } from '../types'

// Canadian Nutrient File (Health Canada) — live, CORS-enabled, no key.
// We call the official API directly (sanctioned reuse); we don't host a copy.
// Attribution is required and shown in the UI. Values are per 100 g, as provided.
const BASE = 'https://food-nutrition.canada.ca/api/canadian-nutrient-file'

export const CNF_ATTRIBUTION = 'Data: Canadian Nutrient File, Health Canada.'
export const CNF_DISCLAIMER =
  'Reference only, not medical advice. Not affiliated with or endorsed by Health Canada.'

export interface CnfListItem {
  code: number
  name: string
}

// nutrient_name_id → our macro fields
const NUT = { kcal: 208, protein: 203, carbs: 205, fat: 204 } as const

let listCache: CnfListItem[] | null = null

/** Fetch (once per session) the full food list: code + description. */
export async function cnfFoodList(): Promise<CnfListItem[]> {
  if (listCache) return listCache
  const res = await fetch(`${BASE}/food/?lang=en&type=json`)
  if (!res.ok) throw new Error(`CNF food list ${res.status}`)
  const data = (await res.json()) as { food_code: number; food_description: string }[]
  listCache = data.map((d) => ({ code: d.food_code, name: d.food_description }))
  return listCache
}

/** Fetch one food's macros and map to a per-100 g Plately Food. */
export async function cnfFood(code: number, name: string): Promise<Food> {
  const res = await fetch(`${BASE}/nutrientamount/?lang=en&type=json&id=${code}`)
  if (!res.ok) throw new Error(`CNF nutrients ${res.status}`)
  const data = (await res.json()) as { nutrient_name_id: number; nutrient_value: number }[]
  const val = (id: number) => {
    const row = data.find((d) => d.nutrient_name_id === id)
    return row ? row.nutrient_value : 0
  }
  const r1 = (n: number) => Math.round(n * 10) / 10
  return {
    id: 'cnf-' + code,
    name,
    cat: 'Other',
    kcal: Math.round(val(NUT.kcal)),
    p: r1(val(NUT.protein)),
    c: r1(val(NUT.carbs)),
    f: r1(val(NUT.fat)),
  }
}
