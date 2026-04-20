/**
 * EasyPaisa Error Codes and Messages.
 * Maps numeric response codes to user-friendly messages.
 */

export const EASYPAISA_ERROR_MESSAGES: Record<string, string> = {
  '0001': 'EasyPaisa system error. Please try again.',
  '0002': 'Payment request incomplete. Please contact support.',
  '0003': 'Invalid order reference. Please try again.',
  '0004': 'Merchant account issue. Please contact support.',
  '0005': 'Merchant account is not active.',
  '0006': 'Invalid payment amount.',
  '0007': 'This order has already been processed.',
  '0008': 'Payment session expired. Please try again.',
  '0009': 'Your EasyPaisa account is blocked. Please contact EasyPaisa.',
  '0017': 'Payment configuration error. Please contact support.',
  '0021': 'Insufficient balance in your EasyPaisa account.',
}

/**
 * Returns a user-friendly error message for a given EasyPaisa response code.
 */
export function getEasypaisaErrorMessage(code: string): string {
  return EASYPAISA_ERROR_MESSAGES[code] ?? `Payment failed (code: ${code})`
}
