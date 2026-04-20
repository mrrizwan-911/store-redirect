import crypto from 'crypto'

interface CardHashParams {
  storeId: string
  amount: string        // e.g. "2500.0" — exactly one decimal place
  orderRefNum: string   // your unique order ID
  postBackURL: string   // your callback URL
  timeStamp: string     // format: yyyyMMdd HHmmss
  hashKey: string       // from merchant portal
}

/**
 * EasyPaisa card payment hash generator.
 * Required for the HTTP POST Redirect method.
 *
 * Concatenation order: storeId + amount + orderRefNum + postBackURL + timeStamp + hashKey
 */
export function generateEasypaisaCardHash(params: CardHashParams): string {
  const { storeId, amount, orderRefNum, postBackURL, timeStamp, hashKey } = params

  const concatenated = `${storeId}${amount}${orderRefNum}${postBackURL}${timeStamp}${hashKey}`

  return crypto
    .createHash('sha256')
    .update(concatenated, 'utf8')
    .digest('hex')
}

/**
 * Format date for EasyPaisa timestamp fields.
 * Output: "yyyyMMdd HHmmss"
 */
export function formatEasypaisaTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const min = pad(date.getMinutes())
  const sec = pad(date.getSeconds())
  return `${year}${month}${day} ${hour}${min}${sec}`
}

/**
 * Format amount — EasyPaisa needs exactly one decimal place.
 * PKR 2500 → "2500.0"
 */
export function formatEasypaisaAmount(amountPKR: number): string {
  return amountPKR.toFixed(1)
}
