import { z } from 'zod'
import { addressSchema } from './address'

export const createOrderSchema = z.object({
  addressId: z.string().optional(),
  guestAddress: addressSchema.optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),

  // Dynamic shipping option from DB (replaces hardcoded shippingMethod enum)
  shippingOptionId: z.string().min(1, 'Please select a shipping method'),

  // Site country — set from NEXT_PUBLIC_SITE_COUNTRY on the client, saved to Order.country
  country: z.string().default('PK'),

  paymentMethod: z.enum(['JAZZCASH', 'EASYPAISA', 'CARD', 'COD', 'BANK_TRANSFER']),

  // For Stripe: passed after client confirms payment, verified server-side before confirming order
  stripePaymentIntentId: z.string().optional(),

  couponCode: z.string().optional().nullable(),
  loyaltyPoints: z.number().int().min(0).max(2000).optional(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional().nullable(),
    quantity: z.number().int().min(1),
  })).min(1, 'Cart cannot be empty'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
