import type { Meal, Preferences } from '@/types'

const BASE = 'https://api.spoonacular.com'

const MEAL_CALORIE_SPLIT = { breakfast: 0.25, lunch: 0.40, dinner: 0.35 } as const

const MAX_READY_TIME: Record<Preferences['prepTime'], number | null> = {
  quick: 15,
  standard: 45,
  extended: null,
}

function extractNutrient(nutrition: { nutrients?: { name: string; amount: number }[] }, name: string): number {
  const match = nutrition?.nutrients?.find((n) => n.name === name)
  return Math.round(match?.amount ?? 0)
}

function mapRecipe(r: {
  id: number
  title: string
  image?: string
  readyInMinutes?: number
  servings?: number
  nutrition?: { nutrients?: { name: string; amount: number }[] }
  sourceUrl?: string
}): Meal {
  return {
    id: r.id,
    title: r.title,
    image: r.image ?? '',
    readyInMinutes: r.readyInMinutes ?? 0,
    servings: r.servings ?? 1,
    calories: extractNutrient(r.nutrition ?? {}, 'Calories'),
    protein: extractNutrient(r.nutrition ?? {}, 'Protein'),
    fat: extractNutrient(r.nutrition ?? {}, 'Fat'),
    carbs: extractNutrient(r.nutrition ?? {}, 'Carbohydrates'),
    sourceUrl: r.sourceUrl ?? '',
  }
}

const MEAL_TYPE: Record<'breakfast' | 'lunch' | 'dinner', string> = {
  breakfast: 'breakfast',
  lunch: 'soup,salad,sandwich,main course',
  dinner: 'main course',
}

const MEAL_OFFSET: Record<'breakfast' | 'lunch' | 'dinner', number> = {
  breakfast: 0,
  lunch: 0,
  dinner: 7,
}

export async function searchMeals(
  prefs: Preferences,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  count: number,
  offsetOverride?: number
): Promise<Meal[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) throw new Error('SPOONACULAR_API_KEY not set')

  const maxCals = Math.round(prefs.calories * MEAL_CALORIE_SPLIT[mealType])
  const offset = offsetOverride ?? MEAL_OFFSET[mealType]
  const params = new URLSearchParams({
    apiKey,
    type: MEAL_TYPE[mealType],
    number: String(count),
    offset: String(offset),
    addRecipeInformation: 'true',
    addRecipeNutrition: 'true',
    instructionsRequired: 'true',
    sort: 'popularity',
    maxCalories: String(maxCals),
  })

  if (prefs.cuisines.length > 0) params.set('cuisine', prefs.cuisines.join(','))
  if (prefs.diet && prefs.diet !== 'none') params.set('diet', prefs.diet)
  if (prefs.intolerances.length > 0) params.set('intolerances', prefs.intolerances.join(','))

  const maxTime = MAX_READY_TIME[prefs.prepTime]
  if (maxTime !== null) params.set('maxReadyTime', String(maxTime))

  const res = await fetch(`${BASE}/recipes/complexSearch?${params}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spoonacular ${res.status}: ${text}`)
  }

  const data = await res.json()
  return (data.results ?? []).map(mapRecipe)
}

export async function getRecipeDetails(id: number) {
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) throw new Error('SPOONACULAR_API_KEY not set')

  const params = new URLSearchParams({ apiKey, includeNutrition: 'true' })
  const res = await fetch(`${BASE}/recipes/${id}/information?${params}`)
  if (!res.ok) throw new Error(`Spoonacular ${res.status}`)
  return res.json()
}

export async function getBulkRecipeDetails(ids: number[]) {
  if (ids.length === 0) return []
  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) throw new Error('SPOONACULAR_API_KEY not set')

  const params = new URLSearchParams({
    apiKey,
    ids: ids.join(','),
    includeNutrition: 'true',
  })
  const res = await fetch(`${BASE}/recipes/informationBulk?${params}`)
  if (!res.ok) throw new Error(`Spoonacular bulk ${res.status}`)
  return res.json()
}
