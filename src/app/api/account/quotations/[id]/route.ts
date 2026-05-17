import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const quotation = await db.quotation.findUnique({
      where: { id },
    })

    if (!quotation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // Authorisation: owner by userId OR matching email
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { email: true },
    })

    const isOwner =
      quotation.userId === session.userId ||
      (user?.email && quotation.email === user.email)

    if (!isOwner) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Enrich items with product names so the detail page can display them
    const rawItems = quotation.items as any[]
    const productIds = rawItems.map((i: any) => i.productId).filter(Boolean)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })

    const enrichedItems = rawItems.map((item: any) => ({
      ...item,
      productName: products.find((p) => p.id === item.productId)?.name || item.productName || 'Product',
    }))

    return NextResponse.json({
      success: true,
      data: { ...quotation, items: enrichedItems },
    })
  } catch (error) {
    logger.error('[API_ACCOUNT_QUOTATION_DETAIL]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
