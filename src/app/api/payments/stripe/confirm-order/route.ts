import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { sendEmail } from '@/lib/services/email/sender'
import { OrderStatus, PaymentStatus } from '@prisma/client'
import { stripe, verifyPaymentIntent } from '@/lib/services/payment/stripe'
import { SITE_COUNTRY, STRIPE_AMOUNT_MULTIPLIER } from '@/lib/constants/site'
import { rateLimiters, checkRateLimit, getClientIp } from '@/lib/utils/rateLimit'

const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.checkout, clientIp)
    if (rateLimitErr) return rateLimitErr

    const { orderId, stripePaymentIntentId } = await req.json()

    if (!orderId || !stripePaymentIntentId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    // 1. Fetch order details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payment: true,
      },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Idempotency: If already completed in db, return success immediately
    if (order.payment?.status === PaymentStatus.COMPLETED) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 2. Stripe Verification
    let intent
    try {
      intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId)
    } catch (err: any) {
      logger.error('[STRIPE_VERIFY] Failed to retrieve intent', { err: err.message, stripePaymentIntentId })
      return NextResponse.json({ success: false, error: 'Invalid payment reference' }, { status: 400 })
    }

    if (intent.status !== 'succeeded') {
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 })
    }

    if (intent.metadata?.orderId !== orderId) {
      return NextResponse.json({ success: false, error: 'Payment does not belong to this order' }, { status: 403 })
    }

    const expectedAmount = Math.round(Number(order.total) * (STRIPE_AMOUNT_MULTIPLIER[SITE_COUNTRY] || 1))
    if (intent.amount !== expectedAmount) {
      return NextResponse.json({ success: false, error: 'Payment amount mismatch' }, { status: 400 })
    }

    // 3. Transact status changes
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      })

      await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.COMPLETED,
          gatewayRef: stripePaymentIntentId,
          paidAt: new Date(),
        },
      })
    })

    // Note: Customer receipt email and loyalty points are NOT handled here.
    // They are securely handled by the Stripe webhook as the single source of truth.

    // 4. Admin Notification Email (B2B specific)
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@calnza.pk'
    const packingItemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(item.product.name)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${esc(item.variant?.title || 'Standard')}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.quantity}</td>
      </tr>`
      )
      .join('')

    const totalAmount = Number(order.total)
    const adminSubject = `🚨 NEW PAID ORDER - Ready to Pack (#${order.orderNumber})`

    const adminHtml = `
      <div style="font-family: monospace; color: #000; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #eee;">
        <h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 8px;">
          🚨 CALNZA ADMIN Notification — New Paid Order Received
        </h2>
        
        <p style="font-size: 13px; line-height: 1.6;">
          A B2B quotation has been paid successfully via Credit/Debit card! The order is now marked as <strong>CONFIRMED</strong> and is ready to be packed and shipped.
        </p>

        <div style="background: #f9f9f9; padding: 16px; margin: 20px 0; border: 1px solid #ddd;">
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr><td style="padding: 4px 0; color: #666; width: 30%;">Order Number:</td><td style="padding: 4px 0; font-weight: bold;">${esc(order.orderNumber)}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Date Paid:</td><td style="padding: 4px 0;">${new Date().toLocaleString()}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Amount Paid:</td><td style="padding: 4px 0; font-weight: bold; color: green;">PKR ${totalAmount.toLocaleString('en-PK')}</td></tr>
            <tr><td style="padding: 4px 0; color: #666;">Transaction Ref:</td><td style="padding: 4px 0; font-family: monospace; font-size: 11px;">${esc(stripePaymentIntentId)}</td></tr>
          </table>
        </div>

        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; border-bottom: 1px solid #000; padding-bottom: 4px;">
          📦 Packing List
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; margin-bottom: 24px;">
          <thead>
            <tr style="background: #f0f0f0; text-align: left;">
              <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Variant</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${packingItemsHtml}
          </tbody>
        </table>

        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; border-bottom: 1px solid #000; padding-bottom: 4px;">
          🚚 Shipping Address
        </h3>
        <div style="background: #fafafa; padding: 16px; border: 1px solid #eee; font-size: 12px; line-height: 1.6; margin-top: 8px;">
          <strong>Name:</strong> ${esc(order.address?.firstName || '')} ${esc(order.address?.lastName || '')}<br/>
          <strong>Address:</strong> ${esc(order.address?.line1 || '')} ${esc(order.address?.line2 || '')}<br/>
          <strong>City / Country:</strong> ${esc(order.address?.city || '')}, ${esc(order.address?.province || '')} ${esc(order.address?.postalCode || '')} — ${esc(order.address?.country || '')}<br/>
          <strong>Phone:</strong> ${esc(order.address?.phone || '—')}<br/>
          <strong>Email:</strong> ${esc(order.user?.email || 'Guest')}
        </div>
        
        <p style="font-size: 11px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px; text-align: center;">
          This is an automated system alert. Please log in to your admin dashboard to print the shipping label and update delivery logs.
        </p>
      </div>
    `

    sendEmail({
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
      type: 'admin_packing_notification',
      userId: order.userId || undefined,
    }).catch((err) => logger.error('[CONFIRM_ORDER] Admin notification email failed', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[API_STRIPE_CONFIRM_ORDER_POST]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
