import { getHBLConfig } from './config'
import { getHBLHeaders, getHBLMerchantId } from './auth'
import { MPGSSessionResponse, MPGSPaymentResponse } from './types'

export interface CreateSessionParams {
  orderId: string
  amountPKR: number
  currency?: string
  description?: string
  customerEmail?: string
  customerName?: string
}

export interface CheckoutSession {
  sessionId: string
  checkoutUrl: string
  orderId: string
}

/**
 * Creates a hosted checkout session with HBL/MPGS.
 * Returns a sessionId and a checkoutUrl for the frontend.
 */
export async function createHBLCheckoutSession(
  params: CreateSessionParams
): Promise<CheckoutSession> {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  // Format amount to exactly 2 decimal places
  const amount = params.amountPKR.toFixed(2)
  const currency = params.currency ?? 'PKR'
  const description = (params.description ?? `Order ${params.orderId}`).slice(0, 127)

  // MPGS endpoint format for session creation
  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/session`

  const body: Record<string, unknown> = {
    apiOperation: 'CREATE_CHECKOUT_SESSION',
    order: {
      id: params.orderId,
      amount,
      currency,
      description,
    },
    interaction: {
      operation: 'PURCHASE',
      returnUrl: config.returnUrl,
      merchant: {
        name: config.merchantName,
      },
      displayControl: {
        billingAddress: 'HIDE',
        shipping: 'HIDE',
      },
      locale: 'en_US',
      theme: 'default',
    },
  }

  // Add customer info if available
  if (params.customerEmail || params.customerName) {
    body.customer = {
      ...(params.customerEmail && { email: params.customerEmail }),
      ...(params.customerName && {
        firstName: params.customerName.split(' ')[0],
        lastName: params.customerName.split(' ').slice(1).join(' ') || '',
      }),
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: getHBLHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`[HBL] Session creation HTTP ${response.status}: ${errorText}`)
  }

  const result: MPGSSessionResponse = await response.json()

  if (result.result !== 'SUCCESS' || !result.session?.id) {
    throw new Error(
      `[HBL] Session creation failed: ${result.error?.message ?? 'Unknown error'} (code: ${result.error?.code})`
    )
  }

  // Build the checkout URL
  // Typical format: {checkoutJsUrl}?session.id={sessionId}&merchant={merchantId}
  const checkoutUrl = result.checkoutUrl ??
    `${config.checkoutJsUrl.replace('checkout.js', 'index.html')}` +
    `?session.id=${result.session.id}&merchant=${merchantId}`

  return {
    sessionId: result.session.id,
    checkoutUrl,
    orderId: params.orderId,
  }
}

/**
 * Retrieves the full payment result from HBL/MPGS for a specific order.
 * Used after customer returns from the hosted payment page.
 */
export async function retrieveHBLPaymentResult(orderId: string): Promise<MPGSPaymentResponse | null> {
  const config = getHBLConfig()
  const merchantId = getHBLMerchantId()

  // MPGS endpoint to retrieve order details
  const url = `${config.apiBaseUrl}/api/rest/version/${config.apiVersion}/merchant/${merchantId}/order/${orderId}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHBLHeaders(),
    })

    if (!response.ok) {
      console.error(`[HBL] Failed to retrieve payment result for order ${orderId}: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`[HBL] Error retrieving payment result for order ${orderId}:`, error)
    return null
  }
}
