'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  shippingCost: number
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: { name: string; slug: string }
    variant: { title: string }
  }>
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/confirmation/${orderId}`)
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || 'Order not found')
        setOrder(data.data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (orderId) fetchOrder()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <p className="text-neutral-500 mb-6">{error}</p>
          <Link href="/" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-widest font-bold">
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-12">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold tracking-tight mb-2">Order Confirmed</h1>
          <p className="text-neutral-500 text-sm">
            Thank you for your order. We'll notify you when it ships.
          </p>
          <p className="text-xs uppercase tracking-widest font-bold text-neutral-400 mt-4">
            Order #{order.orderNumber}
          </p>
        </div>

        <div className="border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-neutral-400 text-xs">{item.variant.title} × {item.quantity}</p>
                </div>
                <p className="font-bold">PKR {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-100 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span>PKR {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span>PKR {order.shippingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>PKR {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 text-center border border-black text-black px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/auth/register"
            className="flex-1 text-center bg-black text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
          >
            Create Account <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-center text-xs text-neutral-400 mt-4">
          Create an account with this email to track all your orders.
        </p>
      </div>
    </main>
  )
}
