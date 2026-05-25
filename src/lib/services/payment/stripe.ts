/**
 * Legacy re-export for backward compatibility.
 * All Stripe functionality is now in ./stripe/index.ts
 */
export {
  stripe,
  createPaymentIntent,
  verifyPaymentIntent,
  constructWebhookEvent,
} from './stripe/index'
