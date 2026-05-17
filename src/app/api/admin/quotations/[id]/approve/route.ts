import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { generateQuotationPDF, buildBrandConfig } from '@/lib/services/pdf/generator'
import { sendEmail } from '@/lib/services/email/sender'
import { logger } from '@/lib/utils/logger'
import { QuotationStatus } from '@prisma/client'
import path from 'path'
import fs from 'fs'

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { id } = await context.params

    const [quotation, settings] = await Promise.all([
      db.quotation.findUnique({ where: { id }, include: { user: true } }),
      db.siteSettings.findFirst().catch(() => null),
    ])

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 })
    }

    // Enrich items
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

    const aiDraft = quotation.aiDraft || 'Please find the formal quotation attached.'
    const refNo = id.slice(-8).toUpperCase()

    const emailHtml = `
      <div style="font-family:Georgia,serif;color:#0a0a0a;max-width:620px;margin:0 auto;padding:32px 24px;">
        <div style="border-bottom:2px solid #0a0a0a;padding-bottom:16px;margin-bottom:28px;">
          <h1 style="font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;">${brand.name}</h1>
          <p style="font-size:10px;letter-spacing:2px;color:#666;margin:4px 0 0;">${brand.tagline}</p>
        </div>
        <div style="white-space:pre-wrap;line-height:1.8;font-size:14px;color:#1a1a1a;margin-bottom:32px;">
          ${aiDraft.replace(/\n/g, '<br/>')}
        </div>
        <div style="background:#fafafa;border:1px solid #e5e5e5;padding:16px 20px;margin-bottom:28px;">
          <p style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin:0 0 6px;">Reference</p>
          <p style="font-size:14px;font-weight:bold;font-family:monospace;margin:0;">${refNo}</p>
        </div>
        <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin:0;">
          The formal quotation is attached as a PDF. If you have any questions, please reply to this email.
        </p>
      </div>
    `

    const sent = await sendEmail({
      to: quotation.email,
      subject: `Your Quotation from ${brand.name} — REF: ${refNo}`,
      html: emailHtml,
      type: 'quotation_approval',
      userId: quotation.userId ?? undefined,
      attachments: [
        { filename: `Calnza-Quotation-${refNo}.pdf`, content: pdfBuffer },
      ],
    })

    if (!sent) throw new Error('Failed to send quotation email')

    const updated = await db.quotation.update({
      where: { id },
      data: { status: QuotationStatus.SENT },
    })

    logger.info('[QUOTATION_APPROVE] sent', { id, email: quotation.email })
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('[QUOTATION_APPROVE_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve quotation' },
      { status: 500 }
    )
  }
}
