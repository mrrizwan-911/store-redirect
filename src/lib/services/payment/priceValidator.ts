import { db } from '@/lib/db/client'

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
    throw new Error(`Product with ID ${productId} not found`)
  }

  const now = new Date()

  // Check for active flash sale
  const activeSale = await db.flashSale.findFirst({
    where: {
      isActive: true,
      startTime: { lte: now },
      endTime: { gte: now },
      productIds: { has: productId },
    },
  })

  const basePrice = Number(product.basePrice)
  const salePrice = product.salePrice ? Number(product.salePrice) : null

  if (activeSale) {
    // Apply flash sale discount to base price
    const discountFactor = 1 - activeSale.discountPct / 100
    return Math.round(basePrice * discountFactor * 100) / 100
  }

  // Return regular sale price if exists, otherwise base price
  return salePrice ?? basePrice
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
          select: { price: true },
        })

        if (variant?.price) {
          // Variant price override exists — use it (variants typically don't have flash sales)
          unitPrice = Number(variant.price)
        } else {
          // No variant override — use base product's validated price
          unitPrice = await getValidatedPrice(item.productId)
        }
      } else {
        unitPrice = await getValidatedPrice(item.productId)
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
