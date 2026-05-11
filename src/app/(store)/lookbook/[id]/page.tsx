import { db } from '@/lib/db/client'
import { OutfitDetail } from '@/components/store/OutfitDetail'
import { notFound } from 'next/navigation'
import { getValidatedPrice } from '@/lib/services/payment/priceValidator'

export const dynamic = 'force-dynamic'

export default async function SingleOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const outfit = await db.outfit.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              images: true,
              description: true,
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!outfit || !outfit.isPublished) {
    notFound()
  }

  const itemCount = outfit.items.length

  // Calculate prices using validated prices (accounting for flash sales)
  const itemPrices = await Promise.all(
    outfit.items.map(item => getValidatedPrice(item.product.id))
  )

  const totalPrice = itemPrices.reduce((sum, price) => sum + price, 0)

  const mappedOutfit = {
    ...outfit,
    items: outfit.items.map((item, index) => ({
      ...item,
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice),
        // Use the validated price as the sale price if it's lower than base
        salePrice: itemPrices[index] < Number(item.product.basePrice) ? itemPrices[index] : (item.product.salePrice ? Number(item.product.salePrice) : null),
      }
    })),
    itemCount,
    totalPrice
  }

  return <OutfitDetail outfit={mappedOutfit} />
}
