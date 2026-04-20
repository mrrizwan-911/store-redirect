import { getHBLConfig } from './config'
import { getHBLHeaders, getHBLMerchantId } from './auth'
import { MPGSPaymentResponse } from './types'

export interface RefundParams {
  orderId: string
  originalTransactionId: string  // transaction.id from the original PAY/PURCHASE response
  refundAmountPKR: number
  currency?: string
}

/**
 * Initiates a refund for a previously successful HBL PayConnect transaction.
 */
export async function initiateHBLRefund(params: RefundParams): Promise<MPGSPaymentResponse> {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  const refundTransactionId = `REF-${Date.now()}`
  // MPGS endpoint format for refund
  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/order/${params.orderId}/transaction/${refundTransactionId}`

  const body = {
    apiOperation: 'REFUND',
    transaction: {
      amount: params.refundAmountPKR.toFixed(2),
      currency: params.currency ?? 'PKR',
    },
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHBLHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`[HBL REFUND] HTTP ${response.status}: ${errorText}`)
  }

  const result: MPGSPaymentResponse = await response.json()

  return result
}
