import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { generateQuotationDraft } from '@/lib/services/ai/quotation-draft'
import { generateQuotationPDF, buildBrandConfig, loadLogoBase64 } from '@/lib/services/pdf/generator'
import { sendEmail } from '@/lib/services/email/sender'
import { generateQuotationPdfToken } from '@/lib/utils/quotationToken'
import { logger } from '@/lib/utils/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  const { id } = await params

  try {
    const [quotation, settings] = await Promise.all([
      db.quotation.findUnique({ where: { id }, include: { user: true } }),
      db.siteSettings.findFirst().catch(() => null),
    ])

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 })
    }

    // Generate AI cover letter
    const emailBody = await generateQuotationDraft(quotation)

    // Validate PDF renders without error
    const brand = buildBrandConfig(settings, loadLogoBase64())
    generateQuotationPDF(quotation, brand)

    // Build secure PDF download URL (no attachment — works everywhere)
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const pdfToken = generateQuotationPdfToken(id)
    const pdfUrl = `${appUrl}/api/quotations/${id}/pdf?token=${pdfToken}`

    const refNo = id.slice(-8).toUpperCase()

    const emailSent = await sendEmail({
      to: quotation.email,
      subject: `Quotation for Bulk Order — ${quotation.company || brand.name} | REF: ${refNo}`,
      html: `
        <div style="font-family:Georgia,serif;color:#0a0a0a;max-width:620px;margin:0 auto;padding:32px 24px;">
          <div style="border-bottom:2px solid #0a0a0a;padding-bottom:16px;margin-bottom:28px;">
            <h1 style="font-size:22px;letter-spacing:3px;text-transform:uppercase;margin:0;">${brand.name}</h1>
            <p style="font-size:10px;letter-spacing:2px;color:#666;margin:4px 0 0;">${brand.tagline}</p>
          </div>
          <div style="white-space:pre-wrap;line-height:1.8;font-size:14px;color:#1a1a1a;margin-bottom:32px;">
            ${emailBody.replace(/\n/g, '<br/>')}
          </div>
          <div style="text-align:center;margin:32px 0;">
            <a href="${pdfUrl}"
               style="background-color:#0a0a0a;color:#ffffff;padding:16px 36px;font-family:monospace;font-size:12px;font-weight:bold;text-decoration:none;letter-spacing:2px;text-transform:uppercase;display:inline-block;">
              &#8595; Download Your Quotation PDF
            </a>
          </div>
          <p style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:16px;margin:0;">
            If the button does not work, paste this link in your browser:<br/>
            <a href="${pdfUrl}" style="color:#0a0a0a;word-break:break-all;font-size:11px;">${pdfUrl}</a>
          </p>
          <p style="font-size:12px;color:#888;margin-top:12px;">
            This link is valid for 30 days. Reply to this email for any questions.
          </p>
        </div>
      `,
      text: emailBody,
      type: 'QUOTATION_SENT',
      userId: quotation.userId || undefined,
    })

    if (!emailSent) {
      throw new Error('Failed to send email')
    }

    await db.quotation.update({
      where: { id },
      data: {
        status: 'SENT',
        aiDraft: emailBody,
        pdfUrl,
      },
    })

    logger.info('Quotation PDF link sent successfully', { quotationId: id, email: quotation.email })

    return NextResponse.json({
      success: true,
      message: 'Quotation sent successfully to ' + quotation.email,
    })
  } catch (error) {
    logger.error('Failed to send quotation PDF', error, { quotationId: id })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
