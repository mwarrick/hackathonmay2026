import { searchMeals } from '@/lib/spoonacular'
import type { Preferences } from '@/types'

export async function POST(request: Request) {
  let body: { prefs: Preferences; mealType: 'breakfast' | 'lunch' | 'dinner'; excludeId: number }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { prefs, mealType, excludeId } = body

  try {
    // Try a few random offsets until we get a meal different from the current one
    for (let attempt = 0; attempt < 3; attempt++) {
      const randomOffset = Math.floor(Math.random() * 20)
      const meals = await searchMeals(prefs, mealType, 5, randomOffset)
      const different = meals.find((m) => m.id !== excludeId)
      if (different) return Response.json(different)
    }

    return Response.json({ error: 'No alternative found' }, { status: 404 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
