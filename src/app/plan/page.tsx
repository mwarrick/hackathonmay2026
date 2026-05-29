'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { WeekPlan, Preferences, Meal } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const

function MealCard({
  meal,
  householdSize,
  onSwap,
  swapping,
}: {
  meal: Meal | null
  householdSize: number
  onSwap: () => void
  swapping: boolean
}) {
  if (!meal) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 min-h-[120px] flex items-center justify-center">
        <span className="text-stone-400 text-xs">No result</span>
      </div>
    )
  }

  const scaledCalories = Math.round(meal.calories * householdSize)

  return (
    <div className="group rounded-xl border border-stone-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
      {meal.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meal.image}
          alt={meal.title}
          className="w-full h-24 object-cover"
        />
      )}
      <div className="p-2.5">
        <Link
          href={`/recipe/${meal.id}/cook?household=${householdSize}`}
          className="text-xs font-semibold text-stone-800 hover:text-emerald-600 line-clamp-2 leading-tight block"
        >
          {meal.title}
        </Link>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-500">
          <span>{scaledCalories} kcal</span>
          <span>·</span>
          <span>{meal.readyInMinutes}m</span>
        </div>
        <button
          onClick={onSwap}
          disabled={swapping}
          className="mt-2 w-full rounded-lg border border-stone-200 py-1 text-xs text-stone-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-40 transition-colors"
        >
          {swapping ? '…' : 'Swap'}
        </button>
      </div>
    </div>
  )
}

export default function PlanPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [swapping, setSwapping] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [activeDay, setActiveDay] = useState(0)

  useEffect(() => {
    const savedPrefs = localStorage.getItem('mealplanner_prefs')
    const savedPlan = localStorage.getItem('mealplanner_plan')
    if (!savedPrefs) { router.push('/'); return }
    setPrefs(JSON.parse(savedPrefs))
    if (savedPlan) setPlan(JSON.parse(savedPlan))
    else router.push('/')
  }, [router])

  async function regeneratePlan() {
    if (!prefs) return
    setRegenerating(true)
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      const newPlan = await res.json()
      setPlan(newPlan)
      localStorage.setItem('mealplanner_plan', JSON.stringify(newPlan))
    } finally {
      setRegenerating(false)
    }
  }

  async function swapMeal(dayIndex: number, mealType: typeof MEAL_TYPES[number]) {
    if (!prefs || !plan) return
    const key = `${dayIndex}-${mealType}`
    setSwapping(key)
    const currentId = plan[dayIndex]?.[mealType]?.id ?? 0
    try {
      const res = await fetch('/api/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefs, mealType, excludeId: currentId }),
      })
      if (!res.ok) return
      const newMeal = await res.json()
      const updated = plan.map((day, i) =>
        i === dayIndex ? { ...day, [mealType]: newMeal } : day
      )
      setPlan(updated)
      localStorage.setItem('mealplanner_plan', JSON.stringify(updated))
    } finally {
      setSwapping(null)
    }
  }

  if (!plan || !prefs) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <span className="text-stone-400">Loading…</span>
      </div>
    )
  }

  const totalCalories = MEAL_TYPES.reduce((sum, type) => {
    const meal = plan[activeDay]?.[type]
    return sum + (meal ? Math.round(meal.calories * prefs.householdSize) : 0)
  }, 0)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Your Week</h1>
            <p className="text-xs text-stone-500">
              {prefs.calories.toLocaleString()} kcal target · {prefs.householdSize} {prefs.householdSize === 1 ? 'person' : 'people'}
              {prefs.cuisines.length > 0 && ` · ${prefs.cuisines.join(', ')}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Edit Prefs
            </button>
            <Link
              href="/shopping"
              className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              🛒 Shopping List
            </Link>
            <button
              onClick={regeneratePlan}
              disabled={regenerating}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
            >
              {regenerating ? 'Regenerating…' : 'New Plan'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Day tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {DAYS.map((day, i) => {
            const dayTotal = MEAL_TYPES.reduce((sum, type) => {
              const meal = plan[i]?.[type]
              return sum + (meal ? Math.round(meal.calories * prefs.householdSize) : 0)
            }, 0)
            return (
              <button
                key={day}
                onClick={() => setActiveDay(i)}
                className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-center transition-all ${
                  activeDay === i
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-300'
                }`}
              >
                <div className="text-sm font-semibold">{day}</div>
                <div className={`text-xs mt-0.5 ${activeDay === i ? 'text-emerald-100' : 'text-stone-400'}`}>
                  {dayTotal > 0 ? `${dayTotal} kcal` : '—'}
                </div>
              </button>
            )
          })}
        </div>

        {/* Day calorie summary */}
        <div className="mb-5 rounded-xl bg-white border border-stone-200 px-5 py-3 flex items-center gap-4">
          <div>
            <span className="text-2xl font-bold text-stone-900">{totalCalories.toLocaleString()}</span>
            <span className="text-stone-500 text-sm ml-1">kcal today</span>
          </div>
          <div className="h-6 w-px bg-stone-200" />
          <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (totalCalories / prefs.calories) * 100)}%` }}
            />
          </div>
          <span className="text-sm text-stone-500">
            {Math.round((totalCalories / prefs.calories) * 100)}% of goal
          </span>
        </div>

        {/* Meal grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MEAL_TYPES.map((type) => (
            <div key={type}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
                {type}
              </h3>
              <MealCard
                meal={plan[activeDay]?.[type] ?? null}
                householdSize={prefs.householdSize}
                onSwap={() => swapMeal(activeDay, type)}
                swapping={swapping === `${activeDay}-${type}`}
              />
            </div>
          ))}
        </div>

        {/* Full week overview */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-4">
            Full Week Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-stone-400 font-medium py-2 pr-4 w-20">Meal</th>
                  {DAYS.map((d) => (
                    <th key={d} className="text-left text-stone-400 font-medium py-2 px-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map((type) => (
                  <tr key={type} className="border-t border-stone-100">
                    <td className="capitalize text-stone-500 py-3 pr-4 font-medium">{type}</td>
                    {DAYS.map((_, i) => {
                      const meal = plan[i]?.[type]
                      return (
                        <td key={i} className="py-3 px-2">
                          {meal ? (
                            <Link
                              href={`/recipe/${meal.id}?household=${prefs.householdSize}`}
                              className="text-stone-700 hover:text-emerald-600 line-clamp-2 leading-tight text-xs"
                            >
                              {meal.title}
                            </Link>
                          ) : (
                            <span className="text-stone-300 text-xs">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
