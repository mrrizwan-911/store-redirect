import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function createPaymentIntent(amount: number, currency: string) {
  const intent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
  })
  return intent
}

export async function confirmPayment(paymentIntentId: string) {
  const confirmed = await stripe.paymentIntents.confirm(paymentIntentId)
  return confirmed
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
  })
  return refund
}
