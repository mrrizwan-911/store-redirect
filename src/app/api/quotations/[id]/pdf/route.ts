import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyQuotationPdfToken } from '@/lib/utils/quotationToken'
import { generateQuotationPDF, buildBrandConfig, loadLogoBase64 } from '@/lib/services/pdf/generator'

/**
 * GET /api/quotations/[id]/pdf?token=<signed-token>
 *
 * Generates the quotation PDF on-demand and streams it back.
 * No filesystem writes — works in Vercel serverless, Docker, etc.
 * Protected by a 30-day HMAC token so only the recipient can download.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const token = req.nextUrl.searchParams.get('token')

    // ── Auth: verify HMAC token ───────────────────────────────────────────
    const result = verifyQuotationPdfToken(id, token)
    if (!result.valid) {
      return NextResponse.json(
        { error: `Unauthorized: ${result.reason}` },
        { status: 401 }
      )
    }

    // ── Fetch quotation ───────────────────────────────────────────────────
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // ── Enrich items with product data ────────────────────────────────────
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

    // ── Fetch site settings for brand config ──────────────────────────────
    const settings = await db.siteSettings.findFirst().catch(() => null)
    const logoBase64 = loadLogoBase64()
    const brand = buildBrandConfig(settings, logoBase64)

    // ── Generate PDF in memory ────────────────────────────────────────────
    const pdfBuffer = generateQuotationPDF({ ...quotation, items: enrichedItems }, brand)

    const refNo = id.slice(-8).toUpperCase()

    // ── Stream PDF to client ──────────────────────────────────────────────
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Calnza-Quotation-${refNo}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('[QUOTATION_PDF_DOWNLOAD]', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
