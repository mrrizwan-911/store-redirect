import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'
import {
  generateQuotationPDF,
  buildBrandConfig,
  loadLogoBase64,
  DEFAULT_BRAND,
} from '@/lib/services/pdf/generator'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const quotation = await db.quotation.findUnique({ where: { id } })

    if (!quotation) {
      return new NextResponse('Quotation not found', { status: 404 })
    }

    // Ownership check: match by userId or by email
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    })

    const isOwner =
      quotation.userId === session.userId ||
      (user?.email && quotation.email === user.email)

    if (!isOwner) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Only allow PDF download once the quote has been sent or accepted
    if (!['SENT', 'ACCEPTED', 'CONVERTED'].includes(quotation.status)) {
      return new NextResponse(
        JSON.stringify({ error: 'PDF not yet available. It will be ready once your quotation is reviewed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Enrich items with product names
    const rawItems = quotation.items as any[]
    const productIds = rawItems.map((i: any) => i.productId).filter(Boolean)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })
    const enrichedItems = rawItems.map((item: any) => ({
      ...item,
      productName:
        item.productName ||
        products.find((p) => p.id === item.productId)?.name ||
        'Custom Product',
    }))

    // Load brand config
    const settings = await db.siteSettings.findFirst().catch(() => null)
    const logoBase64 = loadLogoBase64()
    const brand = settings ? buildBrandConfig(settings, logoBase64) : { ...DEFAULT_BRAND, logoBase64 }

    const enrichedQuotation = { ...quotation, items: enrichedItems }
    const pdfBuffer = generateQuotationPDF(enrichedQuotation, brand)

    const refId = quotation.id.slice(-8).toUpperCase()
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Calnza-Quotation-${refId}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('[ACCOUNT_QUOTATION_PDF]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
