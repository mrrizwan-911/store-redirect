import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { constructWebhookEvent } from '@/lib/services/payment/stripe'
import { logger } from '@/lib/utils/logger'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { sendEmail } from '@/lib/services/email/sender'

const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
import { OrderStatus, PaymentStatus } from '@prisma/client'
import Stripe from 'stripe'

// Must be raw body — do NOT parse as JSON
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let event: Stripe.Event

  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      logger.warn('[STRIPE WEBHOOK] Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    event = constructWebhookEvent(rawBody, signature)
  } catch (err: any) {
    logger.error('[STRIPE WEBHOOK] Signature verification failed', { error: err.message })
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  logger.info('[STRIPE WEBHOOK] Event received', { type: event.type, id: event.id })

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent
    const orderId = intent.metadata?.orderId

    if (!orderId) {
      logger.warn('[STRIPE WEBHOOK] No orderId in metadata', { intentId: intent.id })
      return NextResponse.json({ received: true })
    }

    try {
      // Idempotency: skip if already processed
      const existing = await db.payment.findUnique({ where: { orderId } })
      if (existing?.status === PaymentStatus.COMPLETED) {
        logger.info('[STRIPE WEBHOOK] Already processed', { orderId })
        return NextResponse.json({ received: true })
      }

      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CONFIRMED },
        })

        await tx.payment.update({
          where: { orderId },
          data: {
            status: PaymentStatus.COMPLETED,
            gatewayRef: intent.id,
            gatewayResponse: intent as any,
            paidAt: new Date(),
          },
        })
      })

      // Async side-effects (non-blocking)
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { 
          user: true,
          address: true,
          items: {
            include: { product: true, variant: true }
          }
        },
      })

      if (order?.userId) {
        awardOrderPoints(order.userId, Number(order.total), order.id)
          .catch(err => logger.error('[STRIPE WEBHOOK] Loyalty award failed', { err, orderId }))
      }

      if (order) {
        sendOrderConfirmationEmail(order, order.user)
          .catch(err => logger.error('[STRIPE WEBHOOK] Email failed', { err, orderId }))

        // Admin Notification Email
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
              An order has been paid successfully! The order is now marked as <strong>CONFIRMED</strong> and is ready to be packed and shipped.
            </p>

            <div style="background: #f9f9f9; padding: 16px; margin: 20px 0; border: 1px solid #ddd;">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; color: #666; width: 30%;">Order Number:</td><td style="padding: 4px 0; font-weight: bold;">${esc(order.orderNumber)}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;">Date Paid:</td><td style="padding: 4px 0;">${new Date().toLocaleString()}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;">Amount Paid:</td><td style="padding: 4px 0; font-weight: bold; color: green;">PKR ${totalAmount.toLocaleString('en-PK')}</td></tr>
                <tr><td style="padding: 4px 0; color: #666;">Transaction Ref:</td><td style="padding: 4px 0; font-family: monospace; font-size: 11px;">${esc(intent.id)}</td></tr>
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
              <strong>Email:</strong> ${esc(order.user?.email || order.address?.email || 'Guest')}
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
        }).catch((err) => logger.error('[STRIPE WEBHOOK] Admin notification email failed', { err, orderId }))
      }

      logger.info('[STRIPE WEBHOOK] Payment confirmed', { orderId, intentId: intent.id })
    } catch (err) {
      logger.error('[STRIPE WEBHOOK] Failed to update order', { err, orderId })
      // Return 500 so Stripe retries
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent
    const orderId = intent.metadata?.orderId

    if (orderId) {
      await db.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: intent as any,
        },
      }).catch(err => logger.error('[STRIPE WEBHOOK] Failed to mark payment failed', { err, orderId }))

      logger.warn('[STRIPE WEBHOOK] Payment failed', {
        orderId,
        failureMessage: intent.last_payment_error?.message,
      })
    }
  }

  return NextResponse.json({ received: true })
}
