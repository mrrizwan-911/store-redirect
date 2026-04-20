import { z } from 'zod'
import { addressSchema } from './address'

export const createOrderSchema = z.object({
  addressId: z.string().optional(),
  guestAddress: addressSchema.optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'free']),
  paymentMethod: z.enum(['JAZZCASH', 'EASYPAISA', 'CARD', 'COD', 'BANK_TRANSFER']),
  couponCode: z.string().optional().nullable(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500).optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional().nullable(),
    quantity: z.number().int().min(1).max(10),
  })).min(1, 'Cart cannot be empty'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
