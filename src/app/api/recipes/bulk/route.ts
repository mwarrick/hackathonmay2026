import { getBulkRecipeDetails } from '@/lib/spoonacular'
import { getCachedRecipe, setCachedRecipes } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) return Response.json({ error: 'ids required' }, { status: 400 })

  const numIds = ids.split(',').map(Number).filter(Boolean)

  // Split into cached and missing
  const results: Record<number, unknown> = {}
  const missing: number[] = []

  await Promise.all(
    numIds.map(async (id) => {
      const cached = await getCachedRecipe(id).catch(() => null)
      if (cached) results[id] = cached
      else missing.push(id)
    })
  )

  if (missing.length > 0) {
    const fetched: { id: number }[] = await getBulkRecipeDetails(missing)
    await setCachedRecipes(fetched.map((r) => ({ id: r.id, data: r }))).catch(() => {})
    for (const r of fetched) results[r.id] = r
  }

  return Response.json(results)
}
