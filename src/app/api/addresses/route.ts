import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { addressSchema } from '@/lib/validations/address'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/addresses
 * List all addresses for the logged-in user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: session.userId },
      // Address model has no createdAt, ordering by id as fallback
      orderBy: { id: 'desc' },
    })

    return NextResponse.json({ success: true, data: addresses })
  } catch (error) {
    logger.error('[ADDRESSES_GET_ERROR]', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/addresses
 * Create a new address for the logged-in user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = addressSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { label, line1, line2, city, province, postalCode, isDefault } = parsed.data

    const result = await db.$transaction(async (tx) => {
      // If this is the first address, or isDefault is true, unset other defaults
      const addressCount = await tx.address.count({ where: { userId: session.userId } })

      const setAsDefault = isDefault || addressCount === 0

      if (setAsDefault) {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isDefault: false },
        })
      }

      return tx.address.create({
        data: {
          userId: session.userId,
          label,
          line1,
          line2,
          city,
          province,
          postalCode,
          isDefault: setAsDefault,
        },
      })
    })

    logger.info('[ADDRESS_CREATED]', { addressId: result.id, userId: session.userId })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[ADDRESSES_POST_ERROR]', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
