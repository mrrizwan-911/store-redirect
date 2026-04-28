import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { generateQuotationPDF } from '@/lib/services/pdf/generator'
import { sendEmail } from '@/lib/services/email/sender'
import { generateQuotationDraft } from '@/lib/services/ai/quotation-draft'
import { logger } from '@/lib/utils/logger'
import { QuotationStatus } from '@prisma/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getUserSession } from '@/lib/auth/session'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Enhanced Auth for Tests: Check both Header and Session
  let isAdmin = false;
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
  const session = await getUserSession();

  if (authHeader) {
    try {
      const payload = verifyAccessToken(authHeader);
      if (payload.role === 'ADMIN') isAdmin = true;
    } catch (e) {}
  }

  if (!isAdmin && session?.role === 'ADMIN') {
    isAdmin = true;
  }

  if (!isAdmin) {
    const authResult = await requireAdmin(req)
    if (authResult instanceof NextResponse) return authResult
  }

  try {
    const { id } = await context.params

    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 })
    }

    // 1. Generate AI Cover Letter
    const aiDraft = await generateQuotationDraft(quotation)

    // 2. Generate PDF
    const pdfBuffer = generateQuotationPDF(quotation)

    // 3. Send Email with Attachment
    const emailSent = await sendEmail({
      to: quotation.email,
      subject: `Formal Quotation from Calnza — REF: ${id.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: serif; color: #0A0A0A; padding: 20px;">
          <h2 style="text-transform: uppercase; letter-spacing: 2px;">Calnza</h2>
          <div style="margin-top: 20px; line-height: 1.6; white-space: pre-wrap;">
            ${aiDraft}
          </div>
          <div style="margin-top: 30px; border-top: 1px solid #EEE; pt: 10px; font-size: 12px; color: #666;">
            Please find the formal quotation attached as a PDF.
          </div>
        </div>
      `,
      type: 'quotation_approval',
      userId: quotation.userId || undefined,
      attachments: [
        {
          filename: `Quotation-${id.slice(-8).toUpperCase()}.pdf`,
          content: pdfBuffer
        }
      ]
    })

    if (!emailSent) {
      throw new Error('Failed to send quotation email')
    }

    // 4. Update Quotation Status
    const updatedQuotation = await db.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.SENT,
        aiDraft: aiDraft
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedQuotation
    })

  } catch (error: any) {
    logger.error('[QUOTATION_APPROVE_ERROR]', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to approve quotation'
    }, { status: 500 })
  }
}
