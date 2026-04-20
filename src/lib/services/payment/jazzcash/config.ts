export interface JazzCashConfig {
  merchantId: string
  password: string
  integritySalt: string
  mode: 'sandbox' | 'production'
  hostedCheckoutUrl: string
  restApiUrl: string
  inquiryUrl: string
  returnUrl: string
  ipnUrl: string
}

export function getJazzCashConfig(): JazzCashConfig {
  const mode = (process.env.JAZZCASH_MODE ?? 'sandbox') as 'sandbox' | 'production'

  const merchantId = process.env.JAZZCASH_MERCHANT_ID
  const password = process.env.JAZZCASH_PASSWORD
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT
  const returnUrl = process.env.JAZZCASH_RETURN_URL
  const ipnUrl = process.env.JAZZCASH_IPN_URL

  if (!merchantId || !password || !integritySalt) {
    throw new Error(
      '[JAZZCASH] Missing required environment variables: JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT'
    )
  }

  const baseUrl = mode === 'production'
    ? 'https://production.jazzcash.com.pk'
    : 'https://sandbox.jazzcash.com.pk'

  return {
    merchantId,
    password,
    integritySalt,
    mode,
    hostedCheckoutUrl: `${baseUrl}/CustomerPortal/transactionmanagement/merchantform/`,
    restApiUrl: `${baseUrl}/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction`,
    inquiryUrl: `${baseUrl}/ApplicationAPI/API/PaymentInquiry/Inquire`,
    returnUrl: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/jazzcash/callback`,
    ipnUrl: ipnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/jazzcash/ipn`,
  }
}
