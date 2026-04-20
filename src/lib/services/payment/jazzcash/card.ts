import { getJazzCashConfig } from './config'
import {
  generateJazzCashHash,
  generateTxnRefNo,
  formatJazzCashDateTime,
  pkrToPaisas,
} from './hash'

export interface CardPaymentParams {
  orderId: string
  amountPKR: number
  description: string
  customerMobile?: string
  expiryMinutes?: number
}

export interface CardPaymentPayload {
  actionUrl: string
  txnRefNo: string
  pp_Version: string
  pp_TxnType: string
  pp_Language: string
  pp_MerchantID: string
  pp_Password: string
  pp_TxnRefNo: string
  pp_Amount: string
  pp_TxnCurrency: string
  pp_TxnDateTime: string
  pp_TxnExpiryDateTime: string
  pp_BillReference: string
  pp_Description: string
  pp_ReturnURL: string
  pp_SecureHash: string
  pp_MobileNumber?: string
}

/**
 * Builds the payload for a Card payment via JazzCash (Mode 3: MPGS).
 * Uses the same hosted checkout URL but with pp_TxnType: "MPAY".
 */
export function buildCardPaymentPayload(params: CardPaymentParams): CardPaymentPayload {
  const config = getJazzCashConfig()

  const now = new Date()
  const expiryMinutes = params.expiryMinutes ?? 60
  const expiry = new Date(now.getTime() + expiryMinutes * 60 * 1000)
  const txnRefNo = generateTxnRefNo()

  const payload: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'MPAY',      // Card payment type
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
    pp_ReturnURL: config.returnUrl,
  }

  if (params.customerMobile) {
    payload.pp_MobileNumber = params.customerMobile
  }

  payload.pp_SecureHash = generateJazzCashHash(payload, config.integritySalt)

  return {
    ...payload,
    actionUrl: config.hostedCheckoutUrl,
    txnRefNo,
  } as CardPaymentPayload
}
