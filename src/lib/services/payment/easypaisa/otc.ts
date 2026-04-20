import { getEasypaisaHeaders, getEasypaisaStoreId, getEasypaisaBaseUrl } from './auth'
import { logger } from '@/lib/utils/logger'

export interface OTCTransactionParams {
  orderId: string
  amountPKR: number
  mobileAccountNo: string
  emailAddress?: string
  // Hours until token expires — default 48h
  tokenExpiryHours?: number
}

export interface OTCTransactionResponse {
  orderId: string
  storeId: number
  paymentToken?: string
  transactionDateTime?: string
  paymentTokenExpiryDateTime?: string
  responseCode: string
  responseDesc: string
}

function formatOTCExpiry(date: Date): string {
  // Format: yyyymmdd HHmmss (EasyPaisa requirement)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())} ${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/**
 * Initiates an EasyPaisa Over-the-Counter (OTC) transaction.
 * Generates a payment token that the customer shows at an agent.
 */
export async function initiateOTCTransaction(
  params: OTCTransactionParams
): Promise<OTCTransactionResponse> {
  const baseUrl = getEasypaisaBaseUrl()
  const url = `${baseUrl}/easypay-service/rest/v4/initiate-otc-transaction`
  const storeId = getEasypaisaStoreId()

  const expiryHours = params.tokenExpiryHours ?? 48
  const tokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

  const sanitizedOrderId = params.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)

  const body = {
    orderId: sanitizedOrderId,
    storeId,
    transactionAmount: params.amountPKR.toFixed(1),
    transactionType: 'OTC',
    mobileAccountNo: params.mobileAccountNo,
    tokenExpiry: formatOTCExpiry(tokenExpiry),
    ...(params.emailAddress && { emailAddress: params.emailAddress }),
  }

  logger.payment('[EASYPAISA OTC] Requesting token', {
    orderId: sanitizedOrderId,
    amount: params.amountPKR
  })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getEasypaisaHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`[EASYPAISA OTC] HTTP ${response.status}: ${response.statusText}`)
    }

    const result: OTCTransactionResponse = await response.json()

    logger.payment('[EASYPAISA OTC] Response received', {
      orderId: result.orderId,
      responseCode: result.responseCode,
      token: result.paymentToken ? 'GENERATED' : 'MISSING',
    })

    return result
  } catch (error) {
    logger.error('[EASYPAISA OTC] API Call failed', { error, orderId: sanitizedOrderId })
    throw error
  }
}
