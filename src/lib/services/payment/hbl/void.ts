import { getHBLConfig } from './config'
import { getHBLHeaders, getHBLMerchantId } from './auth'

/**
 * Voids a previously authorized (but not yet captured) HBL transaction.
 * Since we use single-step "PAY" (PURCHASE), void is typically used for
 * reversing a transaction before settlement.
 */
export async function voidHBLTransaction(orderId: string, transactionId: string) {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  const voidTransactionId = `VOID-${Date.now()}`
  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/order/${orderId}/transaction/${voidTransactionId}`

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHBLHeaders(),
    body: JSON.stringify({
      apiOperation: 'VOID',
      transaction: {
        targetTransactionId: transactionId,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`[HBL VOID] HTTP ${response.status}: ${errorText}`)
  }

  return response.json()
}
