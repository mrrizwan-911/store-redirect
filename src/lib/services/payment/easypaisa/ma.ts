import { getEasypaisaHeaders, getEasypaisaStoreId, getEasypaisaBaseUrl } from './auth'
import { logger } from '@/lib/utils/logger'

export interface MATransactionParams {
  orderId: string
  amountPKR: number
  mobileAccountNo: string
  emailAddress?: string
  optional1?: string
  optional2?: string
}

export interface MATransactionResponse {
  orderId: string
  storeId: number
  transactionId?: string
  transactionDateTime?: string
  responseCode: string
  responseDesc: string
  optional1?: string
  optional2?: string
}

/**
 * Initiates an EasyPaisa Mobile Account (MA) transaction.
 * This is a direct REST API call.
 */
export async function initiateMATransaction(
  params: MATransactionParams
): Promise<MATransactionResponse> {
  const baseUrl = getEasypaisaBaseUrl()
  const url = `${baseUrl}/easypay-service/rest/v4/initiate-ma-transaction`
  const storeId = getEasypaisaStoreId()

  // Validate mobile number format: 03xxxxxxxxx (11 digits)
  if (!/^03\d{9}$/.test(params.mobileAccountNo)) {
    throw new Error('[EASYPAISA MA] Invalid mobile format. Must be 03xxxxxxxxx (11 digits)')
  }

  // Validate orderId — max 20 alphanumeric as per EasyPaisa spec
  const sanitizedOrderId = params.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)

  const body = {
    orderId: sanitizedOrderId,
    storeId,
    transactionAmount: params.amountPKR.toFixed(1),
    transactionType: 'MA',
    mobileAccountNo: params.mobileAccountNo,
    ...(params.emailAddress && { emailAddress: params.emailAddress }),
    ...(params.optional1 && { optional1: params.optional1 }),
    ...(params.optional2 && { optional2: params.optional2 }),
  }

  logger.payment('[EASYPAISA MA] Requesting transaction', {
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
      throw new Error(`[EASYPAISA MA] HTTP ${response.status}: ${response.statusText}`)
    }

    const result: MATransactionResponse = await response.json()

    logger.payment('[EASYPAISA MA] Response received', {
      orderId: result.orderId,
      responseCode: result.responseCode,
      transactionId: result.transactionId,
    })

    return result
  } catch (error) {
    logger.error('[EASYPAISA MA] API Call failed', { error, orderId: sanitizedOrderId })
    throw error
  }
}
