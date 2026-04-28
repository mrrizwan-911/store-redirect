import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const order = await db.order.findFirst({
      where: {
        OR: [
          { orderNumber: id },
          { trackingNumber: id }
        ]
      },
      include: {
        address: {
          select: {
            firstName: true,
            lastName: true,
            city: true,
            province: true,
          }
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                }
              }
            },
            variant: true
          }
        },
        payment: {
          select: {
            method: true,
            status: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Sanitize the response for public consumption
    const sanitizedOrder = {
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      status: order.status,
      createdAt: order.createdAt,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      address: order.address,
      items: order.items.map(item => {
        let size = null;
        let color = null;

        if (item.variant) {
          const options = item.variant.optionValues as any;
          if (options) {
            size = options.size || options.Size;
            color = options.color || options.Color || options.colour || options.Colour;
          }
        }

        return {
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.price),
          image: item.product.images[0]?.url,
          variant: {
            size,
            color
          }
        };
      }),
      payment: order.payment
    }

    return NextResponse.json({ success: true, data: sanitizedOrder })
  } catch (error) {
    logger.error('[API_ORDER_TRACK_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
