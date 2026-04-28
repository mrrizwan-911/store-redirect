import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params

  // Set referral cookie for 30 days
  const response = NextResponse.redirect(new URL('/', req.url))

  response.cookies.set('referral_code', code, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  })

  return response
}
