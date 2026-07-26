import type { Food } from './types'

const F = (
  id: string,
  name: string,
  cat: Food['cat'],
  kcal: number,
  p: number,
  c: number,
  f: number,
): Food => ({ id, name, cat, kcal, p, c, f })

// Foods referenced by the Coached by Vicks recipes + "Build Your Own Plate"
// portion tables. Values are per 100 g (standard references), deduped against
// the base starter foods in seed.ts.
export const EXTRA_FOODS: Food[] = [
  // Meat & Fish
  F('hake', 'Hake / white fish', 'Meat & Fish', 90, 18, 0, 1.5),
  F('tuna', 'Tuna, drained', 'Meat & Fish', 116, 26, 0, 1),
  F('steak-lean', 'Steak, lean cut', 'Meat & Fish', 214, 30, 0, 10),
  F('crumbed-chicken', 'Crumbed chicken fillet', 'Meat & Fish', 220, 21, 12, 10),

  // Dairy & Eggs
  F('egg-whites', 'Egg whites', 'Dairy & Eggs', 52, 11, 0.7, 0.2),
  F('feta', 'Feta cheese', 'Dairy & Eggs', 264, 14, 4, 21),
  F('light-cheese', 'Light cheese', 'Dairy & Eggs', 254, 24, 3, 16),
  F('cream-cheese-light', 'Light cream cheese', 'Dairy & Eggs', 200, 7, 6, 16),
  F('strawberry-yog', 'Strawberry low-fat yoghurt', 'Dairy & Eggs', 85, 3.5, 13, 1.5),

  // Pantry
  F('whey', 'Protein powder', 'Pantry', 380, 75, 10, 6),
  F('lentils', 'Lentils, cooked', 'Pantry', 116, 9, 20, 0.4),
  F('chickpeas', 'Chickpeas, cooked', 'Pantry', 164, 9, 27, 2.6),
  F('black-beans', 'Black beans, cooked', 'Pantry', 132, 9, 24, 0.5),
  F('tempeh', 'Tempeh', 'Pantry', 192, 20, 8, 11),
  F('couscous', 'Couscous, cooked', 'Pantry', 112, 3.8, 23, 0.2),
  F('granola', 'Granola', 'Pantry', 450, 10, 64, 17),
  F('weetbix', 'Weet-Bix', 'Pantry', 348, 12, 67, 2),
  F('muesli', 'Mixed berries muesli', 'Pantry', 360, 9, 66, 6),
  F('chia', 'Chia seeds', 'Pantry', 486, 17, 42, 31),
  F('flax', 'Ground flax seeds', 'Pantry', 534, 18, 29, 42),
  F('mixed-seeds', 'Mixed seeds', 'Pantry', 559, 24, 20, 45),
  F('cashews', 'Cashews', 'Pantry', 553, 18, 30, 44),
  F('hummus', 'Hummus', 'Pantry', 166, 8, 14, 10),
  F('olives', 'Olives', 'Pantry', 115, 0.8, 6, 11),
  F('honey', 'Honey', 'Pantry', 304, 0.3, 82, 0),
  F('pesto', 'Basil pesto', 'Pantry', 450, 4, 6, 46),
  F('mayo-lite', 'Lite mayonnaise', 'Pantry', 350, 1, 10, 33),
  F('sweetcorn', 'Sweetcorn', 'Pantry', 86, 3, 19, 1.2),

  // Bakery
  F('ww-wrap', 'Wholewheat wrap', 'Bakery', 297, 9, 49, 6),
  F('lowcarb-wrap', 'Low-carb wrap', 'Bakery', 250, 20, 30, 8),
  F('sourdough', 'Sourdough bread', 'Bakery', 250, 8, 48, 1.5),
  F('eng-muffin', 'English muffin', 'Bakery', 235, 8, 46, 1.8),
  F('burger-bun', 'Burger bun', 'Bakery', 280, 9, 50, 4),

  // Produce
  F('babypotato', 'Baby potatoes', 'Produce', 77, 2, 17, 0.1),
  F('butternut', 'Butternut', 'Produce', 45, 1, 12, 0.1),
  F('greenbeans', 'Green beans', 'Produce', 31, 1.8, 7, 0.1),
  F('peppers', 'Mixed peppers', 'Produce', 26, 1, 6, 0.3),
  F('mushrooms', 'Mushrooms', 'Produce', 22, 3.1, 3.3, 0.3),
  F('zucchini', 'Baby marrow (zucchini)', 'Produce', 17, 1.2, 3.1, 0.3),
  F('carrots', 'Carrots', 'Produce', 41, 0.9, 10, 0.2),
  F('cabbage', 'Cabbage', 'Produce', 25, 1.3, 6, 0.1),
  F('salad-mix', 'Salad mix', 'Produce', 15, 1.4, 2.9, 0.2),
  F('cauliflower', 'Cauliflower', 'Produce', 25, 1.9, 5, 0.3),
  F('cherry-tomato', 'Cherry tomatoes', 'Produce', 18, 0.9, 3.9, 0.2),
  F('cucumber', 'Cucumber', 'Produce', 15, 0.7, 3.6, 0.1),
  F('strawberries', 'Strawberries', 'Produce', 32, 0.7, 7.7, 0.3),

  // Frozen
  F('frozen-veg', 'Frozen mixed vegetables', 'Frozen', 72, 3, 13, 0.5),

  // Other — sweet treats (per 100 g)
  F('dairymilk', 'Cadbury Dairy Milk', 'Other', 534, 7.3, 57, 30),
  F('kitkat', 'KitKat', 'Other', 518, 6, 61, 27),
  F('futurelife-bar', 'Futurelife protein bar', 'Other', 380, 20, 45, 12),
  F('rusk', 'Buttermilk rusk', 'Other', 443, 7, 73, 13),
]
