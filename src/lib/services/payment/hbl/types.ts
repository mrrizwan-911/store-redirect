/**
 * HBL/MPGS Type Definitions.
 */

export type MPGSResult = 'SUCCESS' | 'PENDING' | 'FAILURE' | 'ERROR' | 'UNKNOWN'

export interface MPGSOrderInfo {
  id: string          // your orderId
  amount: string      // e.g. "2500.00"
  currency: string    // "PKR"
  description: string
}

export interface MPGSSessionResponse {
  result: MPGSResult
  session?: {
    id: string
    updateStatus: string
    version: string
  }
  checkoutUrl?: string
  error?: {
    code: string
    message: string
  }
}

export interface MPGSPaymentResponse {
  result: MPGSResult
  gatewayCode?: string
  orderId?: string
  transaction?: {
    id: string
    amount: string
    currency: string
    type: string
    receipt?: string
    authorizationCode?: string
  }
  order?: {
    id: string
    amount: string
    currency: string
    status: string
  }
  sourceOfFunds?: {
    type: string
    card?: {
      number: string       // masked, e.g. "411111xxxxxx1111"
      scheme: string       // "VISA" | "MASTERCARD" | "UNIONPAY"
      expiry: { month: string; year: string }
    }
  }
  threeDSecure?: {
    enrolled: string
    verificationStatus: string
    authenticationStatus: string
  }
  error?: {
    code: string
    message: string
  }
}
