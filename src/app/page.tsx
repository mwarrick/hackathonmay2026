'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Preferences } from '@/types'

const CUISINES = [
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'italian', label: 'Italian', emoji: '🍝' },
  { value: 'mexican', label: 'Mexican', emoji: '🌮' },
  { value: 'asian', label: 'Asian', emoji: '🍜' },
  { value: 'american', label: 'American', emoji: '🍔' },
  { value: 'indian', label: 'Indian', emoji: '🍛' },
  { value: 'french', label: 'French', emoji: '🥐' },
  { value: 'japanese', label: 'Japanese', emoji: '🍱' },
  { value: 'middle eastern', label: 'Middle Eastern', emoji: '🧆' },
  { value: 'thai', label: 'Thai', emoji: '🍲' },
  { value: 'greek', label: 'Greek', emoji: '🥙' },
  { value: 'spanish', label: 'Spanish', emoji: '🥘' },
]

const CALORIE_PRESETS = [
  { label: 'Weight Loss', value: 1500, sub: '~1,500 kcal' },
  { label: 'Maintenance', value: 2000, sub: '~2,000 kcal' },
  { label: 'Active', value: 2500, sub: '~2,500 kcal' },
  { label: 'Muscle Gain', value: 3000, sub: '~3,000 kcal' },
]

const PREP_OPTIONS = [
  { value: 'quick', label: 'Quick', sub: '15 min or less', emoji: '⚡' },
  { value: 'standard', label: 'Standard', sub: '15–45 min', emoji: '🍳' },
  { value: 'extended', label: 'Extended', sub: '45 min+', emoji: '👨‍🍳' },
] as const

const DIETS = [
  { value: 'none', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'ketogenic', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten free', label: 'Gluten Free' },
]

const INTOLERANCES = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'egg', label: 'Egg' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'peanut', label: 'Peanut' },
  { value: 'tree nut', label: 'Tree Nut' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'soy', label: 'Soy' },
  { value: 'wheat', label: 'Wheat' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [cuisines, setCuisines] = useState<string[]>([])
  const [calories, setCalories] = useState(2000)
  const [customCalories, setCustomCalories] = useState('')
  const [prepTime, setPrepTime] = useState<Preferences['prepTime']>('standard')
  const [diet, setDiet] = useState('none')
  const [intolerances, setIntolerances] = useState<string[]>([])
  const [householdSize, setHouseholdSize] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleCuisine(value: string) {
    setCuisines((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    )
  }

  function toggleIntolerance(value: string) {
    setIntolerances((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    )
  }

  async function handleGenerate() {
    setError('')
    const finalCalories = customCalories ? parseInt(customCalories, 10) : calories
    if (!finalCalories || finalCalories < 800 || finalCalories > 5000) {
      setError('Please enter a calorie target between 800 and 5,000.')
      return
    }

    const prefs: Preferences = {
      cuisines,
      calories: finalCalories,
      prepTime,
      diet,
      intolerances,
      householdSize,
    }

    localStorage.setItem('mealplanner_prefs', JSON.stringify(prefs))

    setLoading(true)
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate plan')
      }

      const plan = await res.json()
      localStorage.setItem('mealplanner_plan', JSON.stringify(plan))
      router.push('/plan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight">
            Build Your Meal Plan
          </h1>
          <p className="mt-2 text-stone-500 text-lg">
            Tell us your preferences and we&apos;ll generate a personalized 7-day plan.
          </p>
        </div>

        {/* Cuisine */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">Cuisine Styles</h2>
          <p className="text-sm text-stone-500 mb-3">Pick any that appeal to you (optional)</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {CUISINES.map((c) => (
              <button
                key={c.value}
                onClick={() => toggleCuisine(c.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 text-sm font-medium transition-all ${
                  cuisines.includes(c.value)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <span className="text-2xl">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Calories */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">Daily Calorie Target</h2>
          <p className="text-sm text-stone-500 mb-3">Choose a preset or enter a custom amount</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-3">
            {CALORIE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setCalories(p.value); setCustomCalories('') }}
                className={`rounded-xl border-2 py-3 px-3 text-sm font-medium transition-all text-left ${
                  calories === p.value && !customCalories
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className="font-semibold">{p.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Custom: e.g. 1800"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              className="w-48 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-sm text-stone-500">kcal / day</span>
          </div>
        </section>

        {/* Prep Time */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">Prep Time</h2>
          <p className="text-sm text-stone-500 mb-3">How much time can you spend cooking?</p>
          <div className="grid grid-cols-3 gap-3">
            {PREP_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPrepTime(p.value)}
                className={`rounded-xl border-2 py-4 px-3 text-center transition-all ${
                  prepTime === p.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className="text-2xl mb-1">{p.emoji}</div>
                <div className="font-semibold text-sm">{p.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Diet */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">Dietary Style</h2>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDiet(d.value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  diet === d.value
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-stone-300 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Intolerances */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">Allergies & Intolerances</h2>
          <p className="text-sm text-stone-500 mb-3">We&apos;ll exclude recipes containing these</p>
          <div className="flex flex-wrap gap-2">
            {INTOLERANCES.map((i) => (
              <button
                key={i.value}
                onClick={() => toggleIntolerance(i.value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  intolerances.includes(i.value)
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-stone-300 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </section>

        {/* Household Size */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-stone-800 mb-1">Household Size</h2>
          <p className="text-sm text-stone-500 mb-3">How many people are you cooking for?</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setHouseholdSize((n) => Math.max(1, n - 1))}
              className="w-10 h-10 rounded-full border-2 border-stone-300 text-stone-600 text-lg font-bold hover:border-stone-400 transition-colors flex items-center justify-center"
            >
              −
            </button>
            <span className="text-3xl font-bold text-stone-900 w-8 text-center">{householdSize}</span>
            <button
              onClick={() => setHouseholdSize((n) => Math.min(12, n + 1))}
              className="w-10 h-10 rounded-full border-2 border-stone-300 text-stone-600 text-lg font-bold hover:border-stone-400 transition-colors flex items-center justify-center"
            >
              +
            </button>
            <span className="text-stone-500 text-sm">{householdSize === 1 ? 'person' : 'people'}</span>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? 'Generating your plan…' : 'Generate My Meal Plan →'}
        </button>

        <p className="mt-4 text-center text-xs text-stone-400">
          Recipe data powered by Spoonacular
        </p>
      </div>
    </div>
  )
}
