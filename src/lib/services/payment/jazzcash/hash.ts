import crypto from 'crypto'

/**
 * Generates HMAC-SHA256 hash for JazzCash.
 *
 * Rules (per JazzCash Integration Guide Section 4):
 * 1. Collect all parameters with names beginning with "pp_"
 * 2. Sort them in ascending alphabetical order by the ASCII value of the key name
 * 3. Extract just the values (not keys)
 * 4. Concatenate all values with "&" separator
 * 5. Prepend the Integrity Salt + "&" at the beginning
 * 6. Convert the concatenated string from UTF-8 to ISO-8859-1 encoding
 * 7. Apply HMAC-SHA256 using the UTF-8 encoded Integrity Salt as the key
 * 8. Convert the result to hexadecimal, UPPERCASED
 */
export function generateJazzCashHash(
  params: Record<string, string>,
  salt: string
): string {
  // Step 1: Filter only pp_ fields
  const ppFields = Object.entries(params)
    .filter(([key]) => key.startsWith('pp_'))
    // Step 2: Sort by key name (ASCII / lexicographic)
    .sort(([a], [b]) => a.localeCompare(b, 'en', { sensitivity: 'variant' }))
    // Step 3: Extract values only
    .map(([, value]) => value)

  // Step 4 & 5: Prepend salt and concatenate
  const concatenated = `${salt}&${ppFields.join('&')}`

  // Step 6: UTF-8 → ISO-8859-1 (Latin1) encoding
  // Node.js: convert to Buffer using utf8, then reinterpret as latin1 string for HMAC input
  const inputBuffer = Buffer.from(concatenated, 'utf8')
  const latin1String = inputBuffer.toString('latin1')

  // Step 7: HMAC-SHA256 using UTF-8 salt as key
  const saltBuffer = Buffer.from(salt, 'utf8')
  const hash = crypto
    .createHmac('sha256', saltBuffer)
    .update(latin1String, 'latin1')
    .digest('hex')
    .toUpperCase()

  return hash
}

/**
 * Verify a hash received in JazzCash callback/IPN.
 * Removes pp_SecureHash from params, recomputes, and compares using timingSafeEqual.
 */
export function verifyJazzCashHash(
  params: Record<string, string>,
  salt: string
): boolean {
  const receivedHash = params.pp_SecureHash
  if (!receivedHash) return false

  // Remove pp_SecureHash from params before computing
  const { pp_SecureHash: _, ...rest } = params
  const computedHash = generateJazzCashHash(rest, salt)

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(computedHash, 'hex')
    )
  } catch (error) {
    // Handle cases where hashes might not be same length or valid hex
    return false
  }
}

/**
 * Format Date to JazzCash datetime format: yyyyMMddHHmmss
 */
export function formatJazzCashDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
}

/**
 * Generate unique transaction reference number.
 * Convention: "T" + yyyyMMddHHmmss + random 4 digits
 * Must be unique per transaction.
 */
export function generateTxnRefNo(): string {
  const timestamp = formatJazzCashDateTime()
  const random = String(Math.floor(1000 + Math.random() * 9000))
  return `T${timestamp}${random}`
}

/**
 * Convert PKR to paisas (JazzCash amount format).
 * PKR 2,500 → "250000" (integer string, no decimals)
 */
export function pkrToPaisas(amountPKR: number): string {
  return String(Math.round(amountPKR * 100))
}
