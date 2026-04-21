import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(/^((\+92)|(0092)|(0))?3[0-9]{9}$/, 'Invalid Pakistani phone number').optional().nullable(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
