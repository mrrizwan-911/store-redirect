import { Metadata } from 'next'
import { CheckoutClient } from '@/components/store/checkout/CheckoutClient'

export const metadata: Metadata = {
  title: 'Checkout | Calnza',
  description: 'Complete your purchase.',
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12">
      <CheckoutClient />
    </div>
  )
}