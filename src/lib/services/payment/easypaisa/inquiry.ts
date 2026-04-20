import { getEasypaisaHeaders, getEasypaisaStoreId, getEasypaisaBaseUrl } from './auth'
import { logger } from '@/lib/utils/logger'

export interface InquiryResponse {
  orderId: string
  accountNum: string
  storeId: number
  storeName?: string
  paymentToken?: string
  transactionStatus?: 'PAID' | 'FAILED' | 'PENDING' | 'BLOCKED' | 'EXPIRED' | 'REVERSED'
  transactionAmount?: number
  transactionDateTime?: string
  paymentTokenExpiryDateTime?: string
  Msisdn?: string
  paymentMode?: 'MA' | 'OTC' | 'CC'
  responseCode: string
  responseDesc: string
}

/**
 * Queries EasyPaisa for the current status of a transaction.
 * Useful for reconciling OTC and Card payments.
 */
export async function inquireTransaction(orderId: string): Promise<InquiryResponse> {
  const baseUrl = getEasypaisaBaseUrl()
  const url = `${baseUrl}/easypay-service/rest/v4/inquire-transaction`
  const storeId = getEasypaisaStoreId()
  const accountNum = process.env.EASYPAISA_ACCOUNT_NUM

  if (!accountNum) {
    throw new Error('[EASYPAISA INQUIRY] EASYPAISA_ACCOUNT_NUM not set in environment')
  }

  const body = {
    orderId,
    storeId,
    accountNum,
  }

  logger.payment('[EASYPAISA INQUIRY] Checking status', { orderId })

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getEasypaisaHeaders(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`[EASYPAISA INQUIRY] HTTP ${response.status}: ${response.statusText}`)
    }

    const result: InquiryResponse = await response.json()

    logger.payment('[EASYPAISA INQUIRY] Response received', {
      orderId: result.orderId,
      status: result.transactionStatus,
      responseCode: result.responseCode
    })

    return result
  } catch (error) {
    logger.error('[EASYPAISA INQUIRY] API Call failed', { error, orderId })
    throw error
  }
}
