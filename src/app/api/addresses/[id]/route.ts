import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { addressSchema } from '@/lib/validations/address'
import { logger } from '@/lib/utils/logger'

/**
 * PATCH /api/addresses/[id]
 * Update an existing address.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: addressId } = await params
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = addressSchema.partial().safeParse(body) // Allow partial updates

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 })
    }

    const result = await db.$transaction(async (tx) => {
      // If setting as default, unset others
      if (parsed.data.isDefault === true) {
        await tx.address.updateMany({
          where: { userId: session.userId },
          data: { isDefault: false },
        })
      }

      return tx.address.update({
        where: { id: addressId },
        data: parsed.data,
      })
    })

    logger.info('[ADDRESS_UPDATED]', { addressId, userId: session.userId })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[ADDRESS_PATCH_ERROR]', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/addresses/[id]
 * Delete an address.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: addressId } = await params
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Address not found' }, { status: 404 })
    }

    await db.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      })

      // If we deleted the default address, set another one as default if any exist
      if (existing.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId: session.userId },
          // Address model has no createdAt, ordering by id as fallback
          orderBy: { id: 'desc' },
        })

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          })
        }
      }
    })

    logger.info('[ADDRESS_DELETED]', { addressId, userId: session.userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[ADDRESS_DELETE_ERROR]', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
