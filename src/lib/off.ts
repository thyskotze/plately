import type { Food } from '../types'

// Open Food Facts — keyless, CORS-friendly. Best for packaged/barcoded products.
// A missing product still returns HTTP 200 with status 0, so we check status.
const BASE = 'https://world.openfoodfacts.org/api/v2'

export const OFF_ATTRIBUTION = 'Product data: Open Food Facts.'

/** Look up a barcode; returns a per-100 g Food, or null if not found. */
export async function offLookup(barcode: string): Promise<Food | null> {
  const url = `${BASE}/product/${encodeURIComponent(barcode)}?fields=product_name,brands,nutriments`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OFF ${res.status}`)
  const data = (await res.json()) as {
    status?: number
    product?: {
      product_name?: string
      brands?: string
      nutriments?: Record<string, number | undefined>
    }
  }
  if (data.status !== 1 || !data.product) return null
  const n = data.product.nutriments || {}
  const num = (k: string) => {
    const v = n[k]
    return typeof v === 'number' && isFinite(v) ? Math.round(v * 10) / 10 : 0
  }
  const name =
    [data.product.brands?.split(',')[0]?.trim(), data.product.product_name?.trim()]
      .filter(Boolean)
      .join(' ') || `Product ${barcode}`
  return {
    id: 'off-' + barcode,
    name,
    cat: 'Other',
    kcal: Math.round(num('energy-kcal_100g')),
    p: num('proteins_100g'),
    c: num('carbohydrates_100g'),
    f: num('fat_100g'),
  }
}
