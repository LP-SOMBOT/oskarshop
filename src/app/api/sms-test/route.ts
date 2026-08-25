export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({ ok: true, method: 'GET' })
}

export async function POST(request: Request) {
  const text = await request.text().catch(() => '')
  return Response.json({
    ok: true,
    method: 'POST',
    body: text,
    time: Date.now()
  })
}
