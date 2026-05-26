import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { sendEmail } from '@/lib/services/email/sender'
import { logger } from '@/lib/utils/logger'
import { QuotationStatus, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client'
import { generatePaymentToken } from '@/lib/utils/paymentToken'
import { getProductPrice, normalizePricingCountry } from '@/lib/utils/pricing'

function countryFromQuotation(country?: string | null) {
  const value = country?.toUpperCase()
  return value === 'UK' || value === 'UNITED KINGDOM' || value === 'GB' ? 'UK' : 'PK'
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { id } = await context.params

    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 })
    }

    if (quotation.status === QuotationStatus.CONVERTED) {
      return NextResponse.json(
        { success: false, error: 'This quotation has already been converted to an order.' },
        { status: 409 }
      )
    }

    if (quotation.status !== QuotationStatus.ACCEPTED && quotation.status !== QuotationStatus.SENT) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot convert a quotation with status "${quotation.status}". It must be ACCEPTED or SENT first.`,
        },
        { status: 400 }
      )
    }

    // Enrich items with product data
    const rawItems = quotation.items as any[]
    const productIds = rawItems.map((i: any) => i.productId).filter(Boolean)

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, basePrice: true, pricePK: true, priceUK: true, salePricePK: true, salePriceUK: true },
    })
    const orderCountry = countryFromQuotation(quotation.country)
    const pricingCountry = normalizePricingCountry(orderCountry)
    const currencyLabel = orderCountry === 'UK' ? 'GBP' : 'PKR'
    const locale = orderCountry === 'UK' ? 'en-GB' : 'en-PK'

    // Build order items — use admin-set unit prices, fall back to basePrice
    const orderItems = rawItems
      .map((item: any) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return null
        const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : getProductPrice(product, pricingCountry).price
        const discountPerUnit = Number(item.discountAmount ?? 0)
        const finalPrice = Math.max(0, unitPrice - discountPerUnit)
        return {
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: Number(item.quantity),
          price: finalPrice,
        }
      })
      .filter(Boolean) as { productId: string; variantId: string | null; quantity: number; price: number }[]

    if (orderItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid items with products found in quotation.' },
        { status: 400 }
      )
    }

    const subtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0)
    const total = subtotal // No extra shipping/discount at order level — already in unit prices

    // Generate human-readable order number
    const orderNumber = `QT-${quotation.id.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`

    // Create Order + Payment in a transaction
    const order = await db.$transaction(async (tx) => {
      let userId = quotation.userId

      // If no user linked, find or create a guest user
      if (!userId) {
        const existingUser = await tx.user.findUnique({
          where: { email: quotation.email.toLowerCase() }
        })
        if (existingUser) {
          userId = existingUser.id
        } else {
          const newUser = await tx.user.create({
            data: {
              email: quotation.email.toLowerCase(),
              name: quotation.name,
              phone: quotation.phone,
              role: 'GUEST',
              isVerified: false,
            }
          })
          userId = newUser.id
        }
      }

      // Create address if quotation has address info
      let addressId: string | null = null
      if (quotation.addressLine1) {
        const nameParts = quotation.name.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        const addr = await tx.address.create({
          data: {
            userId: userId!,
            label: 'Quotation Shipping',
            firstName,
            lastName,
            email: quotation.email,
            phone: quotation.phone || '',
            country: quotation.country || 'Pakistan',
            line1: quotation.addressLine1,
            line2: quotation.addressLine2,
            city: quotation.city || '',
            province: quotation.province || '',
            postalCode: quotation.postalCode || '',
          }
        })
        addressId = addr.id
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: OrderStatus.PENDING,
          country: orderCountry,
          subtotal,
          shippingCost: 0,
          discount: 0,
          total,
          notes: `Converted from Quotation REF: ${quotation.id.slice(-8).toUpperCase()}. Customer: ${quotation.name}${quotation.company ? ` (${quotation.company})` : ''}.`,
          items: {
            create: orderItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              price: i.price,
            })),
          },
          payment: {
            create: {
              method: PaymentMethod.CARD,
              status: PaymentStatus.PENDING,
              amount: total,
            },
          },
        },
        include: {
          items: { include: { product: { select: { name: true } } } },
          payment: true,
        },
      })

      // Mark quotation as CONVERTED
      await tx.quotation.update({
        where: { id },
        data: { status: QuotationStatus.CONVERTED },
      })

      // Decrement stock for each variant
      for (const item of orderItems) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          })
          if (!variant || variant.stock < item.quantity) {
            throw new Error('INSUFFICIENT_STOCK')
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return newOrder
    })

    // Send confirmation email to customer
    const refNo = quotation.id.slice(-8).toUpperCase()
    const itemsHtml = orderItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId)
        return `<tr>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px;">${product?.name || 'Product'}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${currencyLabel} ${item.price.toLocaleString(locale)}</td>
          <td style="padding:8px 4px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:bold;">${currencyLabel} ${(item.price * item.quantity).toLocaleString(locale)}</td>
        </tr>`
      })
      .join('')

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'calnza.com'
    const baseUrl = rawAppUrl.startsWith('http') 
      ? rawAppUrl.replace(/\/$/, '') 
      : (rawAppUrl.includes('localhost') ? `http://${rawAppUrl}` : `https://${rawAppUrl}`)
    const token = generatePaymentToken(order.id)
    const paymentUrl = `${baseUrl}/checkout/payment/${order.id}?token=${token}`

    const emailHtml = `
      <div style="font-family:Georgia,serif;color:#0a0a0a;max-width:620px;margin:0 auto;padding:32px 24px;">
        <div style="border-bottom:2px solid #0a0a0a;padding-bottom:16px;margin-bottom:28px;">
          <h1 style="font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;">CALNZA</h1>
          <p style="font-size:10px;letter-spacing:2px;color:#666;margin:4px 0 0;">PREMIUM APPAREL &amp; ACCESSORIES</p>
        </div>

        <h2 style="font-size:18px;font-weight:bold;margin-bottom:8px;">Quotation Approved &amp; Ready for Payment</h2>
        <p style="font-size:14px;color:#444;line-height:1.7;margin-bottom:24px;">
          Dear ${quotation.name},<br/><br/>
          Your quotation (REF: <strong>${refNo}</strong>) has been approved and converted to a pending order.
          Please click the link below to securely complete your payment online using your Credit or Debit Card.
        </p>

        <div style="background:#f9f9f9;border:1px solid #eee;padding:20px;margin-bottom:24px;">
          <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin:0 0 4px;">Order Number</p>
          <p style="font-size:16px;font-weight:bold;font-family:monospace;margin:0;">${orderNumber}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#0a0a0a;color:#fff;">
              <th style="padding:10px 4px;text-align:left;font-size:11px;letter-spacing:1px;">Product</th>
              <th style="padding:10px 4px;text-align:center;font-size:11px;letter-spacing:1px;">Qty</th>
              <th style="padding:10px 4px;text-align:right;font-size:11px;letter-spacing:1px;">Unit Price</th>
              <th style="padding:10px 4px;text-align:right;font-size:11px;letter-spacing:1px;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr style="background:#0a0a0a;color:#fff;">
              <td colspan="3" style="padding:10px 4px;font-size:13px;font-weight:bold;letter-spacing:1px;">GRAND TOTAL</td>
              <td style="padding:10px 4px;text-align:right;font-size:14px;font-weight:bold;">${currencyLabel} ${total.toLocaleString(locale)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="text-align: center; margin: 36px 0;">
          <a href="${paymentUrl}" style="background-color: #000000; color: #ffffff; padding: 16px 36px; font-family: monospace; font-size: 13px; font-weight: bold; text-decoration: none; letter-spacing: 2px; text-transform: uppercase; border-radius: 4px; display: inline-block;">
            Complete Your Payment
          </a>
        </div>

        <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin:0;text-align:center;">
          🔒 Payments are fully encrypted and processed securely by Stripe.<br/>
          If you have any questions, reply to this email or contact us at ${process.env.RESEND_FROM_EMAIL || 'concierge@calnza.pk'}.
        </p>
      </div>
    `

    await sendEmail({
      to: quotation.email,
      subject: `Order Confirmed — ${orderNumber} | Calnza`,
      html: emailHtml,
      type: 'quotation_converted',
      userId: quotation.userId ?? undefined,
    })

    logger.info('[QUOTATION_CONVERT] Converted to order', {
      quotationId: id,
      orderId: order.id,
      orderNumber,
      email: quotation.email,
    })

    return NextResponse.json({
      success: true,
      data: { order, quotationStatus: 'CONVERTED' },
      message: `Order ${orderNumber} created successfully. Email sent to ${quotation.email}.`,
    })
  } catch (error: any) {
    logger.error('[QUOTATION_CONVERT_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to convert quotation to order' },
      { status: 500 }
    )
  }
}
