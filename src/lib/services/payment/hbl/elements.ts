import { getHBLConfig } from './config'
import { getHBLHeaders, getHBLMerchantId } from './auth'
import { MPGSPaymentResponse } from './types'

export interface AuthorizeParams {
  orderId: string
  amountPKR: number
  sessionId: string   // from HBL Elements after card data collected
  currency?: string
}

/**
 * Authorizes an HBL PayConnect payment using a sessionId.
 * Used for the "Elements" (iFrame) integration method.
 */
export async function authorizeHBLElementsPayment(
  params: AuthorizeParams
): Promise<MPGSPaymentResponse> {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  const transactionId = `TXN-${Date.now()}`
  // MPGS endpoint format for payment authorization
  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/order/${params.orderId}/transaction/${transactionId}`

  const body = {
    apiOperation: 'PAY', // We use single-step "PAY" for simplicity as per requirements
    session: {
      id: params.sessionId,
    },
    order: {
      amount: params.amountPKR.toFixed(2),
      currency: params.currency ?? 'PKR',
    },
    transaction: {
      reference: transactionId,
    },
    // 3DS is handled automatically by MPGS during this call
    authentication: {
      transactionId,
    },
  }

  const response = await fetch(url, {
    method: 'PUT', // MPGS uses PUT for transaction authorization
    headers: getHBLHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`[HBL ELEMENTS] Authorization HTTP ${response.status}: ${errorText}`)
  }

  const result: MPGSPaymentResponse = await response.json()

  return result
}
