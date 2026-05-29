import { searchMeals } from '@/lib/spoonacular'
import type { Preferences, WeekPlan } from '@/types'

export async function POST(request: Request) {
  let prefs: Preferences
  try {
    prefs = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
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

    return Response.json(plan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
