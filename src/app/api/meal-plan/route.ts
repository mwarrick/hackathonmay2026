import { searchMeals, getBulkRecipeDetails } from '@/lib/spoonacular'
import { getCachedPlan, setCachedPlan, setCachedRecipes, hashPrefs } from '@/lib/db'
import type { Preferences, WeekPlan } from '@/types'

export async function POST(request: Request) {
  let prefs: Preferences
  try {
    prefs = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const hash = hashPrefs(prefs)

  try {
    const cached = await getCachedPlan(hash)
    if (cached) return Response.json(cached)
  } catch {
    // cache miss — continue to generate
  }

  try {
    const [breakfasts, lunches, dinners] = await Promise.all([
      searchMeals(prefs, 'breakfast', 7),
      searchMeals(prefs, 'lunch', 7),
      searchMeals(prefs, 'dinner', 7),
    ])

    const plan: WeekPlan = Array.from({ length: 7 }, (_, i) => ({
      breakfast: breakfasts[i % Math.max(breakfasts.length, 1)] ?? null,
      lunch: lunches[i % Math.max(lunches.length, 1)] ?? null,
      dinner: dinners[i % Math.max(dinners.length, 1)] ?? null,
    }))

    await setCachedPlan(hash, plan)

    // Pre-warm recipe cache with full details (ingredients, instructions) in one bulk call
    const allIds = [
      ...breakfasts.map((m) => m.id),
      ...lunches.map((m) => m.id),
      ...dinners.map((m) => m.id),
    ].filter((id, i, arr) => arr.indexOf(id) === i)

    getBulkRecipeDetails(allIds)
      .then((details: { id: number }[]) =>
        setCachedRecipes(details.map((d) => ({ id: d.id, data: d })))
      )
      .catch(() => {})

    return Response.json(plan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
