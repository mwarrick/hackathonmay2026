export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { password } = await request.json()
  const appPass = process.env.app_pass

  if (!appPass || password !== appPass) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const response = Response.json({ ok: true })
  response.headers.set(
    'Set-Cookie',
    `mp_auth=${appPass}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  )
  return response
}
