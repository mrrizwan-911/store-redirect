import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') return userId

    const { id: productId } = await context.params
    const body = await req.json()
    const { variants } = body

    if (!Array.isArray(variants)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    // Using transaction for bulk updates
    await db.$transaction(
      variants.map((v: any) =>
        db.productVariant.update({
          where: { id: v.id },
          data: {
            sku: v.sku,
            stock: v.stock,
            price: v.price === null || v.price === '' ? null : Number(v.price),
            pricePK: v.pricePK === null || v.pricePK === '' ? null : Number(v.pricePK),
            priceUK: v.priceUK === null || v.priceUK === '' ? null : Number(v.priceUK),
          },
        })
      )
    )

    logger.info('Bulk updated variants', { productId, variantCount: variants.length })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Failed to bulk update variants', { error: error.message })
    return NextResponse.json({ success: false, error: 'Failed to bulk update variants' }, { status: 500 })
  }
}
