import crypto from 'crypto'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  return process.env.ORDER_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url')
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url')
}

export function createOrderAccessToken(orderId: string) {
  const secret = getSecret()
  if (!secret) return null

  const payload = base64url(JSON.stringify({
    orderId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }))
  const signature = signPayload(payload, secret)

  return `${payload}.${signature}`
}

export function verifyOrderAccessToken(token: string | null | undefined, orderId: string) {
  const secret = getSecret()
  if (!secret || !token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false

  const expected = signPayload(payload, secret)
  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== actualBuffer.length) return false
  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return false

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return decoded.orderId === orderId && typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
