import { createHmac, timingSafeEqual } from 'crypto'

/**
 * HMAC-signed, time-limited payment link token.
 *
 * Used to authenticate B2B customers accessing the card payment portal
 * via the link in their quotation conversion email, without requiring
 * a user account session.
 *
 * Token format (base64url): `${orderId}:${expiresAt}:${hmac}`
 * - expiresAt: Unix timestamp (ms), 72 hours from generation
 * - hmac: SHA-256 of `${orderId}:${expiresAt}` using PAYMENT_TOKEN_SECRET
 */

const TOKEN_TTL_MS = 72 * 60 * 60 * 1000 // 72 hours

function getSecret(): string {
  const secret = process.env.PAYMENT_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('PAYMENT_TOKEN_SECRET env var is missing or too short (min 32 chars)')
  }
  return secret
}

function computeHmac(orderId: string, expiresAt: number): string {
  return createHmac('sha256', getSecret())
    .update(`${orderId}:${expiresAt}`)
    .digest('base64url')
}

/**
 * Generates a secure, time-limited token for a given orderId.
 * Embed this in the payment portal link query string: `?token=<result>`
 */
export function generatePaymentToken(orderId: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS
  const hmac = computeHmac(orderId, expiresAt)
  // Encode as base64url so it's safe in URLs without percent-encoding
  return Buffer.from(`${orderId}:${expiresAt}:${hmac}`).toString('base64url')
}

/**
 * Verifies a payment token for a given orderId.
 * Returns { valid: true } or { valid: false, reason: string }
 */
export function verifyPaymentToken(
  orderId: string,
  token: string | null | undefined
): { valid: true } | { valid: false; reason: string } {
  if (!token) {
    return { valid: false, reason: 'Missing token' }
  }

  let decoded: string
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return { valid: false, reason: 'Malformed token' }
  }

  const parts = decoded.split(':')
  // orderId may contain colons if it's a cuid, so we take last two segments as expiresAt and hmac
  if (parts.length < 3) {
    return { valid: false, reason: 'Invalid token structure' }
  }

  const receivedHmac = parts[parts.length - 1]
  const expiresAt = Number(parts[parts.length - 2])
  // orderId is everything before the last two segments
  const tokenOrderId = parts.slice(0, parts.length - 2).join(':')

  if (isNaN(expiresAt)) {
    return { valid: false, reason: 'Invalid token expiry' }
  }

  if (tokenOrderId !== orderId) {
    return { valid: false, reason: 'Token order mismatch' }
  }

  if (Date.now() > expiresAt) {
    return { valid: false, reason: 'Token expired' }
  }

  // Constant-time comparison to prevent timing attacks
  const expectedHmac = computeHmac(orderId, expiresAt)
  try {
    const expected = Buffer.from(expectedHmac)
    const received = Buffer.from(receivedHmac)
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return { valid: false, reason: 'Invalid token signature' }
    }
  } catch {
    return { valid: false, reason: 'Token verification failed' }
  }

  return { valid: true }
}
