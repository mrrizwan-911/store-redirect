import crypto from 'crypto'
import {
  getEasypaisaStoreId,
  getEasypaisaHashKey,
  getEasypaisaCardUrl,
} from './auth'
import { formatEasypaisaTimestamp, formatEasypaisaAmount } from './hash'

export interface CardPaymentParams {
  orderId: string        // becomes orderRefNum
  amountPKR: number
  emailAddress?: string
  mobileNum?: string
  // How many hours before payment link expires
  expiryHours?: number
}

export interface CardPaymentPayload {
  amount: string
  storeId: string
  orderRefNum: string
  postBackURL: string
  paymentMethod: string
  merchantHashedReq: string
  timeStamp: string
  expiryDate?: string
  emailAddr?: string
  mobileNum?: string
  actionUrl: string
}

/**
 * Builds the payload for an EasyPaisa Card payment (HTTP POST Redirect).
 * This requires an SHA-256 hash of specific parameters.
 */
export function buildCardPaymentPayload(params: CardPaymentParams): CardPaymentPayload {
  const storeId = String(getEasypaisaStoreId())
  const hashKey = getEasypaisaHashKey()
  const actionUrl = getEasypaisaCardUrl()

  const amount = formatEasypaisaAmount(params.amountPKR)
  const timeStamp = formatEasypaisaTimestamp()
  const postBackURL = process.env.EASYPAISA_POSTBACK_URL

  if (!postBackURL) {
    throw new Error('[EASYPAISA CARD] EASYPAISA_POSTBACK_URL not set in environment variables')
  }

  // Validate orderRefNum — max 20 alphanumeric
  const orderRefNum = params.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)

  // Generate Hash: storeId + amount + orderRefNum + postBackURL + timeStamp + hashKey
  const hashInput = `${storeId}${amount}${orderRefNum}${postBackURL}${timeStamp}${hashKey}`
  const merchantHashedReq = crypto
    .createHash('sha256')
    .update(hashInput, 'utf8')
    .digest('hex')

  const payload: CardPaymentPayload = {
    amount,
    storeId,
    orderRefNum,
    postBackURL,
    paymentMethod: 'CC_PAYMENT_METHOD',
    merchantHashedReq,
    timeStamp,
    actionUrl,
  }

  // Optional transaction expiry
  if (params.expiryHours) {
    const expiry = new Date(Date.now() + params.expiryHours * 60 * 60 * 1000)
    payload.expiryDate = formatEasypaisaTimestamp(expiry)
  }

  if (params.emailAddress) payload.emailAddr = params.emailAddress
  if (params.mobileNum) payload.mobileNum = params.mobileNum

  return payload
}
