'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CircleCheck, ArrowRight, ShieldCheck, CreditCard, ChevronRight, ShoppingBag, Loader2 } from 'lucide-react'
import { StripePayment } from '@/components/store/checkout/payments/StripePayment'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  shippingCost: number
  discount: number
  createdAt: string
  address: {
    firstName: string
    lastName: string
    line1: string
    line2?: string | null
    city: string
    province?: string
    postalCode?: string
    country: string
    phone?: string
  } | null
  payment: {
    method: string
    status: string
    amount: number
  } | null
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
      slug: string
      image: string | null
    }
    variant: {
      title: string
    } | null
  }>
}

export default function B2BPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txRef, setTxRef] = useState<string>('')

  useEffect(() => {
    async function fetchOrder() {
      try {
        const url = token ? `/api/orders/${orderId}/payment-details?token=${token}` : `/api/orders/${orderId}/payment-details`
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || 'Order details not found')
        
        setOrder(data.data)
        
        // If order already paid, skip to success screen
        if (data.data.payment?.status === 'COMPLETED') {
          setIsSuccess(true)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (orderId) fetchOrder()
  }, [orderId])

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsConfirming(true)
    try {
      const res = await fetch('/api/payments/stripe/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          stripePaymentIntentId: paymentIntentId,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment details. Please contact concierge support.')
      }

      setTxRef(paymentIntentId)
      setIsSuccess(true)
      toast.success('Your order payment is verified!')
    } catch (err: any) {
      toast.error(err.message || 'Payment confirmation error')
    } finally {
      setIsConfirming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50/50">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs tracking-[0.2em] text-neutral-400 uppercase font-bold">Verifying details...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4 bg-neutral-50/50">
        <div className="max-w-md bg-white border border-neutral-200 rounded-[var(--radius)] p-8 shadow-sm">
          <h1 className="text-xl font-bold mb-2 text-black">Payment Portal Error</h1>
          <p className="text-neutral-500 text-sm mb-6">{error || 'Unable to fetch secure order context.'}</p>
          <Link href="/" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors rounded-full block">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (isConfirming) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50/50">
        <Loader2 className="w-12 h-12 text-black animate-spin mb-4 stroke-[1.5]" />
        <h2 className="text-sm font-bold text-black uppercase tracking-widest">Securing Transaction</h2>
        <p className="text-xs text-neutral-400 mt-2">Recording payment and notifying packing team...</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-neutral-50/50 pt-24 pb-16 flex items-center">
        <div className="max-w-md mx-auto px-4 w-full">
          <div className="bg-white border border-neutral-200 rounded-[var(--radius)] p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CircleCheck className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-black">Payment Successful</h1>
            <p className="text-neutral-500 text-sm mb-6">
              Your payment has been received and verified. The packing department has been notified to prepare your shipment.
            </p>

            <div className="bg-neutral-50 rounded-[var(--radius)] p-4 text-left text-xs space-y-2 mb-6 border border-neutral-100 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-400">Order Number:</span>
                <span className="font-bold text-black">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Charged:</span>
                <span className="font-bold text-black">{formatPrice(order.total)}</span>
              </div>
              {txRef && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Stripe ID:</span>
                  <span className="font-bold text-black truncate max-w-[180px]">{txRef}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Link
                href="/"
                className="w-full text-center bg-black text-white h-12 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50/30 pt-28 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-8 uppercase tracking-widest">
          <span>Checkout</span>
          <ChevronRight className="w-3. h-3" />
          <span className="text-black font-bold">Secure Card Payment</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column — Stripe Form */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-[var(--radius)] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-neutral-100 pb-4">
              <div className="p-2 bg-neutral-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-black uppercase tracking-wider">Credit or Debit Card</h2>
                <p className="text-[11px] text-neutral-400">Fully encrypted checkout secured by Stripe</p>
              </div>
            </div>

            {/* Standard Stripe Checkout Form */}
            <div className="mt-4">
              <StripePayment
                orderId={order.id}
                total={order.total}
                token={token || undefined}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => toast.error(msg)}
              />
            </div>

            {/* Secure Badging */}
            <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-neutral-500" />
                <span>SSL Encryption Enabled</span>
              </div>
              <span>Calnza Gateway v2.4</span>
            </div>
          </div>

          {/* Right Column — Summary Block */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-[var(--radius)] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-neutral-100 pb-3">
                <ShoppingBag className="w-4 h-4 text-black" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-black">Order Breakdown</h3>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-xs border-b border-neutral-50 pb-3 last:border-b-0 last:pb-0">
                    {item.product.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded bg-neutral-100 shrink-0 border border-neutral-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-black truncate">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">{item.variant.title}</p>
                      )}
                      <p className="text-[10px] text-neutral-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-black">{formatPrice(item.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price list */}
              <div className="border-t border-neutral-100 pt-4 mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Shipping Cost</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-neutral-100 pt-3 flex justify-between font-extrabold text-sm text-black">
                  <span>Grand Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Customer Details Display */}
            {order.address && (
              <div className="bg-white border border-neutral-200 rounded-[var(--radius)] p-6 shadow-sm text-xs space-y-2">
                <h4 className="font-bold text-black uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-neutral-100">
                  Shipping Destination
                </h4>
                <div className="text-neutral-600 leading-relaxed space-y-0.5">
                  <p className="font-bold text-black">{order.address.firstName} {order.address.lastName}</p>
                  <p>{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{order.address.city}, {order.address.province || ''} {order.address.postalCode || ''}</p>
                  <p className="uppercase tracking-widest text-[10px] font-bold text-neutral-400 mt-1">{order.address.country}</p>
                  {order.address.phone && <p className="text-neutral-400 mt-1">📞 {order.address.phone}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
