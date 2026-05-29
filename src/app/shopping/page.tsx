'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { WeekPlan } from '@/types'

interface Ingredient {
  id: number
  name: string
  amount: number
  unit: string
  aisle: string
  original: string
}

interface AggregatedItem {
  name: string
  entries: { amount: string; unit: string; recipes: string[] }[]
  aisle: string
}

function aggregateIngredients(
  recipeMap: Record<number, { title: string; extendedIngredients?: Ingredient[] }>
): Record<string, AggregatedItem[]> {
  const byAisle: Record<string, Record<string, AggregatedItem>> = {}

  for (const recipe of Object.values(recipeMap)) {
    if (!recipe.extendedIngredients) continue
    for (const ing of recipe.extendedIngredients) {
      const aisle = ing.aisle?.split(';')[0]?.trim() ?? 'Other'
      const key = ing.name.toLowerCase().trim()

      if (!byAisle[aisle]) byAisle[aisle] = {}
      if (!byAisle[aisle][key]) {
        byAisle[aisle][key] = { name: ing.name, entries: [], aisle }
      }

      const unitKey = ing.unit?.toLowerCase() ?? ''
      const existing = byAisle[aisle][key].entries.find((e) => e.unit.toLowerCase() === unitKey)
      if (existing) {
        existing.amount = (parseFloat(existing.amount) + ing.amount).toFixed(1).replace(/\.0$/, '')
        if (!existing.recipes.includes(recipe.title)) existing.recipes.push(recipe.title)
      } else {
        byAisle[aisle][key].entries.push({
          amount: ing.amount.toFixed(1).replace(/\.0$/, ''),
          unit: ing.unit ?? '',
          recipes: [recipe.title],
        })
      }
    }
  }

  const result: Record<string, AggregatedItem[]> = {}
  for (const [aisle, items] of Object.entries(byAisle)) {
    result[aisle] = Object.values(items).sort((a, b) => a.name.localeCompare(b.name))
  }
  return result
}

export default function ShoppingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aisles, setAisles] = useState<Record<string, AggregatedItem[]>>({})
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('mealplanner_plan')
    if (!stored) { setError('No meal plan found. Generate a plan first.'); setLoading(false); return }

    const plan: WeekPlan = JSON.parse(stored)
    const ids = new Set<number>()
    for (const day of plan) {
      for (const meal of [day.breakfast, day.lunch, day.dinner]) {
        if (meal) ids.add(meal.id)
      }
    }

    fetch(`/api/recipes/bulk?ids=${[...ids].join(',')}`)
      .then((r) => r.json())
      .then((data) => setAisles(aggregateIngredients(data)))
      .catch(() => setError('Could not load ingredients'))
      .finally(() => setLoading(false))
  }, [])

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const sortedAisles = Object.keys(aisles).sort()
  const totalItems = sortedAisles.reduce((sum, a) => sum + aisles[a].length, 0)
  const checkedCount = checked.size

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Shopping List</h1>
            <p className="text-xs text-stone-500">{checkedCount}/{totalItems} items checked</p>
          </div>
          <Link href="/plan" className="text-sm text-stone-500 hover:text-emerald-600 transition-colors">
            ← Back to plan
          </Link>
        </div>
        {totalItems > 0 && (
          <div className="bg-stone-100 h-1">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{ width: `${(checkedCount / totalItems) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="text-stone-400">Loading ingredients…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700">
            {error}
            <Link href="/" className="block mt-2 text-red-500 hover:underline">Go to meal planner →</Link>
          </div>
        )}

        {!loading && !error && sortedAisles.length === 0 && (
          <p className="text-stone-400 text-center py-20">No ingredients found.</p>
        )}

        {sortedAisles.map((aisle) => (
          <section key={aisle} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3 flex items-center gap-2">
              <span className="flex-1 h-px bg-stone-200" />
              {aisle}
              <span className="flex-1 h-px bg-stone-200" />
            </h2>
            <ul className="space-y-2">
              {aisles[aisle].map((item) => {
                const key = `${aisle}::${item.name}`
                const isChecked = checked.has(key)
                const summary = item.entries
                  .map((e) => `${e.amount}${e.unit ? ' ' + e.unit : ''}`)
                  .join(' + ')

                return (
                  <li key={key}>
                    <label className="flex items-start gap-3 cursor-pointer rounded-xl bg-white border border-stone-200 px-4 py-3 hover:border-emerald-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(key)}
                        className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium transition-colors ${
                          isChecked ? 'line-through text-stone-400' : 'text-stone-800'
                        }`}>
                          {item.name}
                        </span>
                        <span className={`ml-2 text-sm transition-colors ${
                          isChecked ? 'text-stone-300' : 'text-stone-500'
                        }`}>
                          {summary}
                        </span>
                        <p className="text-xs text-stone-400 mt-0.5 truncate">
                          {item.entries.flatMap((e) => e.recipes).filter((r, i, a) => a.indexOf(r) === i).join(', ')}
                        </p>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {checkedCount === totalItems && totalItems > 0 && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-6 text-center mt-4">
            <p className="text-2xl mb-1">🛒</p>
            <p className="font-semibold text-emerald-700">All done! Happy cooking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
