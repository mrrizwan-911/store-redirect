import { getHBLConfig } from './config'
import { getHBLHeaders, getHBLMerchantId } from './auth'

/**
 * Retrieves the current status of an order from HBL/MPGS.
 */
export async function inquireHBLOrder(orderId: string) {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/order/${orderId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getHBLHeaders(),
  })

  if (!response.ok) {
    throw new Error(`[HBL] Order inquiry HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Retrieves the details of a specific transaction from HBL/MPGS.
 */
export async function inquireHBLTransaction(orderId: string, transactionId: string) {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/order/${orderId}/transaction/${transactionId}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getHBLHeaders(),
  })

  if (!response.ok) {
    throw new Error(`[HBL] Transaction inquiry HTTP ${response.status}`)
  }

  return response.json()
}
