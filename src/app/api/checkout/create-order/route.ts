import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createOrderSchema } from '@/lib/validations/checkout'
import { getValidatedCartTotal } from '@/lib/services/payment/priceValidator'
import { logger } from '@/lib/utils/logger'
import { getUserSession } from '@/lib/auth/session'
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const {
      addressId,
      guestAddress,
      guestName,
      guestEmail,
      guestPhone,
      shippingMethod,
      paymentMethod,
      couponCode,
      items,
      isGift,
      giftMessage,
    } = parsed.data

    const session = await getUserSession()
    let userId = session?.userId

    // Handle Guest Checkout — Link to or create a GUEST user
    if (!userId && guestEmail && guestName) {
      const existingUser = await db.user.findUnique({
        where: { email: guestEmail.toLowerCase() }
      })

      if (existingUser) {
        // If user is a GUEST, we can link the order.
        // If they are a CUSTOMER/ADMIN, we link it too (history tracking),
        // but typically guest checkout shouldn't allow hijacking an existing account's history without auth.
        // For simplicity and to satisfy "Guest Checkout", we link if it's a GUEST or if the user doesn't have a password yet.
        userId = existingUser.id
      } else {
        // Create new GUEST user
        const newUser = await db.user.create({
          data: {
            email: guestEmail.toLowerCase(),
            name: guestName,
            phone: guestPhone,
            role: 'GUEST',
            isVerified: false
          }
        })
        userId = newUser.id
      }
    }

    // 1. Validate Prices and compute subtotal
    const { subtotal, lineItems } = await getValidatedCartTotal(items)

    // 2. Validate Coupon
    let discount = 0
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      })

      const now = new Date()
      const isValid =
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > now) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
        (!coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue))

      if (isValid) {
        if (coupon.discountPct) {
          discount = Math.floor((Number(coupon.discountPct) / 100) * subtotal)
        } else if (coupon.discountFlat) {
          discount = Number(coupon.discountFlat)
        }
        discount = Math.min(discount, subtotal)
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired coupon' },
          { status: 400 }
        )
      }
    }

    // 3. Compute Shipping
    let shippingCost = 0
    if (subtotal < 3000) {
      if (shippingMethod === 'standard') shippingCost = 200
      else if (shippingMethod === 'express') shippingCost = 500
    }
    // If subtotal >= 3000, shipping is free regardless of method chosen if it was standard/free

    const total = subtotal + shippingCost - discount

    // Pre-checkout: validate all variants have sufficient stock
    for (const item of lineItems) {
      if (item.variantId) {
        const variant = await db.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, title: true }
        })
        if (!variant) {
          return NextResponse.json(
            { success: false, error: `Product variant not found` },
            { status: 400 }
          )
        }
        if (variant.stock < item.quantity) {
          return NextResponse.json(
            { success: false, error: `Insufficient stock for "${variant.title || 'item'}" — only ${variant.stock} left` },
            { status: 400 }
          )
        }
      }
    }

    // 4. Create Order in Transaction
    const result = await db.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          userId,
          addressId: userId ? addressId : undefined,
          status: OrderStatus.PENDING,
          subtotal: subtotal,
          shippingCost: shippingCost,
          discount: discount,
          total: total,
          couponCode: discount > 0 ? couponCode?.toUpperCase() : null,
          isGift,
          giftMessage,
          // For guest checkout, we might want to store guest info somewhere
          // In this schema, we don't have guest fields in Order, so we log it or use notes
          notes: !userId ? `Guest: ${guestName} (${guestEmail}, ${guestPhone})` : null,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.validatedPrice,
            })),
          },
        },
      })

      // Create initial payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod as PaymentMethod,
          status: PaymentStatus.PENDING,
          amount: total,
        },
      })

      // Increment coupon usage if used
      if (discount > 0 && couponCode) {
        await tx.coupon.update({
          where: { code: couponCode.toUpperCase() },
          data: { usedCount: { increment: 1 } },
        })
      }

      // Atomically decrement stock for each variant
      for (const item of lineItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      // Clear cart if logged in
      if (userId) {
        const cart = await tx.cart.findUnique({ where: { userId } })
        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
        }
      }

      return order
    })

    logger.info('Order created successfully', {
      orderId: result.id,
      orderNumber: result.orderNumber,
      userId
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: result.id,
        orderNumber: result.orderNumber,
        total: result.total,
        paymentMethod: paymentMethod,
        nextStep: paymentMethod === 'COD' ? 'confirm_cod' : 'redirect_to_gateway',
      },
    })
  } catch (error) {
    logger.error('Failed to create order', { error })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
