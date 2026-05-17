import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { verifyPaymentToken } from '@/lib/utils/paymentToken'
import { checkRateLimit, rateLimiters, getClientIp } from '@/lib/utils/rateLimit'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.api, clientIp)
    if (rateLimitErr) return rateLimitErr

    const { id } = await context.params
    const token = req.nextUrl.searchParams.get('token')

    // Auth Check
    const tokenVerification = verifyPaymentToken(id, token)
    if (!tokenVerification.valid) {
      logger.warn(`[PAYMENT_DETAILS] Invalid token attempt for order ${id}: ${tokenVerification.reason}`)
      return NextResponse.json({ success: false, error: tokenVerification.reason }, { status: 403 })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        address: true,
        payment: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { isPrimary: 'desc' },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Format fields cleanly
    const formatted = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      createdAt: order.createdAt,
      address: order.address,
      payment: order.payment
        ? {
            method: order.payment.method,
            status: order.payment.status,
            amount: Number(order.payment.amount),
          }
        : null,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          image: item.product.images[0]?.url || null,
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              title: item.variant.title,
            }
          : null,
      })),
    }

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    logger.error('[API_ORDER_PAYMENT_DETAILS_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
