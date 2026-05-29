'use client'

import { useState } from 'react'

interface Ingredient {
  id: number
  name: string
  original: string
  amount: number
  unit: string
}

export default function IngredientChecklist({
  ingredients,
  multiplier,
}: {
  ingredients: Ingredient[]
  multiplier: number
}) {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const done = checked.size
  const total = ingredients.length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-stone-800">
          Ingredients
          {multiplier !== 1 && (
            <span className="text-sm font-normal text-stone-400 ml-2">
              scaled ×{multiplier.toFixed(1).replace(/\.0$/, '')}
            </span>
          )}
        </h2>
        {done > 0 && (
          <span className="text-xs text-stone-400">{done}/{total} checked</span>
        )}
      </div>

      <ul className="space-y-2">
        {ingredients.map((ing) => {
          const scaledAmount = multiplier !== 1
            ? (ing.amount * multiplier).toFixed(1).replace(/\.0$/, '')
            : ing.amount
          const isChecked = checked.has(ing.id)

          return (
            <li key={ing.id}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(ing.id)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer flex-shrink-0"
                />
                <span className={`text-sm leading-relaxed transition-colors ${
                  isChecked ? 'line-through text-stone-400' : 'text-stone-700'
                }`}>
                  <strong className={isChecked ? 'text-stone-400' : 'text-stone-900'}>
                    {scaledAmount} {ing.unit}
                  </strong>{' '}
                  {ing.name}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {done === total && total > 0 && (
        <p className="mt-4 text-sm text-emerald-600 font-medium">
          All ingredients ready!
        </p>
      )}
    </div>
  )
}
