import { db } from '@/lib/db/client'
import { LoyaltyTier } from '@prisma/client'

const POINTS_PER_PKR = 0.01  // PKR 100 = 1 point

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
}

export function computeTier(totalEarned: number): LoyaltyTier {
  if (totalEarned >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (totalEarned >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (totalEarned >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

export async function awardPoints(
  userId: string,
  amount: number,
  reason: string,
  type: 'ORDER' | 'REFERRAL' | 'REVIEW',
  orderId?: string
): Promise<number> {
  let pointsToAward = amount

  // Apply double-points multiplier for orders if a campaign is active
  if (type === 'ORDER') {
    const now = new Date()
    const activeCampaign = await db.loyaltyCampaign.findFirst({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      }
    })

    if (activeCampaign) {
      pointsToAward = Math.floor(amount * activeCampaign.multiplier)
    }
  }

  if (pointsToAward === 0) return 0

  // Upsert loyalty account
  const account = await db.loyaltyAccount.upsert({
    where: { userId },
    update: {
      points: { increment: pointsToAward },
      totalEarned: { increment: pointsToAward },
    },
    create: {
      userId,
      points: pointsToAward,
      totalEarned: pointsToAward,
    },
  })

  const newTotalEarned = account.totalEarned
  const newTier = computeTier(newTotalEarned)

  if (newTier !== account.tier) {
    await db.loyaltyAccount.update({
      where: { userId },
      data: { tier: newTier },
    })
  }

  await db.loyaltyEvent.create({
    data: {
      accountId: account.id,
      points: pointsToAward,
      reason: orderId ? `${reason} (Order #${orderId})` : reason,
    },
  })

  return pointsToAward
}

export async function awardOrderPoints(
  userId: string,
  orderTotal: number,
  orderId: string
): Promise<number> {
  const basePoints = Math.floor(orderTotal * POINTS_PER_PKR)
  return awardPoints(userId, basePoints, 'Order Purchase', 'ORDER', orderId)
}
