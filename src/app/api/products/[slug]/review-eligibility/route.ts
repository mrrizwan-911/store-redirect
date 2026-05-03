import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const session = await getUserSession()

    if (!session) {
      return NextResponse.json({ eligible: false, alreadyReviewed: false })
    }

    const userId = session.userId

    const product = await db.product.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // 1. Check if user already reviewed
    const existingReview = await db.review.findFirst({
      where: { productId: product.id, userId },
    })

    if (existingReview) {
      return NextResponse.json({ eligible: false, alreadyReviewed: true })
    }

    // 2. Check if user has a DELIVERED order for this product
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId, status: 'DELIVERED' },
      },
    })

    return NextResponse.json({
      eligible: !!hasPurchased,
      alreadyReviewed: false
    })
  } catch (error) {
    logger.error('[GET /api/products/[slug]/review-eligibility]', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
