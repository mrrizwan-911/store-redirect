import { createHmac, timingSafeEqual } from 'crypto'

/**
 * HMAC-signed, time-limited token for quotation PDF download links.
 *
 * Token format (base64url): `${quotationId}:${expiresAt}:${hmac}`
 * - expiresAt : Unix timestamp (ms), 30 days from generation
 * - hmac      : SHA-256 of `${quotationId}:${expiresAt}` using PAYMENT_TOKEN_SECRET
 *
 * Reuses PAYMENT_TOKEN_SECRET so no extra env var is needed.
 */

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function getSecret(): string {
  const secret = process.env.PAYMENT_TOKEN_SECRET
  if (!secret || secret.length < 16) {
    throw new Error('PAYMENT_TOKEN_SECRET env var is missing or too short')
  }
  return secret
}

function computeHmac(quotationId: string, expiresAt: number): string {
  return createHmac('sha256', getSecret())
    .update(`qpdf:${quotationId}:${expiresAt}`)
    .digest('base64url')
}

/**
 * Generate a secure, time-limited download token for a quotation PDF.
 */
export function generateQuotationPdfToken(quotationId: string): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS
  const hmac = computeHmac(quotationId, expiresAt)
  return Buffer.from(`${quotationId}:${expiresAt}:${hmac}`).toString('base64url')
}

/**
 * Verify a quotation PDF token.
 * Returns { valid: true } or { valid: false, reason: string }
 */
export function verifyQuotationPdfToken(
  quotationId: string,
  token: string | null | undefined
): { valid: true } | { valid: false; reason: string } {
  if (!token) return { valid: false, reason: 'Missing token' }

  let decoded: string
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return { valid: false, reason: 'Malformed token' }
  }

  const parts = decoded.split(':')
  if (parts.length < 3) return { valid: false, reason: 'Invalid token structure' }

  const receivedHmac = parts[parts.length - 1]
  const expiresAt = Number(parts[parts.length - 2])
  const tokenQuotationId = parts.slice(0, parts.length - 2).join(':')

  if (isNaN(expiresAt)) return { valid: false, reason: 'Invalid token expiry' }
  if (tokenQuotationId !== quotationId) return { valid: false, reason: 'Token ID mismatch' }
  if (Date.now() > expiresAt) return { valid: false, reason: 'Token expired' }

  const expectedHmac = computeHmac(quotationId, expiresAt)
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
