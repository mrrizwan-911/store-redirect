import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'
import { verifyOrderAccessToken } from '@/lib/utils/orderAccessToken'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        total: true,
        subtotal: true,
        shippingCost: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: { select: { name: true, slug: true } },
            variant: { select: { title: true } },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const token = req.nextUrl.searchParams.get('token')
    const session = await getUserSession()
    const ownsOrder = Boolean(session?.userId && order.userId === session.userId)
    const hasTokenAccess = verifyOrderAccessToken(token, order.id)

    if (!ownsOrder && !hasTokenAccess) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        userId: undefined,
        total: Number(order.total),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        items: order.items.map(item => ({
          ...item,
          price: Number(item.price),
        })),
      },
    })
  } catch (error) {
    logger.error('Failed to fetch order confirmation', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
