import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db/client'
import { validateCouponSchema } from '@/lib/validations/coupon'
import { logger } from '@/lib/utils/logger'
import { verifyRefreshToken } from '@/lib/auth/jwt'
import { SITE_COUNTRY } from '@/lib/constants/site'

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = validateCouponSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('Invalid coupon validate data', { issues: parsed.error.issues })
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { code, orderValue } = parsed.data
  const country = parsed.data.country || SITE_COUNTRY
  logger.info('Validating coupon', { code, orderValue })

  const coupon = await db.coupon.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 404 })
  }

  if (coupon.country !== 'ALL' && coupon.country !== country) {
    return NextResponse.json({ success: false, error: 'Coupon is not available for this region' }, { status: 400 })
  }

  const now = new Date()
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return NextResponse.json({ success: false, error: 'This coupon has expired' }, { status: 400 })
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ success: false, error: 'This coupon is no longer available' }, { status: 400 })
  }

  // Check maxUsesPerUser
  if (coupon.maxUsesPerUser) {
    const cookieStore = await cookies()
    const token = cookieStore.get('refresh_token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Please login to use this coupon'
      }, { status: 401 })
    }

    try {
      const payload = verifyRefreshToken(token)
      const usageCount = await db.couponUsage.count({
        where: {
          couponId: coupon.id,
          userId: payload.userId
        }
      })

      if (usageCount >= coupon.maxUsesPerUser) {
        return NextResponse.json({
          success: false,
          error: `You have already used this coupon the maximum number of times (${coupon.maxUsesPerUser})`
        }, { status: 400 })
      }
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: 'Please login to use this coupon'
      }, { status: 401 })
    }
  }

  if (coupon.minOrderValue && orderValue < Number(coupon.minOrderValue)) {
    return NextResponse.json({ success: false, error: `Minimum order value of PKR ${coupon.minOrderValue} required for this coupon` }, { status: 400 })
  }

  let discountAmount = 0
  if (coupon.discountPct) {
    discountAmount = Math.floor((Number(coupon.discountPct) / 100) * orderValue)
  } else if (coupon.discountFlat) {
    discountAmount = Number(coupon.discountFlat)
  }

  // Discount shouldn't exceed order value
  discountAmount = Math.min(discountAmount, orderValue)

  const newTotal = orderValue - discountAmount

  return NextResponse.json({
    success: true,
    data: {
      code: coupon.code,
      discountPct: coupon.discountPct ? Number(coupon.discountPct) : null,
      discountFlat: coupon.discountFlat ? Number(coupon.discountFlat) : null,
      discountAmount,
      newTotal
    }
  })
}
