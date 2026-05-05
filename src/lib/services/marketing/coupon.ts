import { db } from "@/lib/db/client";

/**
 * Generates a unique 10% discount coupon for a new newsletter subscriber.
 * @returns The created coupon record.
 */
export async function generateWelcomeCoupon(_email: string) {
  // Generate a unique code: WELCOME10 + 4 random alphanumeric characters
  const randomStr = Math.random().toString(36).toUpperCase().substring(2, 6);
  const code = `WELCOME10-${randomStr}`;

  return await db.coupon.create({
    data: {
      code,
      discountPct: 10,
      minOrderValue: 2000, // Minimum order value of PKR 2,000
      maxUses: 1,         // Single use globally for this specific code
      maxUsesPerUser: 1,  // Single use per user as an extra safety layer
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
    }
  });
}
