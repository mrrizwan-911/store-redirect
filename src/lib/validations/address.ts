import { z } from 'zod'

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'), // e.g. "Home", "Office"
  line1: z.string().min(5, 'Address line 1 is too short'),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().min(4, 'Postal code is too short'),
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>
