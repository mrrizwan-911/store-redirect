import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderProcessingEmail,
  sendOrderCancelledEmail,
  sendOrderRefundedEmail
} from '@/lib/services/email/orderEmails'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getUserSession } from '@/lib/auth/session'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(req)
  if (authResult instanceof NextResponse) return authResult

  const order = await db.order.findUnique({
    where: { id: (await context.params).id },
    include: {
      items: {
        include: { product: true }
      },
      user: {
        select: { name: true, email: true, phone: true }
      },
      address: true,
      payment: true
    }
  })

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: order })
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Enhanced Auth for Tests: Check both Header and Session
  let isAdmin = false;
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
  const session = await getUserSession();

  if (authHeader) {
    try {
      const payload = verifyAccessToken(authHeader);
      if (payload.role === 'ADMIN') isAdmin = true;
    } catch (e) {}
  }

  if (!isAdmin && session?.role === 'ADMIN') {
    isAdmin = true;
  }

  if (!isAdmin) {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
  }

  try {
    const body = await req.json()
    const { status, trackingNumber, carrier, notes } = body

    // Allowed transitions logic could be more strict,
    // but Prisma will validate enum value for status.
    const updateData: any = {}
    if (status) updateData.status = status
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (carrier !== undefined) updateData.carrier = carrier
    if (notes !== undefined) updateData.notes = notes

    const orderId = (await context.params).id

    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { include: { images: true } } } },
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const order = await db.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { include: { images: true } } } },
      }
    })

    if (status && status !== existingOrder.status && order.user) {
      if (status === 'CONFIRMED') {
        await sendOrderConfirmationEmail(order, order.user)
      } else if (status === 'PROCESSING') {
        await sendOrderProcessingEmail(order, order.user)
      } else if (status === 'SHIPPED') {
        await sendOrderShippedEmail(order, order.user, order.trackingNumber || '', (order as any).carrier)
      } else if (status === 'DELIVERED') {
        const pointsEarned = await awardOrderPoints(order.user.id, Number(order.total), order.id)
        await sendOrderDeliveredEmail(order, order.user, pointsEarned)
      } else if (status === 'CANCELLED') {
        await sendOrderCancelledEmail(order, order.user)
      } else if (status === 'REFUNDED') {
        await sendOrderRefundedEmail(order, order.user)
      }
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error: any) {
    console.error('[PATCH_ORDER_ERROR]', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update order' }, { status: 400 })
  }
}
