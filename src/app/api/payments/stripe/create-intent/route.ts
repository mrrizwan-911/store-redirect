import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { createPaymentIntent } from '@/lib/services/payment/stripe'
import { logger } from '@/lib/utils/logger'
import { verifyPaymentToken } from '@/lib/utils/paymentToken'

// Map cookie country codes to Stripe currency codes
const COUNTRY_CURRENCY: Record<string, string> = {
  PK: 'pkr',
  UK: 'gbp',
  GLOBAL: 'usd',
}

// Multiplier: PKR (zero-decimal) = 1, GBP/USD = 100
const COUNTRY_MULTIPLIER: Record<string, number> = {
  PK: 1,
  UK: 100,
  GLOBAL: 100,
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, token } = await req.json()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    // Fetch order — amount always comes from DB, never from client
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Token Auth check first
    let isAuthorized = false
    if (token) {
      const tokenVerification = verifyPaymentToken(orderId, token)
      if (tokenVerification.valid) {
        isAuthorized = true
      }
    }

    // Session Auth fallback
    if (!isAuthorized) {
      const session = await getUserSession()
      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      if (order.userId !== session.userId) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
      }
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Order is already processed' },
        { status: 400 }
      )
    }

    // Detect visitor's preferred currency from cookie (fallback to domain env)
    const countryCookie = req.cookies.get('calnza_country_pref')?.value
    const cookieCurrency = countryCookie
      ? COUNTRY_CURRENCY[countryCookie]
      : undefined

    const { clientSecret, paymentIntentId } = await createPaymentIntent({
      orderId: order.id,
      amountInLocalCurrency: Number(order.total),
      customerEmail: order.user?.email ?? undefined,
      currencyOverride: cookieCurrency,
    })

    // Store paymentIntentId on the payment record for later webhook matching
    await db.payment.upsert({
      where: { orderId: order.id },
      update: { gatewayRef: paymentIntentId },
      create: {
        orderId: order.id,
        method: 'CARD',
        status: 'PENDING',
        amount: order.total,
        gatewayRef: paymentIntentId,
      },
    })

    logger.info('[STRIPE] PaymentIntent created', { orderId, paymentIntentId })

    return NextResponse.json({
      success: true,
      data: { clientSecret },
    })
  } catch (error) {
    logger.error('[STRIPE CREATE-INTENT] Error', { error })
    return NextResponse.json({ success: false, error: 'Failed to create payment intent' }, { status: 500 })
  }
}
