export interface Preferences {
  cuisines: string[]
  calories: number
  prepTime: 'quick' | 'standard' | 'extended'
  diet: string
  intolerances: string[]
  householdSize: number
}

export interface Meal {
  id: number
  title: string
  image: string
  readyInMinutes: number
  servings: number
  calories: number
  protein: number
  fat: number
  carbs: number
  sourceUrl: string
}

export interface DayPlan {
  breakfast: Meal | null
  lunch: Meal | null
  dinner: Meal | null
}

export type WeekPlan = DayPlan[]
