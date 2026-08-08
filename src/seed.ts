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

export const AI_PROMPT = `You are filling in a meal-planning app's food library.
Work through all three steps before you answer.

STEP 1 — Find the values
For each food give: calories (kcal), protein (g), carbs (g), fat (g),
all PER 100 g — or per 100 ml for liquids.

If I give you a photo, label or pack text, THAT is the source of truth.
Use it instead of what you remember about the product, even if they disagree.
Labels are often per serving, not per 100 g. If so, convert:
  per_100g = per_serving / serving_size_in_g x 100
State which serving size you converted from.

STEP 2 — Check your own numbers before answering
For every food, verify all of these:
  a) Energy adds up. protein x 4 + carbs x 4 + fat x 9 must land within
     about 10% of your calorie figure. If it doesn't, you made a mistake —
     find it and redo the food.
  b) The values really are per 100 g, not per serving or per pack.
  c) protein + carbs + fat does not exceed 100 g per 100 g of food.
  d) The figure matches the exact product/preparation I asked for
     (raw vs cooked, whole vs skim, with or without oil).
If a food fails a check, fix it. If you cannot verify it, do NOT guess —
leave it out of the list and flag it under UNSURE.

STEP 3 — Answer
Output ONLY the list, one food per line, in exactly this format.
No header, no bullets, no notes, no units, no ranges:

Name | Category | calories | protein | carbs | fat | servings

Category must be one of: Produce, Meat & Fish, Dairy & Eggs,
Bakery, Pantry, Frozen, Other.

"servings" is how this food is normally eaten — 1 to 3 typical portions,
separated by semicolons, each as "Label 250g". Use the pack size when there
is one. Example: Bottle 250g; Glass 200g
If you have no sensible serving, leave the field empty but keep the | before it.

After the list, if anything was uncertain, add lines like:
UNSURE: white bread — need the brand or the label photo

Foods to add: [list your foods here, or paste/attach a nutrition label, e.g.
chicken thigh, jasmine rice, kimchi, olive oil]`
