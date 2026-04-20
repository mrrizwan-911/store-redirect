import { getJazzCashConfig } from './config'
import {
  generateJazzCashHash,
  generateTxnRefNo,
  formatJazzCashDateTime,
} from './hash'
import { logger } from '@/lib/utils/logger'

export interface InquiryParams {
  originalTxnRefNo: string  // pp_TxnRefNo from the original transaction
  orderId: string
}

export interface InquiryResponse {
  pp_ResponseCode: string
  pp_ResponseMessage: string
  pp_TxnRefNo: string
  pp_Amount?: string
  pp_TxnStatus?: string
  pp_RetreivalReferenceNo?: string
  pp_SecureHash?: string
  [key: string]: string | undefined
}

/**
 * Queries JazzCash to check the status of a specific transaction.
 */
export async function inquireJazzCashTransaction(params: InquiryParams): Promise<InquiryResponse> {
  const config = getJazzCashConfig()

  const now = new Date()
  const expiry = new Date(now.getTime() + 30 * 60 * 1000)
  const txnRefNo = generateTxnRefNo()

  const requestParams: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'INQUIRY',
    pp_Language: 'EN',
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_TxnRefNo: txnRefNo,
    pp_TxnDateTime: formatJazzCashDateTime(now),
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_BillReference: params.orderId,
    pp_OriginalTxnRefNo: params.originalTxnRefNo,
    pp_ReturnURL: config.returnUrl,
  }

  requestParams.pp_SecureHash = generateJazzCashHash(requestParams, config.integritySalt)

  logger.payment('[JAZZCASH INQUIRY] Requesting status', {
    orderId: params.orderId,
    originalTxn: params.originalTxnRefNo,
  })

  try {
    const response = await fetch(config.inquiryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestParams),
    })

    if (!response.ok) {
      throw new Error(`[JAZZCASH INQUIRY] HTTP ${response.status}: ${response.statusText}`)
    }

    const result: InquiryResponse = await response.json()

    logger.payment('[JAZZCASH INQUIRY] Response received', {
      orderId: params.orderId,
      responseCode: result.pp_ResponseCode,
      status: result.pp_TxnStatus,
    })

    return result
  } catch (error) {
    logger.error('[JAZZCASH INQUIRY] API Call failed', { error, orderId: params.orderId })
    throw error
  }
}
