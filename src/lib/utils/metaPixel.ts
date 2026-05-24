/**
 * Global Meta Pixel helper for firing Standard Events.
 * Import and call these functions from client components.
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void
    _fbq: unknown
  }
}

/** Fire ViewContent when a product page is viewed */
export function fbViewContent(params: {
  content_name: string
  content_ids: string[]
  content_type: string
  value: number
  currency: string
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', params)
  }
}

/** Fire AddToCart when a user adds an item to the cart */
export function fbAddToCart(params: {
  content_name: string
  content_ids: string[]
  content_type: string
  value: number
  currency: string
  quantity: number
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', params)
  }
}

/** Fire Purchase on the order confirmation page */
export function fbPurchase(params: {
  value: number
  currency: string
  content_ids: string[]
  content_type: string
  num_items: number
}) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', params)
  }
}
