/**
 * Server-side Cloudflare Turnstile token verification.
 * Call this inside any API route that receives a CAPTCHA token.
 *
 * Usage:
 *   const ok = await verifyTurnstile(token, request.headers.get('CF-Connecting-IP') ?? '')
 *   if (!ok) return NextResponse.json({ error: 'CAPTCHA failed' }, { status: 400 })
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    // In dev without key configured, skip verification
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Turnstile] TURNSTILE_SECRET_KEY not set — skipping in dev')
      return true
    }
    console.error('[Turnstile] TURNSTILE_SECRET_KEY is not configured!')
    return false
  }

  if (!token) return false

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    })

    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        // 5s timeout
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) return false

    const data: { success: boolean; 'error-codes'?: string[] } = await res.json()

    if (!data.success) {
      console.warn('[Turnstile] Verification failed:', data['error-codes'])
    }

    return data.success === true
  } catch (err) {
    console.error('[Turnstile] Verification request failed:', err)
    return false
  }
}
