/**
 * HBL/MPGS Gateway Response Codes.
 * Maps numeric and symbolic codes to user-friendly error messages.
 */

export const HBL_GATEWAY_ERRORS: Record<string, string> = {
  DECLINED:                'Your card was declined. Please try a different card.',
  INSUFFICIENT_FUNDS:      'Insufficient funds on your card.',
  EXPIRED_CARD:            'Your card has expired. Please use a different card.',
  INVALID_CARD:            'Invalid card details. Please check and try again.',
  DO_NOT_HONOUR:           'Transaction not authorized. Please contact your bank.',
  NOT_ENROLLED_IN_3DS:     'Your card is not enabled for online payments. Contact your bank.',
  AUTHENTICATION_FAILED:   '3D Secure authentication failed. Please try again.',
  LIMIT_EXCEEDED:          'Your daily transaction limit has been reached.',
  BLOCKED_CARD:            'Your card has been blocked. Please contact your bank.',
  SYSTEM_ERROR:            'Payment system error. Please try again.',
  TIMEOUT:                 'Payment session timed out. Please check your order status.',
}

/**
 * Returns a user-friendly error message for a given HBL gateway code.
 */
export function getHBLGatewayErrorMessage(code?: string): string {
  if (!code) return 'Payment failed. Please try a different card or payment method.'
  return HBL_GATEWAY_ERRORS[code] || 'Payment failed. Please try a different card.'
}
