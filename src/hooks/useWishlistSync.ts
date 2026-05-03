'use client'
import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setWishlist } from '@/store/slices/wishlistSlice'

export function useWishlistSync() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const localProductIds = useAppSelector((state) => state.wishlist.productIds)
  const syncAttempted = useRef(false)

  useEffect(() => {
    // If not logged in, or we already synced for this session/mount, skip
    if (!user || syncAttempted.current) return

    async function syncWishlist() {
      try {
        // 1. Fetch current DB wishlist
        const response = await fetch('/api/account/wishlist')
        const result = await response.json()

        if (!result.success) return

        const dbProductIds = result.data.map((item: any) => item.productId)

        // 2. Identify local items NOT in DB
        const missingInDb = localProductIds.filter(id => !dbProductIds.includes(id))

        // 3. Push missing items to DB
        if (missingInDb.length > 0) {
          await Promise.all(
            missingInDb.map(productId =>
              fetch('/api/account/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
              })
            )
          )

          // Re-fetch to get complete combined list if we added items
          const freshRes = await fetch('/api/account/wishlist')
          const freshResult = await freshRes.json()
          if (freshResult.success) {
            dispatch(setWishlist(freshResult.data.map((item: any) => item.productId)))
          }
        } else {
          // No merge needed, just update Redux with DB state
          dispatch(setWishlist(dbProductIds))
        }

        syncAttempted.current = true
      } catch (error) {
        console.error('Wishlist sync error:', error)
      }
    }

    syncWishlist()
  }, [user?.id, dispatch, localProductIds])

  // Reset sync flag if user logs out
  useEffect(() => {
    if (!user) {
      syncAttempted.current = false
    }
  }, [user])
}
