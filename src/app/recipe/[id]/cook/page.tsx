'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { use } from 'react'

type Step = { number: number; step: string }

export default function CookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ household?: string }>
}) {
  const { id } = use(params)
  const sp = use(searchParams)
  const householdSize = Number(sp?.household ?? 1)

  const [steps, setSteps] = useState<Step[]>([])
  const [title, setTitle] = useState('')
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/recipe/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? '')
        setSteps(data.analyzedInstructions?.[0]?.steps ?? [])
      })
      .catch(() => setError('Could not load recipe'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <span className="text-stone-400">Loading…</span>
      </div>
    )
  }

  if (error || steps.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">{error || 'No instructions found'}</p>
        <Link href={`/recipe/${id}?household=${householdSize}`} className="text-emerald-600 hover:underline text-sm">
          ← Back to recipe
        </Link>
      </div>
    )
  }

  const step = steps[current]
  const isFirst = current === 0
  const isLast = current === steps.length - 1

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href={`/recipe/${id}?household=${householdSize}`} className="text-sm text-stone-500 hover:text-emerald-600 transition-colors">
            ← Back
          </Link>
          <span className="text-sm font-medium text-stone-400">
            Step {current + 1} of {steps.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-stone-100 h-1.5">
        <div
          className="h-full bg-emerald-400 transition-all duration-300"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-8">
        <h1 className="text-lg font-semibold text-stone-800 mb-8 line-clamp-2">{title}</h1>

        {/* Step card */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 rounded-2xl bg-white border border-stone-200 p-8 flex flex-col justify-center shadow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-xl font-bold text-emerald-600">{step.number}</span>
            </div>
            <p className="text-lg text-stone-800 leading-relaxed">{step.step}</p>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={isFirst}
              className="flex-1 rounded-2xl border-2 border-stone-200 py-4 text-stone-600 font-semibold disabled:opacity-30 hover:border-stone-300 transition-colors"
            >
              ← Previous
            </button>

            {isLast ? (
              <Link
                href={`/recipe/${id}?household=${householdSize}`}
                className="flex-1 rounded-2xl bg-emerald-500 py-4 text-center text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                Done!
              </Link>
            ) : (
              <button
                onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
                className="flex-1 rounded-2xl bg-emerald-500 py-4 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                Next →
              </button>
            )}
          </div>

          {/* Step dots */}
          <div className="mt-4 flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-6 bg-emerald-500' : 'w-2 bg-stone-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
