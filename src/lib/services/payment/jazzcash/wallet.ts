import { getJazzCashConfig } from './config'
import {
  generateJazzCashHash,
  verifyJazzCashHash,
  generateTxnRefNo,
  formatJazzCashDateTime,
  pkrToPaisas,
} from './hash'
import { logger } from '@/lib/utils/logger'

export interface WalletTransactionParams {
  orderId: string
  amountPKR: number
  description: string
  customerMobile: string    // 03xxxxxxxxx
  customerCNIC: string      // last 6 digits of CNIC
  expiryMinutes?: number    // default: 5
  ppmpf1?: string
  ppmpf2?: string
}

export interface WalletTransactionResponse {
  pp_ResponseCode: string
  pp_ResponseMessage: string
  pp_TxnRefNo: string
  pp_Amount: string
  pp_TxnDateTime?: string
  pp_RetreivalReferenceNo?: string
  pp_AuthCode?: string
  pp_SecureHash: string
  pp_MobileNumber?: string
  pp_CNIC?: string
  [key: string]: string | undefined
}

/**
 * Initiates a direct JazzCash Mobile Wallet transaction (v2.0 REST API).
 * This is a synchronous call that debits the customer's wallet directly.
 */
export async function initiateMWalletTransaction(
  params: WalletTransactionParams
): Promise<WalletTransactionResponse> {
  const config = getJazzCashConfig()

  // Validate mobile format: 03xxxxxxxxx
  if (!/^03\d{9}$/.test(params.customerMobile)) {
    throw new Error('[JAZZCASH WALLET] Invalid mobile format. Must be 03xxxxxxxxx')
  }

  // Validate CNIC last 6 digits: exactly 6 digits
  if (!/^\d{6}$/.test(params.customerCNIC)) {
    throw new Error('[JAZZCASH WALLET] CNIC must be exactly 6 digits (last 6 of CNIC)')
  }

  const now = new Date()
  const expiryMinutes = params.expiryMinutes ?? 5
  const expiry = new Date(now.getTime() + expiryMinutes * 60 * 1000)
  const txnRefNo = generateTxnRefNo()

  const requestParams: Record<string, string> = {
    pp_Version: '2.0',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: pkrToPaisas(params.amountPKR),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatJazzCashDateTime(now),
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_BillReference: params.orderId,
    pp_Description: params.description.slice(0, 60),
    pp_MobileNumber: params.customerMobile,
    pp_CNIC: params.customerCNIC,
    pp_ReturnURL: config.returnUrl,
  }

  if (params.ppmpf1) requestParams.ppmpf_1 = params.ppmpf1
  if (params.ppmpf2) requestParams.ppmpf_2 = params.ppmpf2

  // Generate hash — must be last
  requestParams.pp_SecureHash = generateJazzCashHash(requestParams, config.integritySalt)

  logger.payment('[JAZZCASH WALLET] Requesting transaction', {
    orderId: params.orderId,
    txnRefNo: requestParams.pp_TxnRefNo,
    amount: params.amountPKR,
  })

  try {
    const response = await fetch(config.restApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestParams),
    })

    if (!response.ok) {
      throw new Error(`[JAZZCASH WALLET] HTTP ${response.status}: ${response.statusText}`)
    }

    const result: WalletTransactionResponse = await response.json()

    // Verify response hash for integrity
    const isValid = verifyJazzCashHash(result as Record<string, string>, config.integritySalt)
    if (!isValid) {
      logger.error('[JAZZCASH WALLET] Response hash mismatch!', { result })
      throw new Error('[JAZZCASH WALLET] Response integrity check failed')
    }

    logger.payment('[JAZZCASH WALLET] Response received', {
      orderId: params.orderId,
      responseCode: result.pp_ResponseCode,
      responseMessage: result.pp_ResponseMessage,
      txnRef: result.pp_TxnRefNo,
    })

    return result
  } catch (error) {
    logger.error('[JAZZCASH WALLET] API Call failed', { error, orderId: params.orderId })
    throw error
  }
}
