import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

/**
 * PUT /api/addresses/[id]/default
 * Sets a specific address as the default for the user.
 */
export async function PUT(
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

    // Update default status in a transaction
    await db.$transaction(async (tx) => {
      // 1. Unset any current default
      await tx.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      })

      // 2. Set the new default
      await tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      })
    })

    logger.info('[ADDRESS_SET_DEFAULT]', { addressId, userId: session.userId })

    return NextResponse.json({ success: true, message: 'Default address updated' })
  } catch (error) {
    logger.error('[ADDRESS_SET_DEFAULT_ERROR]', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
