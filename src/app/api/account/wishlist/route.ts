import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const wishlist = await db.wishlistItem.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: wishlist })
  } catch (error) {
    logger.error('[API_WISHLIST_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    const existing = await db.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.userId,
          productId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already in wishlist' })
    }

    const item = await db.wishlistItem.create({
      data: {
        userId: session.userId,
        productId
      }
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    logger.error('[API_WISHLIST_POST]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 })
    }

    await db.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: session.userId,
          productId
        }
      }
    })

    return NextResponse.json({ success: true, data: { productId } })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }
    logger.error('[API_WISHLIST_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
