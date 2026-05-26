import { db } from '@/lib/db/client'
import { OutfitDetail } from '@/components/store/OutfitDetail'
import { notFound } from 'next/navigation'
import { getValidatedPrice } from '@/lib/services/payment/priceValidator'
import { SITE_COUNTRY } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

export default async function SingleOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let outfit: any = null

  try {
    outfit = await db.outfit.findUnique({
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
                pricePK: true,
                priceUK: true,
                salePricePK: true,
                salePriceUK: true,
                images: true,
                description: true,
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
  } catch (err) {
    console.warn('[SingleOutfitPage] DB unavailable:', err)
  }

  if (!outfit || !outfit.isPublished) {
    notFound()
  }

  const itemCount = outfit.items.length

  // Calculate prices using validated prices (accounting for flash sales)
  let itemPrices: number[] = outfit.items.map(() => 0)
  try {
    itemPrices = await Promise.all(
      outfit.items.map((item: any) => getValidatedPrice(item.product.id))
    )
  } catch (err) {
    console.warn('[SingleOutfitPage] price validation DB error:', err)
  }

  const totalPrice = itemPrices.reduce((sum, price) => sum + price, 0)

  const isUK = SITE_COUNTRY === 'UK'

  const mappedOutfit = {
    ...outfit,
    items: outfit.items.map((item, index) => {
      const currentPrice = isUK ? Number(item.product.priceUK) : Number(item.product.pricePK)
      const currentSalePrice = isUK
        ? (item.product.salePriceUK ? Number(item.product.salePriceUK) : null)
        : (item.product.salePricePK ? Number(item.product.salePricePK) : null)
      return {
        ...item,
        product: {
          ...item.product,
          basePrice: currentPrice,
          // Use the validated price as the sale price if it's lower than base
          salePrice: itemPrices[index] < currentPrice ? itemPrices[index] : currentSalePrice,
        }
      }
    }),
    itemCount,
    totalPrice
  }

  return <OutfitDetail outfit={mappedOutfit} />
}
