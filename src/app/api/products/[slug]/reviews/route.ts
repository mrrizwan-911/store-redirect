import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { reviewSchema } from '@/lib/validations/products'
import { logger } from '@/lib/utils/logger'
import { awardPoints } from '@/lib/services/loyalty/award'
import { analyzeSentiment } from '@/lib/services/ai/sentiment'
import { stripHtml } from '@/lib/utils/sanitize'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let userId: string
  try {
    const payload = verifyAccessToken(token)
    userId = payload.userId
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
  }

  try {
    const product = await db.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const existingReview = await db.review.findFirst({
      where: { productId: product.id, userId },
    })

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 409 }
      )
    }

    const body = await req.json()
    logger.request('POST /api/products/[slug]/reviews', { slug, userId, body })
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const sanitizedBody = stripHtml(parsed.data.body)
    const sanitizedTitle = parsed.data.title ? stripHtml(parsed.data.title) : undefined

    // Check if user purchased this product
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId, status: 'DELIVERED' },
      },
    })

    if (!hasPurchased) {
      return NextResponse.json(
        { success: false, error: 'You can only review products you have purchased and received.' },
        { status: 403 }
      )
    }

    // AI Sentiment Analysis
    const sentiment = await analyzeSentiment(`${parsed.data.title} ${parsed.data.body}`)

    const review = await db.review.create({
      data: {
        productId: product.id,
        userId,
        rating: parsed.data.rating,
        title: sanitizedTitle,
        body: sanitizedBody,
        isVerified: !!hasPurchased,
        sentiment: sentiment,
      },
      include: { user: { select: { name: true } } },
    })

    // Award loyalty points for verified reviews
    if (hasPurchased) {
      await awardPoints(userId, 5, `Review for ${product.name}`, 'REVIEW')
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    logger.error('[POST /api/products/[slug]/reviews]', error, { slug, userId })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
