import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { aiConfig } from '@/lib/services/ai/config'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/ai/quotation-guide
 *
 * Two modes:
 *  1. action="regenerate"  → generate a fresh email cover-letter draft
 *  2. action="chat"        → answer a contextual admin question about the quotation
 */
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  let body: any = {}
  try {
    body = await req.json()
    const { action, name, company, items, question, quotationId, currentStage, status, addressLine1, addressLine2, city, province, postalCode, country } = body

    const openai = aiConfig.getOpenAI()

    // ── Mode 1: Regenerate cover-letter draft ─────────────────────────────
    if (action === 'regenerate') {
      const itemsList = Array.isArray(items) ? items.join(', ') : String(items || 'various products')
      const addressStr = `${addressLine1 || ''}${addressLine2 ? ', ' + addressLine2 : ''}${city ? ', ' + city : ''}${province ? ', ' + province : ''}${postalCode ? ', ' + postalCode : ''}${country ? ', ' + country : ''}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content: 'You are a professional B2B sales representative for Calnza, a premium luxury apparel brand in Pakistan. Write concise, elegant, and persuasive cover letters for bulk order quotations.',
          },
          {
            role: 'user',
            content: `Generate a professional cover letter for a bulk order quotation.
Customer Name: ${name || 'Valued Customer'}
Company: ${company || 'N/A'}
Requested Items: ${itemsList}
Shipping Address: ${addressStr || 'N/A'}

Rules:
- Sophisticated, helpful, luxury-oriented tone
- Mention the detailed quotation is attached as a PDF
- IMPORTANT: Please explicitly state the shipping address mentioned above in the letter and ask the customer to confirm if this address is correct before we proceed with the order.
- Keep it under 250 words
- Do NOT use placeholders like [Your Name]
- Sign off as "Calnza Team"
- No subject line — body only`,
          },
        ],
      })

      const contentText = response.choices[0]?.message?.content
      if (!contentText) throw new Error('Unexpected AI response')

      return NextResponse.json({ success: true, draft: contentText })
    }

    // ── Mode 2: Guide chat ────────────────────────────────────────────────
    if (action === 'chat') {
      const itemsList = Array.isArray(items) ? items.join(', ') : String(items || 'unknown items')

      const systemPrompt = `You are a helpful assistant for an admin managing B2B quotations at Calnza, a premium Pakistani apparel brand.

Current quotation context:
- Customer: ${name || 'N/A'}
- Company: ${company || 'Individual'}
- Items: ${itemsList}
- Quotation ID: ${quotationId || 'N/A'}
- Status: ${status || 'PENDING'}
- Current stage: ${currentStage || 'review'}

Quotation workflow:
PENDING → Stage 1 (Review & set prices) → Stage 2 (Edit AI draft) → Stage 3 (Approve & Send PDF email) → SENT → Stage 4 (Track response) → ACCEPTED → CONVERTED to order.

Answer in 2-4 concise sentences. Be direct and practical. If asked "what to do next", give the exact next action step.`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question || 'What should I do next?' },
        ],
      })

      const contentText = response.choices[0]?.message?.content
      if (!contentText) throw new Error('Unexpected AI response')

      return NextResponse.json({ success: true, reply: contentText })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    logger.error('[AI_QUOTATION_GUIDE]', error)

    if (body?.action === 'regenerate') {
      const fallback = `Dear ${body.name || 'Valued Customer'},\n\nThank you for reaching out to Calnza. We are pleased to provide you with the bulk order quotation for ${body.company || 'your inquiry'}.\n\nPlease find the details in the attached PDF. Our team is available to discuss any specific requirements or customisations you may need.\n\nBest regards,\nCalnza Team`
      return NextResponse.json({ success: true, draft: fallback })
    }

    return NextResponse.json({
      success: true,
      reply: 'I\'m having trouble connecting right now. Please refer to the Guide tab for step-by-step instructions.',
    })
  }
}
