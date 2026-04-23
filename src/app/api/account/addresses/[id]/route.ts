import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { addressSchema } from '@/lib/validations/address'
import { logger } from '@/lib/utils/logger'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const parsed = addressSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { label, line1, line2, city, province, postalCode, isDefault } = parsed.data

    // Check ownership
    const existing = await db.address.findFirst({
      where: { id, userId: session.userId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults for this user
    if (isDefault && !existing.isDefault) {
      await db.address.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const address = await db.address.update({
      where: { id },
      data: {
        label,
        line1,
        line2,
        city,
        province,
        postalCode,
        isDefault
      }
    })

    logger.info('Address updated', { userId: session.userId, addressId: id })

    return NextResponse.json({ success: true, data: address })
  } catch (error) {
    logger.error('[API_ADDRESS_PATCH]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check ownership
    const existing = await db.address.findFirst({
      where: { id, userId: session.userId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 })
    }

    await db.address.delete({ where: { id } })

    // If we deleted the default address, make the next one default
    if (existing.isDefault) {
      const nextAddress = await db.address.findFirst({
        where: { userId: session.userId }
      })
      if (nextAddress) {
        await db.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true }
        })
      }
    }

    logger.info('Address deleted', { userId: session.userId, addressId: id })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    logger.error('[API_ADDRESS_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
