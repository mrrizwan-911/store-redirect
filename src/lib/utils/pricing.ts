/**
 * Price helpers for multi-country products.
 * All storefront components should use these functions instead of reading
 * `basePrice` / `salePrice` directly.
 */

export type CountryCode = 'PK' | 'UK'

export function normalizePricingCountry(country?: string | null): CountryCode {
  return country === 'UK' ? 'UK' : 'PK'
}

export function getProductPrice(product: any, country: CountryCode) {
  if (!product) return { price: 0, salePrice: null }

  const currentSalePrice =
    country === 'PK' ? product.salePricePK : product.salePriceUK
  const currentPrice =
    country === 'PK' ? product.pricePK : product.priceUK

  return {
    price: Number(currentPrice || 0),
    salePrice: currentSalePrice != null ? Number(currentSalePrice) : null,
  }
}

export function getVariantPrice(variant: any, country: CountryCode) {
  if (!variant) return { price: null, salePrice: null }

  // Variant-specific prices take priority, then fallback to product-level prices
  const variantPrice =
    country === 'PK' ? variant.pricePK : variant.priceUK

  return {
    price: variantPrice != null ? Number(variantPrice) : null,
  }
}

export function getLineItemPrice({
  product,
  variant,
  country,
}: {
  product: any
  variant?: any | null
  country: CountryCode
}): number {
  const variantPrice = variant ? getVariantPrice(variant, country).price : null
  if (variantPrice != null) return variantPrice
  return getDisplayPrice(product, country).currentPrice
}

export function getDisplayPrice(product: any, country: CountryCode) {
  const { price, salePrice } = getProductPrice(product, country)

  return {
    currentPrice: salePrice ?? price,
    originalPrice: price,
    isOnSale: salePrice != null && salePrice < price,
    discount:
      salePrice != null && price > 0 ? Math.round(((price - salePrice) / price) * 100) : 0,
  }
}

/**
 * Calculates discount amount given type (PERCENTAGE or FLAT), value, and base price.
 * For PERCENTAGE: returns basePrice * value / 100
 * For FLAT: returns min(value, basePrice)
 */
export function calculateDiscount({
  type,
  value,
  basePrice,
}: {
  type: 'PERCENTAGE' | 'FLAT'
  value: number
  basePrice: number
}): number {
  if (type === 'PERCENTAGE') return Math.round((basePrice * value) / 100)
  return Math.min(value, basePrice)
}

export function formatPrice(amount: number | null, country: CountryCode) {
  if (amount == null) return ''

  if (country === 'PK') {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount)
}
