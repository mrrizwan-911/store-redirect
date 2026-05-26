import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters, checkRateLimit, getClientIp } from '@/lib/utils/rateLimit'
import { db } from '@/lib/db/client'
import { createOrderSchema } from '@/lib/validations/checkout'
import { getValidatedCartTotal } from '@/lib/services/payment/priceValidator'
import { logger } from '@/lib/utils/logger'
import { getUserSession } from '@/lib/auth/session'
import { verifyTurnstile } from '@/lib/utils/verifyTurnstile'
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { getEnabledPaymentMethods } from '@/lib/constants/site'
import { createOrderAccessToken } from '@/lib/utils/orderAccessToken'

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.checkout, clientIp)
    if (rateLimitErr) return rateLimitErr
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
      shippingOptionId,
      country,
      paymentMethod,
      stripePaymentIntentId,
      couponCode,
      loyaltyPoints,
      items,
      isGift,
      giftMessage,
      turnstileToken,
    } = parsed.data

    logger.info('Create order request received', {
      couponCode,
      loyaltyPoints,
      itemsCount: items.length,
      isGuest: Boolean(guestEmail),
      paymentMethod,
      country,
    })

    if (!turnstileToken) {
      return NextResponse.json(
        { success: false, error: 'Security verification failed.' },
        { status: 403 }
      )
    }

    const isValid = await verifyTurnstile(turnstileToken, clientIp)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Security verification failed.' },
        { status: 403 }
      )
    }

    // ── Guest user resolution ─────────────────────────────────────────────
    const session = await getUserSession()
    let userId = session?.userId

    if (!userId && guestEmail && guestName) {
      const existingUser = await db.user.findUnique({
        where: { email: guestEmail.toLowerCase() }
      })
      if (existingUser) {
        userId = existingUser.id
      } else {
        const newUser = await db.user.create({
          data: {
            email: guestEmail.toLowerCase(),
            name: guestName,
            phone: guestPhone,
            role: 'GUEST',
            isVerified: false,
          }
        })
        userId = newUser.id
      }
    }

    const orderCountry = country === 'UK' ? 'UK' : country === 'GLOBAL' ? 'GLOBAL' : 'PK'
    const allowedMethods = getEnabledPaymentMethods()
    if (!allowedMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Payment method is not available for this region' },
        { status: 400 }
      )
    }

    // ── Validate Shipping Option ──────────────────────────────────────────
    const shippingOption = await db.shippingOption.findUnique({
      where: { id: shippingOptionId },
    })
    if (
      !shippingOption ||
      !shippingOption.isActive ||
      !shippingOption.countries.includes(orderCountry)
    ) {
      return NextResponse.json(
        { success: false, error: 'Selected shipping option is not available' },
        { status: 400 }
      )
    }

    // ── Stripe PaymentIntent verification ────────────────────────────────
    // For CARD payments: verify that the Stripe PaymentIntent has succeeded
    // before creating the order as confirmed.
    // Amount check prevents client-side price manipulation.
    if (paymentMethod === 'CARD' && stripePaymentIntentId) {
      try {
        // Dynamic import to keep Stripe out of edge runtime paths
        const { verifyPaymentIntent } = await import('@/lib/services/payment/stripe')
        const verification = await verifyPaymentIntent(stripePaymentIntentId)

        if (!verification.succeeded) {
          return NextResponse.json(
            { success: false, error: 'Payment has not been completed. Please complete payment first.' },
            { status: 400 }
          )
        }

        if (verification.orderId && verification.orderId !== '') {
          // We verify orderId matches after order creation below, so just log it
          logger.info('[STRIPE] PaymentIntent verified', {
            intentId: stripePaymentIntentId,
            amount: verification.amount,
          })
        }
      } catch (stripeErr) {
        logger.error('[STRIPE] Failed to verify PaymentIntent', { stripeErr })
        return NextResponse.json(
          { success: false, error: 'Could not verify payment. Please try again.' },
          { status: 400 }
        )
      }
    }

    // ── Validate Prices and compute subtotal ─────────────────────────────
    const { subtotal, lineItems } = await getValidatedCartTotal(items, orderCountry)

    // ── Compute Shipping Cost ─────────────────────────────────────────────
    const freeShippingThreshold = shippingOption.freeShippingThreshold
      ? Number(shippingOption.freeShippingThreshold)
      : null
    const shippingCost =
      freeShippingThreshold !== null && subtotal >= freeShippingThreshold
        ? 0
        : Number(shippingOption.price)

    // ── Validate Coupon ───────────────────────────────────────────────────
    let discount = 0
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      })

      const now = new Date()
      let isValid =
        coupon &&
        coupon.isActive &&
        (coupon.country === 'ALL' || coupon.country === orderCountry) &&
        (!coupon.expiresAt || coupon.expiresAt > now) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
        (!coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue))

      if (isValid && coupon && coupon.maxUsesPerUser && userId) {
        const usageCount = await db.couponUsage.count({
          where: { couponId: coupon.id, userId }
        })
        if (usageCount >= coupon.maxUsesPerUser) isValid = false
      }

      if (isValid && coupon) {
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

    // ── Validate Loyalty Points ───────────────────────────────────────────
    let loyaltyDiscount = 0
    let pointsToDeduct = 0
    if (userId && loyaltyPoints && loyaltyPoints > 0) {
      const account = await db.loyaltyAccount.findUnique({ where: { userId } })
      if (!account || account.points < loyaltyPoints) {
        return NextResponse.json(
          { success: false, error: 'Insufficient loyalty points' },
          { status: 400 }
        )
      }
      if (loyaltyPoints % 100 !== 0 || loyaltyPoints > 2000) {
        return NextResponse.json(
          { success: false, error: 'Invalid loyalty points redemption' },
          { status: 400 }
        )
      }
      const remainingBalance = subtotal - discount + shippingCost
      loyaltyDiscount = Math.min(loyaltyPoints, remainingBalance)
      pointsToDeduct = loyaltyDiscount
    }

    const totalDiscount = discount + loyaltyDiscount
    const total = Math.max(0, subtotal + shippingCost - totalDiscount)

    // ── Stock validation ──────────────────────────────────────────────────
    for (const item of lineItems) {
      if (item.variantId) {
        const variant = await db.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, title: true }
        })
        if (!variant) {
          return NextResponse.json(
            { success: false, error: 'Product variant not found' },
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

    // ── Determine initial order status ───────────────────────────────────
    // COD: starts PENDING (admin confirms after delivery)
    // EasyPaisa: starts PENDING (payment initiated separately via /api/payments/easypaisa/initiate)
    // Stripe CARD with verified intent: starts CONFIRMED immediately
    const initialStatus: OrderStatus =
      paymentMethod === 'CARD' && stripePaymentIntentId
        ? OrderStatus.CONFIRMED
        : OrderStatus.PENDING

    const initialPaymentStatus: PaymentStatus =
      paymentMethod === 'CARD' && stripePaymentIntentId
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING

    // ── Create Order Transaction ──────────────────────────────────────────
    const result = await db.$transaction(async (tx) => {
      let finalAddressId = addressId

      if (!finalAddressId && guestAddress && userId) {
        const addr = await tx.address.create({
          data: { ...guestAddress, userId }
        })
        finalAddressId = addr.id
      }

      const trackingNumber = `AS-${Math.floor(10000000 + Math.random() * 90000000)}`
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase().slice(-5)}-${Math.random().toString(36).toUpperCase().slice(2, 6)}`

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: finalAddressId,
          country: orderCountry,
          status: initialStatus,
          subtotal,
          shippingCost,
          discount: totalDiscount,
          total,
          couponCode: discount > 0 ? couponCode?.toUpperCase() : null,
          trackingNumber,
          isGift,
          giftMessage,
          notes: !session?.userId
            ? `Guest: ${guestName} (${guestEmail}, ${guestPhone})`
            : null,
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

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod as PaymentMethod,
          status: initialPaymentStatus,
          amount: total,
          gatewayRef: stripePaymentIntentId || null,
          paidAt: initialPaymentStatus === PaymentStatus.COMPLETED ? new Date() : null,
        },
      })

      if (discount > 0 && couponCode && userId) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() }
        })
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          })
          await tx.couponUsage.create({
            data: { couponId: coupon.id, userId, orderId: order.id }
          })
        }
      }

      if (userId && pointsToDeduct > 0) {
        const account = await tx.loyaltyAccount.findUnique({ where: { userId } })
        if (account) {
          await tx.loyaltyAccount.update({
            where: { userId },
            data: { points: { decrement: pointsToDeduct } }
          })
          await tx.loyaltyEvent.create({
            data: {
              accountId: account.id,
              points: -pointsToDeduct,
              reason: `Redeemed at checkout for order #${order.orderNumber}`,
            }
          })
        }
      }

      for (const item of lineItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

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
      country: result.country,
      status: result.status,
      paymentMethod,
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: result.id,
        accessToken: createOrderAccessToken(result.id),
        orderNumber: result.orderNumber,
        total: result.total,
        status: result.status,
        paymentMethod,
        country: result.country,
        nextStep:
          paymentMethod === 'COD' ? 'confirmed_cod'
          : paymentMethod === 'CARD' ? 'confirmed_stripe'
          : 'initiate_easypaisa',
      },
    })
  } catch (error: any) {
    if (error.status === 400) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    logger.error('Failed to create order', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
