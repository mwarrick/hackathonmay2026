import Link from 'next/link'
import { getCachedRecipe, setCachedRecipes } from '@/lib/db'
import { getRecipeDetails } from '@/lib/spoonacular'
import IngredientChecklist from './IngredientChecklist'

function extractNutrient(
  nutrition: { nutrients?: { name: string; amount: number; unit: string }[] },
  name: string
): { amount: number; unit: string } {
  const match = nutrition?.nutrients?.find((n) => n.name === name)
  return { amount: Math.round(match?.amount ?? 0), unit: match?.unit ?? '' }
}

type RecipeData = {
  title?: string
  image?: string
  readyInMinutes?: number
  servings?: number
  sourceUrl?: string
  summary?: string
  nutrition?: { nutrients?: { name: string; amount: number; unit: string }[] }
  extendedIngredients?: { id: number; original: string; amount: number; unit: string; name: string }[]
  analyzedInstructions?: { steps: { number: number; step: string }[] }[]
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
  const householdSize = Math.max(1, Number(sp?.household ?? 1))
  const numId = Number(id)

  let recipe: RecipeData | null = null
  let fetchError = ''

  try {
    const cached = await getCachedRecipe(numId)
    if (cached) {
      recipe = cached as RecipeData
    } else {
      recipe = await getRecipeDetails(numId)
      await setCachedRecipes([{ id: numId, data: recipe }])
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Could not load recipe'
  }

  if (fetchError || !recipe) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">{fetchError || 'Recipe not found'}</p>
        <Link href="/plan" className="text-emerald-600 hover:underline text-sm">← Back to plan</Link>
      </div>
    )
  }

  const calories = extractNutrient(recipe.nutrition ?? {}, 'Calories')
  const protein = extractNutrient(recipe.nutrition ?? {}, 'Protein')
  const fat = extractNutrient(recipe.nutrition ?? {}, 'Fat')
  const carbs = extractNutrient(recipe.nutrition ?? {}, 'Carbohydrates')
  const baseServings = recipe.servings ?? 1
  const multiplier = householdSize / baseServings
  const hasInstructions = (recipe.analyzedInstructions?.[0]?.steps?.length ?? 0) > 0

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
          <img src={recipe.image} alt={recipe.title} className="w-full h-64 object-cover rounded-2xl mb-6" />
        )}

        <h1 className="text-3xl font-bold text-stone-900 mb-2">{recipe.title}</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          {recipe.readyInMinutes && (
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">⏱ {recipe.readyInMinutes} min</span>
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
              <div className="text-lg font-bold text-stone-900">
                {n.value}<span className="text-xs font-normal text-stone-400 ml-0.5">{n.unit}</span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{n.label}</div>
            </div>
          ))}
        </div>

        {recipe.summary && (
          <p className="text-stone-600 text-sm leading-relaxed mb-8 line-clamp-4">
            {plainText(recipe.summary)}
          </p>
        )}

        {/* Ingredient checklist */}
        {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 && (
          <section className="mb-8">
            <IngredientChecklist
              ingredients={recipe.extendedIngredients}
              multiplier={multiplier}
            />
          </section>
        )}

        {/* Cook CTA */}
        {hasInstructions && (
          <Link
            href={`/recipe/${id}/cook?household=${householdSize}`}
            className="block w-full rounded-2xl bg-emerald-500 py-4 text-center text-lg font-semibold text-white hover:bg-emerald-600 transition-colors mb-6"
          >
            Start Cooking →
          </Link>
        )}

        {recipe.sourceUrl && (
          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-stone-400 hover:text-emerald-600 transition-colors">
            View original recipe →
          </a>
        )}
      </div>
    </div>
  )
}
