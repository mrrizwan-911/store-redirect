'use client'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToWishlist } from '@/store/slices/wishlistSlice'

export function useWishlistSync() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  // PersistGate handles rehydration, but we can check if needed.
  // In our case, PersistGate is in ReduxProvider, so components under it
  // are rendered after rehydration.

  useEffect(() => {
    if (!user) return

    fetch('/api/account/wishlist')
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach((item: { productId: string }) => {
            dispatch(addToWishlist(item.productId))
          })
        }
      })
      .catch((error) => {
        console.error('Wishlist rehydration error:', error)
      })
  }, [user?.id, dispatch])
}
