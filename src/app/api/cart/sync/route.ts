import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { syncCartSchema } from '@/lib/validations/cart'
import { logger } from '@/lib/utils/logger'
import { getUserSession } from '@/lib/auth/session'
import { getValidatedCartTotal } from '@/lib/services/payment/priceValidator'
import { SITE_COUNTRY } from '@/lib/constants/site'

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const payload = verifyAccessToken(token)
      return payload.userId
    } catch {
      // Fall through to refresh-cookie session.
    }
  }
  const session = await getUserSession()
  return session?.userId ?? null
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    logger.warn('Unauthorized cart sync attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = syncCartSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('Invalid cart sync data', { issues: parsed.error.issues })
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { items } = parsed.data

  const cart = await db.cart.upsert({
    where: { userId },
    update: { lastActiveAt: new Date() },
    create: { userId },
  })

  // Process sequentially. Take max quantity of what exists vs incoming.
  for (const item of items) {
    const product = await db.product.findUnique({
      where: { id: item.productId, isActive: true },
      include: { variants: item.variantId ? { where: { id: item.variantId } } : false },
    })

    if (!product) continue

    let stockLimit = 10
    if (item.variantId && product.variants && product.variants.length > 0) {
      stockLimit = product.variants[0].stock
    }

    if (stockLimit <= 0) continue

    const existing = await db.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId as any
        }
      },
    })

    if (existing) {
      const targetQty = Math.max(existing.quantity, Math.min(item.quantity, stockLimit, 10))
      if (existing.quantity !== targetQty) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: { quantity: targetQty },
        })
      }
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: Math.min(item.quantity, stockLimit, 10),
        },
      })
    }
  }

  const updatedCart = await db.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              pricePK: true,
              priceUK: true,
              salePricePK: true,
              salePriceUK: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
          variant: { select: { id: true, title: true, optionValues: true, price: true, pricePK: true, priceUK: true, stock: true } },
        }
      }
    }
  })

  if (!updatedCart) {
    return NextResponse.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } })
  }

  const { subtotal } = await getValidatedCartTotal(
    updatedCart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
    SITE_COUNTRY
  )

  const itemCount = updatedCart.items.reduce((s, i) => s + i.quantity, 0)

  logger.info('Cart synced', { userId, itemCount })

  return NextResponse.json({
    success: true,
    data: { ...updatedCart, subtotal, itemCount }
  })
}
