import crypto from 'crypto'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365

function getSecret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createUnsubscribeToken(email: string) {
  const secret = getSecret()
  if (!secret) return null

  const payload = Buffer.from(JSON.stringify({
    email: normalizeEmail(email),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString('base64url')
  const signature = signPayload(payload, secret)

  return `${payload}.${signature}`
}

export function verifyUnsubscribeToken(token: string | null | undefined) {
  const secret = getSecret()
  if (!secret || !token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = signPayload(payload, secret)
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== actualBuffer.length) return null
  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof decoded.email !== 'string') return null
    if (typeof decoded.exp !== 'number' || decoded.exp <= Math.floor(Date.now() / 1000)) return null
    return normalizeEmail(decoded.email)
  } catch {
    return null
  }
}

export function createUnsubscribeUrl(email: string, baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calnza.com') {
  const token = createUnsubscribeToken(email)
  const url = new URL('/unsubscribe', baseUrl)
  if (token) {
    url.searchParams.set('token', token)
  }
  return url.toString()
}
