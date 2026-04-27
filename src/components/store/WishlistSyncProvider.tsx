'use client'

import { useWishlistSync } from '@/hooks/useWishlistSync'

export function WishlistSyncProvider({ children }: { children: React.ReactNode }) {
  useWishlistSync()
  return <>{children}</>
}
