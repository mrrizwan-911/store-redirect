import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/utils/adminAuth";
import { generateQuotationPDF } from "@/lib/services/pdf/generator";
import { generateQuotationDraft } from "@/lib/services/ai/quotation-draft";
import { sendEmail } from "@/lib/services/email/sender";
import { logger } from "@/lib/utils/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Admin Authorization
  const adminCheck = await requireAdmin(req);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { id } = await params;

  try {
    // 2. Fetch Quotation
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!quotation) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }

    // 3. Generate AI Cover Letter (Email Body)
    const emailBody = await generateQuotationDraft(quotation);

    // 4. Generate PDF Buffer
    const pdfBuffer = generateQuotationPDF(quotation);

    // 5. Send Email with Attachment
    const emailSent = await sendEmail({
      to: quotation.email,
      subject: `Quotation for Bulk Order - ${quotation.company || 'Calnza'}`,
      html: `<div style="font-family: serif; white-space: pre-wrap; line-height: 1.6; color: #1a1a1a;">${emailBody}</div>`,
      text: emailBody,
      type: 'QUOTATION_SENT',
      userId: quotation.userId || undefined,
      attachments: [
        {
          filename: `Quotation_${id.slice(-6)}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    if (!emailSent) {
      throw new Error("Failed to send email");
    }

    // 6. Update Quotation Status
    await db.quotation.update({
      where: { id },
      data: {
        status: 'SENT',
        aiDraft: emailBody // Save the sent draft
      }
    });

    logger.info('Quotation PDF sent successfully', { quotationId: id, email: quotation.email });

    return NextResponse.json({
      success: true,
      message: "Quotation sent successfully to " + quotation.email
    });

  } catch (error) {
    logger.error('Failed to send quotation PDF', error, { quotationId: id });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
