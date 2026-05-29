import { getRecipeDetails } from '@/lib/spoonacular'
import { getCachedRecipe, setCachedRecipes } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numId = Number(id)

  try {
    const cached = await getCachedRecipe(numId)
    if (cached) return Response.json(cached)
  } catch {
    // cache miss
  }

  try {
    const recipe = await getRecipeDetails(numId)
    await setCachedRecipes([{ id: numId, data: recipe }])
    return Response.json(recipe)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
