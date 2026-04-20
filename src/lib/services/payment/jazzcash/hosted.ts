import { getJazzCashConfig } from './config'
import {
  generateJazzCashHash,
  generateTxnRefNo,
  formatJazzCashDateTime,
  pkrToPaisas,
} from './hash'

export interface HostedCheckoutParams {
  orderId: string
  amountPKR: number
  description: string
  customerMobile?: string
  ppmpf1?: string
  ppmpf2?: string
  ppmpf3?: string
  expiryMinutes?: number
}

export interface HostedCheckoutPayload {
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
  pp_MobileNumber?: string
  pp_SecureHash: string
  ppmpf_1?: string
  ppmpf_2?: string
  ppmpf_3?: string
  actionUrl: string
  txnRefNo: string
}

export function buildHostedCheckoutPayload(params: HostedCheckoutParams): HostedCheckoutPayload {
  const config = getJazzCashConfig()

  const now = new Date()
  const expiryMinutes = params.expiryMinutes ?? 60
  const expiry = new Date(now.getTime() + expiryMinutes * 60 * 1000)

  const txnRefNo = generateTxnRefNo()
  const txnDateTime = formatJazzCashDateTime(now)
  const txnExpiryDateTime = formatJazzCashDateTime(expiry)

  // Validate description length (max 60)
  const description = params.description.slice(0, 60)

  const payload: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: pkrToPaisas(params.amountPKR),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: txnDateTime,
    pp_TxnExpiryDateTime: txnExpiryDateTime,
    pp_BillReference: params.orderId,
    pp_Description: description,
    pp_ReturnURL: config.returnUrl,
  }

  if (params.customerMobile) {
    payload.pp_MobileNumber = params.customerMobile
  }
  if (params.ppmpf1) payload.ppmpf_1 = params.ppmpf1
  if (params.ppmpf2) payload.ppmpf_2 = params.ppmpf2
  if (params.ppmpf3) payload.ppmpf_3 = params.ppmpf3

  payload.pp_SecureHash = generateJazzCashHash(payload, config.integritySalt)

  return {
    ...payload,
    actionUrl: config.hostedCheckoutUrl,
    txnRefNo,
  } as HostedCheckoutPayload
}
