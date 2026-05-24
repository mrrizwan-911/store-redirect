/**
 * Stripe server-side service.
 * NEVER import this in client components — it uses the secret key.
 *
 * Flow:
 * 1. Client calls /api/payments/stripe/create-intent with orderId
 * 2. This service fetches order amount from DB (amount never comes from client)
 * 3. Returns clientSecret to client
 * 4. Client confirms with Stripe.js (card data never touches your server)
 * 5. Stripe calls /api/payments/stripe/webhook on success
 * 6. Webhook marks order as CONFIRMED
 */

import Stripe from 'stripe'
import { SITE_COUNTRY, SITE_CURRENCY, STRIPE_AMOUNT_MULTIPLIER } from '@/lib/constants/site'

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

/** Currency overrides from cookie-based country preferences */
const COOKIE_CURRENCY: Record<string, string> = {
  PK: 'pkr',
  UK: 'gbp',
  GLOBAL: 'usd',
}

/** Multiplier: zero-decimal vs cent-based currencies */
const CURRENCY_MULTIPLIER: Record<string, number> = {
  pkr: 1,
  gbp: 100,
  usd: 100,
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

/**
 * Create a Stripe PaymentIntent for an order.
 * Amount is always read from the database — never from the client.
 */
export async function createPaymentIntent(params: {
  orderId: string
  amountInLocalCurrency: number
  customerEmail?: string
  currencyOverride?: string
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  // Use cookie-provided currency if available, otherwise fall back to domain env
  const currency = (params.currencyOverride ?? COOKIE_CURRENCY[SITE_COUNTRY] ?? 'pkr').toLowerCase()
  const multiplier = CURRENCY_MULTIPLIER[currency] ?? 1

  // Stripe requires integer amounts (smallest currency unit)
  const stripeAmount = Math.round(params.amountInLocalCurrency * multiplier)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmount,
    currency,
    metadata: {
      orderId: params.orderId,
      siteCountry: SITE_COUNTRY,
      stripeCurrency: currency,
    },
    receipt_email: params.customerEmail,
  })

  if (!paymentIntent.client_secret) {
    throw new Error('Stripe did not return a client secret')
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

/**
 * Retrieve a PaymentIntent and verify it succeeded.
 * Used by create-order route to confirm Stripe payment before confirming order.
 */
export async function verifyPaymentIntent(paymentIntentId: string): Promise<{
  succeeded: boolean
  orderId: string | null
  amount: number
}> {
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

  // Read the currency from the PaymentIntent metadata (set by createPaymentIntent)
  const storedCurrency = (intent.metadata?.stripeCurrency as string)?.toLowerCase() || 'pkr'
  const multiplier = CURRENCY_MULTIPLIER[storedCurrency] ?? 1

  return {
    succeeded: intent.status === 'succeeded',
    orderId: (intent.metadata?.orderId as string) ?? null,
    amount: intent.amount / multiplier,
  }
}

/**
 * Verify and parse a Stripe webhook event.
 * Uses the webhook signing secret to ensure the event is from Stripe.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
