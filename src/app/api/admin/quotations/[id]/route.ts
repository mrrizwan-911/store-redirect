import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'
import {
  quotationUpdateSchema,
  quotationPricingUpdateSchema,
} from '@/lib/validations/quotation'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin(req)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { id } = await params
    const body = await req.json()

    // ── Pricing update (items array with unitPrice / discountAmount) ──────────
    if (body.items !== undefined) {
      const parsed = quotationPricingUpdateSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: parsed.error.issues[0]?.message || 'Invalid pricing data' },
          { status: 400 }
        )
      }

      const quotation = await db.quotation.update({
        where: { id },
        data: { items: parsed.data.items as any },
      })

      return NextResponse.json({ success: true, data: quotation })
    }

    // ── General update (status / aiDraft / expiresAt) ─────────────────────────
    const parsed = quotationUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const quotation = await db.quotation.update({
      where: { id },
      data: {
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      },
    })

    return NextResponse.json({ success: true, data: quotation })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Quotation not found' },
        { status: 404 }
      )
    }
    logger.error('[ADMIN_QUOTATION_PATCH]', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
