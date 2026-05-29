import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import type { Preferences, WeekPlan } from '@/types'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  const url = process.env.HACKATON_SUPABASE_URL
  const key = process.env.HACKATON_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!_client) _client = createClient(url, key)
  return _client
}

export function hashPrefs(prefs: Preferences): string {
  return createHash('sha256').update(JSON.stringify(prefs)).digest('hex').slice(0, 16)
}

export async function getCachedPlan(hash: string): Promise<WeekPlan | null> {
  const client = getClient()
  if (!client) return null
  const { data } = await client
    .from('meal_plan_cache')
    .select('plan')
    .eq('prefs_hash', hash)
    .single()
  return data?.plan ?? null
}

export async function setCachedPlan(hash: string, plan: WeekPlan): Promise<void> {
  const client = getClient()
  if (!client) return
  await client.from('meal_plan_cache').upsert({
    prefs_hash: hash,
    plan,
    cached_at: new Date().toISOString(),
  })
}

export async function getCachedRecipe(id: number): Promise<unknown | null> {
  const client = getClient()
  if (!client) return null
  const { data } = await client
    .from('recipe_cache')
    .select('data')
    .eq('spoonacular_id', id)
    .single()
  return data?.data ?? null
}

export async function setCachedRecipes(recipes: { id: number; data: unknown }[]): Promise<void> {
  const client = getClient()
  if (!client || recipes.length === 0) return
  await client.from('recipe_cache').upsert(
    recipes.map((r) => ({
      spoonacular_id: r.id,
      data: r.data,
      cached_at: new Date().toISOString(),
    }))
  )
}
