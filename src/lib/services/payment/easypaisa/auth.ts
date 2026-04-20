/**
 * EasyPaisa Authentication and Configuration Utilities.
 * Handles credentials, store IDs, and base URLs for different modes.
 */

export function getEasypaisaCredentials(): string {
  const isProduction = process.env.EASYPAISA_MODE === 'production'

  const username = isProduction
    ? process.env.EASYPAISA_PRODUCTION_USERNAME
    : process.env.EASYPAISA_SANDBOX_USERNAME

  const password = isProduction
    ? process.env.EASYPAISA_PRODUCTION_PASSWORD
    : process.env.EASYPAISA_SANDBOX_PASSWORD

  if (!username || !password) {
    throw new Error(`[EASYPAISA] Missing credentials for mode: ${process.env.EASYPAISA_MODE}`)
  }

  return Buffer.from(`${username}:${password}`).toString('base64')
}

export function getEasypaisaStoreId(): number {
  const isProduction = process.env.EASYPAISA_MODE === 'production'
  const storeId = isProduction
    ? process.env.EASYPAISA_PRODUCTION_STOREID
    : process.env.EASYPAISA_SANDBOX_STOREID

  if (!storeId) {
    throw new Error(`[EASYPAISA] Missing storeId for mode: ${process.env.EASYPAISA_MODE}`)
  }

  return parseInt(storeId, 10)
}

export function getEasypaisaHashKey(): string {
  const isProduction = process.env.EASYPAISA_MODE === 'production'
  const hashKey = isProduction
    ? process.env.EASYPAISA_PRODUCTION_HASHKEY
    : process.env.EASYPAISA_SANDBOX_HASHKEY

  if (!hashKey) {
    throw new Error(`[EASYPAISA] Missing hashKey for mode: ${process.env.EASYPAISA_MODE}`)
  }

  return hashKey
}

export function getEasypaisaBaseUrl(): string {
  return process.env.EASYPAISA_MODE === 'production'
    ? 'https://easypay.easypaisa.com.pk'
    : 'https://easypaystg.easypaisa.com.pk'
}

export function getEasypaisaCardUrl(): string {
  return `${getEasypaisaBaseUrl()}/easypay/Index.jsf`
}

/**
 * Request headers for EasyPaisa REST API.
 * Uses custom 'Credentials' header instead of 'Authorization'.
 */
export function getEasypaisaHeaders(): Record<string, string> {
  return {
    'Credentials': getEasypaisaCredentials(),
    'Content-Type': 'application/json',
  }
}
