import { z } from 'zod'

export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required').optional().nullable(),
  phone: z.string().min(7, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  company: z.string().optional().nullable(),
  label: z.string().min(1, 'Label is required'),
  line1: z.string().min(5, 'Address line 1 is too short'),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postalCode: z.string().min(4, 'Postal code is too short'),
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>
