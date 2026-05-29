'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Incorrect password')
        return
      }

      const from = searchParams.get('from') ?? '/'
      router.push(from)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        Password
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        required
        className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
        placeholder="Enter password"
      />

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Checking…' : 'Enter'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Meal Planner</h1>
          <p className="text-stone-500 mt-2 text-sm">Enter the password to continue</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
