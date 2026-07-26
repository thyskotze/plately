import type { Food } from '../types'

// USDA FoodData Central — CORS-enabled. Needs a free API key for real volume.
// DEMO_KEY works but is rate-limited (~10/hour). Get a free key in seconds at
// https://fdc.nal.usda.gov/api-key-signup.html and paste it below.
const USDA_KEY = 'DEMO_KEY'
const BASE = 'https://api.nal.usda.gov/fdc/v1'

export const USDA_ATTRIBUTION = 'Data: USDA FoodData Central.'

export interface UsdaItem {
  fdcId: number
  name: string
  kcal: number
  p: number
  c: number
  f: number
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim()

const r1 = (n: number) => Math.round(n * 10) / 10

export async function usdaSearch(query: string): Promise<UsdaItem[]> {
  const url = `${BASE}/foods/search?query=${encodeURIComponent(query)}&pageSize=25&api_key=${USDA_KEY}`
  const res = await fetch(url)
  if (res.status === 429) throw new Error('rate')
  if (!res.ok) throw new Error(`USDA ${res.status}`)
  const data = (await res.json()) as {
    foods?: { fdcId: number; description: string; foodNutrients?: { nutrientNumber?: string; value?: number }[] }[]
  }
  return (data.foods || []).map((f) => {
    const nv = (num: string) => {
      const row = (f.foodNutrients || []).find((n) => String(n.nutrientNumber) === num)
      return row?.value ?? 0
    }
    return {
      fdcId: f.fdcId,
      name: titleCase(f.description),
      kcal: Math.round(nv('208')),
      p: r1(nv('203')),
      c: r1(nv('205')),
      f: r1(nv('204')),
    }
  })
}

export const usdaToFood = (it: UsdaItem): Food => ({
  id: 'usda-' + it.fdcId,
  name: it.name,
  cat: 'Other',
  kcal: it.kcal,
  p: it.p,
  c: it.c,
  f: it.f,
})
