import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { generateOrderInvoicePDF, buildBrandConfig, loadLogoBase64 } from '@/lib/services/pdf/generator'
import { logger } from '@/lib/utils/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { id } = await params

    const [order, settings] = await Promise.all([
      db.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
              variant: true,
            },
          },
          user: { select: { name: true, email: true, phone: true } },
          address: true,
          payment: true,
        },
      }),
      db.siteSettings.findFirst().catch(() => null),
    ])

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const brand = buildBrandConfig(settings, loadLogoBase64())
    const pdfBuffer = generateOrderInvoicePDF(order, brand)
    
    // Fallback if orderNumber is somehow missing
    const refNo = order.orderNumber || id.slice(-8).toUpperCase()

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${refNo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    logger.error('[ADMIN_ORDER_INVOICE_DOWNLOAD]', error)
    return NextResponse.json({ success: false, error: 'Failed to generate invoice PDF' }, { status: 500 })
  }
}
