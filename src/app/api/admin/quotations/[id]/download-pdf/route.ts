import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { generateQuotationPDF, buildBrandConfig } from '@/lib/services/pdf/generator'
import { logger } from '@/lib/utils/logger'
import path from 'path'
import fs from 'fs'

/** Try logo.jpg first (user's file), then fallbacks */
function getLogoBase64(): string | undefined {
  const candidates = ['logo.jpg', 'logo.jpeg', 'logo.png', 'bgless-logo.png']
  for (const name of candidates) {
    try {
      const fp = path.join(process.cwd(), 'public', name)
      if (fs.existsSync(fp)) return fs.readFileSync(fp).toString('base64')
    } catch { /* skip */ }
  }
  return undefined
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { id } = await params

    const [quotation, settings] = await Promise.all([
      db.quotation.findUnique({ where: { id } }),
      db.siteSettings.findFirst().catch(() => null),
    ])

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const rawItems = quotation.items as any[]
    const productIds = rawItems.map((i: any) => i.productId).filter(Boolean)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, basePrice: true },
    })

    const enrichedItems = rawItems.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)
      return {
        ...item,
        productName: item.productName || product?.name || 'Custom Product',
        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : Number(product?.basePrice ?? 0),
        discountAmount: Number(item.discountAmount ?? 0),
      }
    })

    const brand = buildBrandConfig(settings, getLogoBase64())
    const pdfBuffer = generateQuotationPDF({ ...quotation, items: enrichedItems }, brand)
    const refNo = id.slice(-8).toUpperCase()

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Calnza-Quotation-${refNo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    logger.error('[ADMIN_QUOTATION_DOWNLOAD_PDF]', error)
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 })
  }
}
