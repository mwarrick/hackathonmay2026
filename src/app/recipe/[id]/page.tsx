import Link from 'next/link'
import { getRecipeDetails } from '@/lib/spoonacular'

function extractNutrient(
  nutrition: { nutrients?: { name: string; amount: number; unit: string }[] },
  name: string
): { amount: number; unit: string } {
  const match = nutrition?.nutrients?.find((n) => n.name === name)
  return { amount: Math.round(match?.amount ?? 0), unit: match?.unit ?? '' }
}

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ household?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const householdSize = Number(sp?.household ?? 1)

  let recipe: {
    title?: string
    image?: string
    readyInMinutes?: number
    servings?: number
    sourceUrl?: string
    summary?: string
    nutrition?: { nutrients?: { name: string; amount: number; unit: string }[] }
    extendedIngredients?: { id: number; original: string; amount: number; unit: string; name: string }[]
    analyzedInstructions?: { steps: { number: number; step: string }[] }[]
  } | null = null

  let fetchError = ''

  try {
    recipe = await getRecipeDetails(Number(id))
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Could not load recipe'
  }

  if (fetchError || !recipe) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">{fetchError || 'Recipe not found'}</p>
        <Link href="/plan" className="text-emerald-600 hover:underline text-sm">
          ← Back to plan
        </Link>
      </div>
    )
  }

  const calories = extractNutrient(recipe.nutrition ?? {}, 'Calories')
  const protein = extractNutrient(recipe.nutrition ?? {}, 'Protein')
  const fat = extractNutrient(recipe.nutrition ?? {}, 'Fat')
  const carbs = extractNutrient(recipe.nutrition ?? {}, 'Carbohydrates')
  const baseServings = recipe.servings ?? 1
  const multiplier = householdSize > 0 ? householdSize / baseServings : 1
  const steps = recipe.analyzedInstructions?.[0]?.steps ?? []

  function plainText(html: string) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/plan" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-emerald-600 mb-6 transition-colors">
          ← Back to plan
        </Link>

        {recipe.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />
        )}

        <h1 className="text-3xl font-bold text-stone-900 mb-2">{recipe.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 mb-6">
          {recipe.readyInMinutes && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
              ⏱ {recipe.readyInMinutes} min
            </span>
          )}
          <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
            🍽 {householdSize > 1 ? `${householdSize} servings` : `${baseServings} serving${baseServings !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Nutrition */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Calories', value: calories.amount, unit: 'kcal' },
            { label: 'Protein', value: protein.amount, unit: protein.unit },
            { label: 'Fat', value: fat.amount, unit: fat.unit },
            { label: 'Carbs', value: carbs.amount, unit: carbs.unit },
          ].map((n) => (
            <div key={n.label} className="rounded-xl bg-white border border-stone-200 p-3 text-center">
              <div className="text-lg font-bold text-stone-900">{n.value}<span className="text-xs font-normal text-stone-400 ml-0.5">{n.unit}</span></div>
              <div className="text-xs text-stone-500 mt-0.5">{n.label}</div>
              {householdSize > 1 && n.label === 'Calories' && (
                <div className="text-xs text-emerald-600 mt-0.5">×{householdSize}</div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {recipe.summary && (
          <div className="mb-8">
            <p className="text-stone-600 text-sm leading-relaxed line-clamp-4">
              {plainText(recipe.summary)}
            </p>
          </div>
        )}

        {/* Ingredients */}
        {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 mb-3">
              Ingredients
              {householdSize > 1 && (
                <span className="text-sm font-normal text-stone-400 ml-2">scaled for {householdSize}</span>
              )}
            </h2>
            <ul className="space-y-2">
              {recipe.extendedIngredients.map((ing) => {
                const scaledAmount = multiplier !== 1
                  ? (ing.amount * multiplier).toFixed(1).replace(/\.0$/, '')
                  : ing.amount
                return (
                  <li key={ing.id} className="flex items-start gap-3 text-sm text-stone-700">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                    <span>
                      <strong>{scaledAmount} {ing.unit}</strong> {ing.name}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Instructions */}
        {steps.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 mb-3">Instructions</h2>
            <ol className="space-y-4">
              {steps.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                    {step.number}
                  </span>
                  <p className="text-sm text-stone-700 leading-relaxed pt-0.5">{step.step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
          >
            View original recipe →
          </a>
        )}
      </div>
    </div>
  )
}
