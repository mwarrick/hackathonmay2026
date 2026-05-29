import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import type { Preferences, WeekPlan } from '@/types'

const supabase = createClient(
  process.env.HACKATON_SUPABASE_URL!,
  process.env.HACKATON_SUPABASE_ANON_KEY!
)

export function hashPrefs(prefs: Preferences): string {
  return createHash('sha256').update(JSON.stringify(prefs)).digest('hex').slice(0, 16)
}

export async function getCachedPlan(hash: string): Promise<WeekPlan | null> {
  const { data } = await supabase
    .from('meal_plan_cache')
    .select('plan')
    .eq('prefs_hash', hash)
    .single()
  return data?.plan ?? null
}

export async function setCachedPlan(hash: string, plan: WeekPlan): Promise<void> {
  await supabase.from('meal_plan_cache').upsert({
    prefs_hash: hash,
    plan,
    cached_at: new Date().toISOString(),
  })
}

export async function getCachedRecipe(id: number): Promise<unknown | null> {
  const { data } = await supabase
    .from('recipe_cache')
    .select('data')
    .eq('spoonacular_id', id)
    .single()
  return data?.data ?? null
}

export async function setCachedRecipes(recipes: { id: number; data: unknown }[]): Promise<void> {
  if (recipes.length === 0) return
  await supabase.from('recipe_cache').upsert(
    recipes.map((r) => ({
      spoonacular_id: r.id,
      data: r.data,
      cached_at: new Date().toISOString(),
    }))
  )
}
