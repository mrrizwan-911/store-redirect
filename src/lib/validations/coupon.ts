import { z } from 'zod'

export const couponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().positive("Discount must be positive"),
  minOrderValue: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
  country: z.string().optional().default('ALL'),
}).superRefine((data, ctx) => {
  if (data.type === 'PERCENTAGE' && data.discountValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentage discount cannot exceed 100",
      path: ['discountValue'],
    });
  }
});

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  orderValue: z.number().min(0, "Order value must be positive"),
  country: z.enum(['PK', 'UK', 'GLOBAL']).optional(),
});

export type CouponInput = z.infer<typeof couponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
