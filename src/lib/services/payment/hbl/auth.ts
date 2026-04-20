/**
 * HBL (Habib Bank Limited) Authentication Utilities.
 * Powered by Mastercard Payment Gateway Services (MPGS).
 */

export function getHBLAuthHeader(): string {
  const merchantId = process.env.HBL_MERCHANT_ID
  const apiPassword = process.env.HBL_API_PASSWORD

  if (!merchantId || !apiPassword) {
    throw new Error(
      '[HBL] Missing HBL_MERCHANT_ID or HBL_API_PASSWORD environment variables'
    )
  }

  // MPGS requires "merchant." prefix before the ID in Basic Auth
  const credentials = Buffer.from(`merchant.${merchantId}:${apiPassword}`).toString('base64')
  return `Basic ${credentials}`
}

export function getHBLBaseUrl(): string {
  const baseUrl = process.env.HBL_API_BASE_URL
  if (!baseUrl) {
    throw new Error('[HBL] HBL_API_BASE_URL not set')
  }
  return baseUrl
}

export function getHBLMerchantId(): string {
  const id = process.env.HBL_MERCHANT_ID
  if (!id) throw new Error('[HBL] HBL_MERCHANT_ID not set')
  return id
}

export function getHBLHeaders(): Record<string, string> {
  return {
    'Authorization': getHBLAuthHeader(),
    'Content-Type': 'application/json',
  }
}
