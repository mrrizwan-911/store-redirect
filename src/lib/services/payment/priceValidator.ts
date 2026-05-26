import { db } from '@/lib/db/client'
import { SITE_COUNTRY } from '@/lib/constants/site'
import { getDisplayPrice, getLineItemPrice, normalizePricingCountry } from '@/lib/utils/pricing'

/**
 * Retrieves the currently active flash sale for a given product.
 * Returns the most recently created sale that is currently within its time window.
 * Bypasses `isActive` check to avoid race conditions with the cron job.
 */
export async function getActiveFlashSaleForProduct(productId: string, country = SITE_COUNTRY) {
  const now = new Date()
  const normalizedCountry = normalizePricingCountry(country)
  return db.flashSale.findFirst({
    where: {
      startTime: { lte: now },
      endTime: { gte: now },
      country: { in: [normalizedCountry, 'ALL'] },
      OR: [
        { scope: 'ALL' },
        { productIds: { has: productId } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Calculates the discounted price based on an active flash sale.
 */
export function calculateFlashSalePrice(basePrice: number, activeSale: any): number {
  if (activeSale.discountType === 'PERCENTAGE') {
    const discountPct = activeSale.discountPct || 0
    const discountFactor = 1 - discountPct / 100
    return Math.round(basePrice * discountFactor)
  } else if (activeSale.discountType === 'FLAT') {
    const discountFlat = Number(activeSale.discountFlat || 0)
    return Math.max(0, Math.round(basePrice - discountFlat))
  }
  return Math.round(basePrice)
}

/**
 * Validates the price of a single product, accounting for active flash sales.
 * Uses server-side UTC time to prevent client-side tampering.
 */
export async function getValidatedPrice(productId: string, country = SITE_COUNTRY): Promise<number> {
  const normalizedCountry = normalizePricingCountry(country)
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      pricePK: true,
      priceUK: true,
      salePricePK: true,
      salePriceUK: true,
      basePrice: true,
      salePrice: true,
    },
  })

  if (!product) {
    return null as any
  }

  const activeSale = await getActiveFlashSaleForProduct(productId, normalizedCountry)
  const displayPrice = getDisplayPrice(product, normalizedCountry)
  const basePrice = displayPrice.originalPrice || Number(product.basePrice)
  const salePrice = displayPrice.isOnSale ? displayPrice.currentPrice : (product.salePrice ? Number(product.salePrice) : null)

  if (activeSale) {
    return calculateFlashSalePrice(basePrice, activeSale)
  }

  // Return regular sale price if exists, otherwise base price
  return salePrice ?? basePrice
}

/**
 * Enriches a list of products with active flash sale information.
 * Useful for displaying flash sale prices and countdowns on ProductCards.
 */
export async function enrichProductsWithFlashSales<T extends { id: string; basePrice: any; salePrice?: any }>(
  products: T[],
  country = SITE_COUNTRY
): Promise<(T & { flashSalePrice?: number; flashSaleEndTime?: string })[]> {
  const now = new Date()
  const normalizedCountry = normalizePricingCountry(country)
  // Fetch all active sales that fall within the current time window, ignoring the cron-dependent 'isActive' field
  const activeFlashSales = await db.flashSale.findMany({
    where: {
      startTime: { lte: now },
      endTime: { gte: now },
      country: { in: [normalizedCountry, 'ALL'] },
    },
    orderBy: { createdAt: 'desc' }
  })

  if (activeFlashSales.length === 0) return products

  return products.map(product => {
    // Check if the product falls under any active sale (either targeted or site-wide)
    const activeSale = activeFlashSales.find(sale =>
      sale.scope === 'ALL' || sale.productIds.includes(product.id)
    )

    if (!activeSale) return product

    const base = getDisplayPrice(product, normalizedCountry).currentPrice || Number(product.basePrice)
    const flashSalePrice = calculateFlashSalePrice(base, activeSale)

    return {
      ...product,
      flashSalePrice,
      flashSaleEndTime: activeSale.endTime.toISOString()
    }
  })
}

/**
 * Validates the total for a list of cart items.
 * Accounts for variant price overrides and flash sales.
 */
export async function getValidatedCartTotal(
  items: { productId: string; variantId?: string | null; quantity: number }[],
  country = SITE_COUNTRY
): Promise<{
  subtotal: number
  lineItems: {
    productId: string
    variantId?: string | null
    validatedPrice: number
    quantity: number
  }[]
}> {
    const lineItems = await Promise.all(
      items.map(async (item) => {
        let unitPrice: number

        const normalizedCountry = normalizePricingCountry(country)
        if (item.variantId) {
          const variant = await db.productVariant.findUnique({
            where: { id: item.variantId },
            select: { price: true, pricePK: true, priceUK: true, stock: true },
          })

          if (!variant) return null as any

          if (variant.stock < 1) {
            throw Object.assign(new Error('OUT_OF_STOCK'), { variantId: item.variantId, status: 400 })
          }

          const product = await db.product.findUnique({
            where: { id: item.productId },
            select: { pricePK: true, priceUK: true, salePricePK: true, salePriceUK: true, basePrice: true, salePrice: true },
          })
          if (!product) return null as any

          const baseVariantPrice = getLineItemPrice({ product, variant, country: normalizedCountry })
          const activeSale = await getActiveFlashSaleForProduct(item.productId, normalizedCountry)
          unitPrice = activeSale ? calculateFlashSalePrice(baseVariantPrice, activeSale) : baseVariantPrice
        } else {
          unitPrice = await getValidatedPrice(item.productId, normalizedCountry)
        }

        if (unitPrice === null) {
          throw Object.assign(new Error('STALE_CART_ITEM'), { productId: item.productId, status: 400 })
        }

        return {
          productId: item.productId,
          variantId: item.variantId,
          validatedPrice: unitPrice,
          quantity: item.quantity,
        }
      })
    )

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.validatedPrice * item.quantity,
    0
  )

  // Round subtotal to 2 decimal places to be safe
  const roundedSubtotal = Math.round(subtotal * 100) / 100

  return { subtotal: roundedSubtotal, lineItems }
}
