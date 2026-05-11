'use client'

import { useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setCart } from '@/store/slices/cartSlice'
import { logger } from '@/lib/utils/logger'

export function useCartSync() {
  const dispatch = useAppDispatch()
  const { accessToken } = useAppSelector((state) => state.auth)
  const { items } = useAppSelector((state) => state.cart)

  const syncCart = useCallback(async () => {
    // Only sync if user is logged in
    if (!accessToken) return

    try {
      const res = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const result = await res.json()

      if (result.success && result.data) {
        // Dispatch the setCart action with items and subtotal from server
        // This ensures flash sale prices and correct subtotals are reflected in Redux
        dispatch(setCart({
          items: result.data.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.product.name,
            price: Number(item.variant?.price ?? item.product.basePrice),
            validatedPrice: item.validatedPrice,
            quantity: item.quantity,
            stock: item.variant?.stock ?? 0,
            imageUrl: item.product.images[0]?.url || '',
            variantTitle: item.variant?.title
          })),
          subtotal: result.data.subtotal
        }))
      }
    } catch (err: any) {
      logger.error('Failed to sync cart', { error: err.message })
    }
  }, [accessToken, dispatch])

  // Sync on mount and when token changes
  useEffect(() => {
    syncCart()
  }, [syncCart])

  return { syncCart }
}
