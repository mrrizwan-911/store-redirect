import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { addressSchema } from '@/lib/validations/address'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: session.userId },
      orderBy: { isDefault: 'desc' }
    })

    return NextResponse.json({ success: true, data: addresses })
  } catch (error) {
    logger.error('[API_ADDRESSES_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

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

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false }
      })
    }

    // Check if this is the user's first address, if so make it default
    const addressCount = await db.address.count({ where: { userId: session.userId } })
    const finalIsDefault = addressCount === 0 ? true : isDefault

    const address = await db.address.create({
      data: {
        userId: session.userId,
        label,
        line1,
        line2,
        city,
        province,
        postalCode,
        isDefault: finalIsDefault
      }
    })

    logger.info('Address created', { userId: session.userId, addressId: address.id })

    return NextResponse.json({ success: true, data: address }, { status: 201 })
  } catch (error) {
    logger.error('[API_ADDRESSES_POST]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
