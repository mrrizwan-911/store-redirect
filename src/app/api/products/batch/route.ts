import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, error: 'Invalid IDs' }, { status: 400 })
    }

    const products = await db.product.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 2 },
        category: { select: { name: true } },
        variants: { select: { stock: true } },
        reviews: { select: { rating: true } },
      },
    })

    // Map to match ProductCard props and maintain order from ids array
    const mappedProducts = ids.map(id => {
      const p = products.find(prod => prod.id === id)
      if (!p) return null

      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
      const avgRating = p.reviews.length
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : undefined
      const primaryImage = p.images.find((i) => i.isPrimary) || p.images[0]
      const secondaryImage = p.images.find((i) => !i.isPrimary && i !== primaryImage)

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: primaryImage?.url ?? '/placeholder.png',
        secondaryImageUrl: secondaryImage?.url,
        price: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : undefined,
        category: p.category.name,
        sku: p.sku,
        description: p.description,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
        reviewCount: p.reviews.length,
        isBadgeSale: !!p.salePrice,
        isLowStock: totalStock > 0 && totalStock <= 5,
        stockCount: totalStock,
      }
    }).filter(p => p !== null)

    return NextResponse.json({ success: true, data: mappedProducts })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
