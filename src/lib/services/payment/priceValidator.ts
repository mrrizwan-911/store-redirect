import { db } from '@/lib/db/client'

/**
 * Retrieves the currently active flash sale for a given product.
 * Returns the most recently created sale that is currently within its time window.
 * Bypasses `isActive` check to avoid race conditions with the cron job.
 */
export async function getActiveFlashSaleForProduct(productId: string) {
  const now = new Date()
  return db.flashSale.findFirst({
    where: {
      startTime: { lte: now },
      endTime: { gte: now },
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
export async function getValidatedPrice(productId: string): Promise<number> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { basePrice: true, salePrice: true },
  })

  if (!product) {
    return null as any
  }

  const activeSale = await getActiveFlashSaleForProduct(productId)
  const basePrice = Number(product.basePrice)
  const salePrice = product.salePrice ? Number(product.salePrice) : null

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
  products: T[]
): Promise<(T & { flashSalePrice?: number; flashSaleEndTime?: string })[]> {
  const now = new Date()
  // Fetch all active sales that fall within the current time window, ignoring the cron-dependent 'isActive' field
  const activeFlashSales = await db.flashSale.findMany({
    where: {
      startTime: { lte: now },
      endTime: { gte: now },
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

    const flashSalePrice = calculateFlashSalePrice(Number(product.basePrice), activeSale)

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
  items: { productId: string; variantId?: string | null; quantity: number }[]
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

        if (item.variantId) {
          const variant = await db.productVariant.findUnique({
            where: { id: item.variantId },
            select: { price: true, stock: true },
          })

          if (!variant) return null as any

          if (variant.stock < 1) {
            throw Object.assign(new Error('OUT_OF_STOCK'), { variantId: item.variantId, status: 400 })
          }

          if (variant?.price) {
            // Variant price override exists
            const baseVariantPrice = Number(variant.price)

            // Fix: Use the unified helper which correctly checks 'ALL' scope and handles FLAT/PERCENTAGE
            const activeSale = await getActiveFlashSaleForProduct(item.productId)

            if (activeSale) {
              unitPrice = calculateFlashSalePrice(baseVariantPrice, activeSale)
            } else {
              unitPrice = baseVariantPrice
            }
          } else {
            // No variant override — use base product's validated price
            unitPrice = await getValidatedPrice(item.productId)
          }
        } else {
          unitPrice = await getValidatedPrice(item.productId)
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
