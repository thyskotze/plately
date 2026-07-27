import type { Food, WeightEntry } from './types'

const F = (
  id: string,
  name: string,
  cat: Food['cat'],
  kcal: number,
  p: number,
  c: number,
  f: number,
): Food => ({ id, name, cat, kcal, p, c, f })

export const SEED_FOODS: Food[] = [
  F('oats', 'Rolled oats', 'Pantry', 389, 16.9, 66, 6.9),
  F('banana', 'Banana', 'Produce', 89, 1.1, 23, 0.3),
  F('chicken', 'Chicken breast', 'Meat & Fish', 165, 31, 0, 3.6),
  F('rice', 'White rice, cooked', 'Pantry', 130, 2.7, 28, 0.3),
  F('egg', 'Egg', 'Dairy & Eggs', 143, 13, 1.1, 9.5),
  F('greek-yogurt', 'Greek yogurt', 'Dairy & Eggs', 59, 10, 3.6, 0.4),
  F('almonds', 'Almonds', 'Pantry', 579, 21, 22, 50),
  F('broccoli', 'Broccoli', 'Produce', 34, 2.8, 7, 0.4),
  F('salmon', 'Salmon fillet', 'Meat & Fish', 208, 20, 0, 13),
  F('avocado', 'Avocado', 'Produce', 160, 2, 9, 15),
  F('milk', 'Whole milk', 'Dairy & Eggs', 61, 3.2, 4.8, 3.3),
  F('oliveoil', 'Olive oil', 'Pantry', 884, 0, 0, 100),
  F('sweetpotato', 'Sweet potato', 'Produce', 86, 1.6, 20, 0.1),
  F('pb', 'Peanut butter', 'Pantry', 588, 25, 20, 50),
  F('bread', 'Whole wheat bread', 'Bakery', 247, 13, 41, 3.4),
  F('cheddar', 'Cheddar cheese', 'Dairy & Eggs', 403, 25, 1.3, 33),
  F('apple', 'Apple', 'Produce', 52, 0.3, 14, 0.2),
  F('beef', 'Lean ground beef', 'Meat & Fish', 176, 20, 0, 10),
  F('pasta', 'Pasta, cooked', 'Pantry', 158, 5.8, 31, 0.9),
  F('spinach', 'Spinach', 'Produce', 23, 2.9, 3.6, 0.4),
  F('blueberries', 'Blueberries', 'Produce', 57, 0.7, 14, 0.3),
  F('tofu', 'Firm tofu', 'Other', 76, 8, 1.9, 4.8),
  F('quinoa', 'Quinoa, cooked', 'Pantry', 120, 4.4, 21, 1.9),
  F('cottage', 'Cottage cheese', 'Dairy & Eggs', 98, 11, 3.4, 4.3),
]

export const SEED_WEIGHTS: WeightEntry[] = [
  { label: 'Jun 30', kg: 78.9 },
  { label: 'Jul 7', kg: 78.3 },
  { label: 'Jul 14', kg: 77.9 },
  { label: 'Jul 18', kg: 77.5 },
  { label: 'Jul 22', kg: 77.1 },
  { label: 'Jul 25', kg: 76.8 },
]

export const AI_PROMPT = `You are helping me fill a meal-planning app's food library.
Return ONLY a list, one food per line, in exactly this format:

Name | Category | calories | protein | carbs | fat

Rules:
- All values are per 100 g (or per 100 ml for liquids).
- calories in kcal; protein, carbs, fat in grams; numbers only.
- Category must be one of: Produce, Meat & Fish,
  Dairy & Eggs, Bakery, Pantry, Frozen, Other.
- No header row, no bullets, no extra text.

Foods to add: [list your foods here, e.g.
chicken thigh, jasmine rice, kimchi, olive oil]`
