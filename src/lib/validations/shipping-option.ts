import { z } from 'zod'

export const shippingOptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be zero or greater'),
  estimatedDays: z.string().optional().nullable(),
  countries: z.array(z.enum(['PK', 'UK', 'GLOBAL'])).min(1, 'At least one country is required'),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
})

export const shippingOptionUpdateSchema = shippingOptionSchema.partial()
