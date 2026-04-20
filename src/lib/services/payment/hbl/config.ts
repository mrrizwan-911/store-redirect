/**
 * HBL Configuration Loader.
 * Reads environment variables and provides a validated config object.
 */

export interface HBLConfig {
  merchantId: string
  apiPassword: string
  apiBaseUrl: string
  checkoutJsUrl: string
  merchantName: string
  returnUrl: string
  notificationUrl: string
  webhookSecret: string
  mode: 'test' | 'live'
  apiVersion: string
}

export function getHBLConfig(): HBLConfig {
  const merchantId = process.env.HBL_MERCHANT_ID
  const apiPassword = process.env.HBL_API_PASSWORD
  const apiBaseUrl = process.env.HBL_API_BASE_URL
  const checkoutJsUrl = process.env.HBL_CHECKOUT_JS_URL
  const merchantName = process.env.HBL_MERCHANT_NAME || 'E-Commerce Store'
  const returnUrl = process.env.HBL_RETURN_URL
  const notificationUrl = process.env.HBL_NOTIFICATION_URL
  const webhookSecret = process.env.HBL_WEBHOOK_SECRET
  const mode = (process.env.HBL_MODE ?? 'test') as 'test' | 'live'

  const missing = [
    !merchantId && 'HBL_MERCHANT_ID',
    !apiPassword && 'HBL_API_PASSWORD',
    !apiBaseUrl && 'HBL_API_BASE_URL',
    !returnUrl && 'HBL_RETURN_URL',
    !webhookSecret && 'HBL_WEBHOOK_SECRET',
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`[HBL] Missing required environment variables: ${missing.join(', ')}`)
  }

  return {
    merchantId: merchantId!,
    apiPassword: apiPassword!,
    apiBaseUrl: apiBaseUrl!,
    checkoutJsUrl: checkoutJsUrl || 'https://hblpay.hbl.com/checkout/version/56/checkout.js',
    merchantName,
    returnUrl: returnUrl!,
    notificationUrl: notificationUrl || '',
    webhookSecret: webhookSecret!,
    mode,
    apiVersion: '56', // Default MPGS API version for HBL
  }
}
