import { CartPage } from '@/components/store/cart/CartPage'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Cart | Calnza',
  description: 'Review your cart items before checkout.',
}

export default function Page() {
  return <CartPage />
}
