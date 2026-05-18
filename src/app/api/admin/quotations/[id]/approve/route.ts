import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { generateQuotationPDF, buildBrandConfig, loadLogoBase64 } from '@/lib/services/pdf/generator'
import { sendEmail } from '@/lib/services/email/sender'
import { generateQuotationPdfToken } from '@/lib/utils/quotationToken'
import { logger } from '@/lib/utils/logger'
import { QuotationStatus } from '@prisma/client'

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

    // ── Enrich items ──────────────────────────────────────────────────────
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

    // ── Generate PDF (validate it renders OK) ────────────────────────────
    const brand = buildBrandConfig(settings, loadLogoBase64())
    generateQuotationPDF({ ...quotation, items: enrichedItems }, brand) // throws if broken

    // ── Build secure PDF download URL (works in dev + production) ─────────
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const pdfToken = generateQuotationPdfToken(id)
    const pdfUrl = `${appUrl}/api/quotations/${id}/pdf?token=${pdfToken}`

    const refNo = id.slice(-8).toUpperCase()
    const aiDraft = quotation.aiDraft || 'Please find your formal quotation via the link below.'

    // ── Build email body ──────────────────────────────────────────────────
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
        <div style="text-align:center;margin:32px 0;">
          <a href="${pdfUrl}"
             style="background-color:#0a0a0a;color:#ffffff;padding:16px 36px;font-family:monospace;font-size:12px;font-weight:bold;text-decoration:none;letter-spacing:2px;text-transform:uppercase;display:inline-block;">
            &#8595; Download Your Quotation PDF
          </a>
        </div>
        <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin:0;">
          If the button does not work, copy and paste this link into your browser:<br/>
          <a href="${pdfUrl}" style="color:#0a0a0a;word-break:break-all;font-size:11px;">${pdfUrl}</a>
        </p>
        <p style="font-size:12px;color:#888;margin-top:12px;">
          This link is valid for 30 days. If you have any questions, please reply to this email.
        </p>
      </div>
    `

    // ── Send email (no attachment — PDF is linked) ────────────────────────
    const sent = await sendEmail({
      to: quotation.email,
      subject: `Your Quotation from ${brand.name} — REF: ${refNo}`,
      html: emailHtml,
      type: 'quotation_approval',
      userId: quotation.userId ?? undefined,
    })

    if (!sent) throw new Error('Failed to send quotation email')

    // ── Update quotation status + store PDF URL ───────────────────────────
    const updated = await db.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.SENT,
        pdfUrl,
      },
    })

    logger.info('[QUOTATION_APPROVE] sent', { id, email: quotation.email, pdfUrl })
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    logger.error('[QUOTATION_APPROVE_ERROR]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve quotation' },
      { status: 500 }
    )
  }
}
