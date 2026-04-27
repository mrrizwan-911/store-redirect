import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleWishlist } from '@/store/slices/wishlistSlice'

export function useWishlist(productId: string) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const isInWishlist = useAppSelector((state) =>
    state.wishlist.productIds.includes(productId)
  )

  async function toggle() {
    // Optimistic update — update Redux immediately
    dispatch(toggleWishlist(productId))

    // If logged in — sync to DB
    if (user) {
      const method = isInWishlist ? 'DELETE' : 'POST'
      const url = isInWishlist
        ? `/api/account/wishlist?productId=${productId}`
        : '/api/account/wishlist'

      const options: RequestInit = {
        method,
        ...(method === 'POST' && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        }),
      }

      try {
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error('Failed to sync wishlist')
        }
      } catch (error) {
        // If API fails — revert Redux
        dispatch(toggleWishlist(productId))
        console.error('Wishlist sync error:', error)
      }
    }
  }

  return { isInWishlist, toggle }
}
