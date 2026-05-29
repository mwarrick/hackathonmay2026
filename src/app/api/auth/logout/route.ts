export const dynamic = 'force-dynamic'

export async function POST() {
  const response = Response.json({ ok: true })
  response.headers.set(
    'Set-Cookie',
    'mp_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  )
  return response
}
