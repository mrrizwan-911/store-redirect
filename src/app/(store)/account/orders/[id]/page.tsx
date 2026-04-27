'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OrderDetail {
  id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  shippingCost: number
  discount: number
  trackingNumber: string | null
  carrier: string | null
  createdAt: string
  address: {
    label: string
    line1: string
    line2: string | null
    city: string
    province: string
    postalCode: string
  }
  payment: {
    method: string
    status: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
      slug: string
      images: Array<{ url: string }>
    }
    variant: {
      size: string | null
      color: string | null
    } | null
  }>
}

const statusSteps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        const res = await fetch(`/api/account/orders/${params.id}`)
        const result = await res.json()
        if (result.success) {
          setOrder(result.data)
        } else {
          toast.error('Order not found')
          router.push('/account/orders')
        }
      } catch (error) {
        toast.error('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrderDetail()
  }, [params.id, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const currentStepIndex = statusSteps.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const c = carrier.toUpperCase();
    if (c === 'TCS') return `https://www.tcsexpress.com/tracking/tracking-results?trackingNo=${trackingNumber}`;
    if (c.includes('LEOPARD')) return `https://www.leopardscourier.com/leopards-tracking?track-number=${trackingNumber}`;
    if (c === 'TRAX') return `https://trax.pk/tracking/?tracking_number=${trackingNumber}`;
    if (c === 'M&P' || c === 'MNP') return `https://www.mulphilog.com/tracking-details?tracking_number=${trackingNumber}`;
    return null;
  };

  const trackingUrl = order.carrier && order.trackingNumber ? getTrackingUrl(order.carrier, order.trackingNumber) : null;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 text-black">
      {/* Header & Back Action */}
      <div className="space-y-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3 h-3 stroke-[2.5]" /> Back to Orders
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Order Details</p>
            <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">#{order.orderNumber}</h1>
            <p className="text-xs text-neutral-600 font-medium uppercase tracking-widest">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-[12px] h-12 px-6 border-neutral-300 text-[10px] uppercase tracking-widest font-bold text-black hover:bg-black hover:text-white transition-all">
              Download Invoice
            </Button>
            <Button className="rounded-[12px] h-12 px-6 bg-[#25D366] text-white hover:bg-[#20bd5a] uppercase tracking-widest text-[10px] font-bold border-none flex items-center gap-2 shadow-lg shadow-green-500/20">
              <MessageCircle className="w-4 h-4 fill-current" /> Help on WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      {!isCancelled && (
        <Card className="rounded-[12px] border-neutral-200 shadow-none bg-neutral-50/50 overflow-hidden">
          <CardContent className="p-6 md:p-12 overflow-x-auto scrollbar-hide">
            <div className="relative flex justify-between min-w-[500px] md:min-w-0 px-4">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-[2px] bg-neutral-300 -z-0" />
              <div
                className="absolute top-5 left-0 h-[2px] bg-black transition-all duration-1000 -z-0 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              />

              {statusSteps.map((step, index) => {
                const isActive = index <= currentStepIndex
                const isCurrent = index === currentStepIndex

                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
                      isActive ? "bg-black border-black text-white" : "bg-white border-neutral-300 text-neutral-400",
                      isCurrent && "ring-4 ring-neutral-100"
                    )}>
                      {index < currentStepIndex ? (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      ) : index === 3 ? (
                        <Truck className="w-5 h-5 stroke-[2]" />
                      ) : (
                        <Package className="w-5 h-5 stroke-[2]" />
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest font-bold whitespace-nowrap",
                      isActive ? "text-black" : "text-neutral-500"
                    )}>
                      {step.toLowerCase()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 p-8 text-center rounded-[12px]">
          <p className="text-red-700 text-xs uppercase tracking-[0.2em] font-bold">This order was {order.status.toLowerCase()}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Items */}
        <div className="lg:col-span-8 space-y-8">
          <h3 className="font-display text-2xl border-b border-neutral-200 pb-4 text-black">Order Items</h3>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-6 flex gap-6">
                <div className="relative w-24 h-32 bg-neutral-50 flex-shrink-0 border border-neutral-100 rounded-[8px] overflow-hidden">
                  {item.product.images[0]?.url && (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <h4 className="text-[13px] uppercase tracking-widest font-bold text-black hover:text-neutral-700 transition-colors">
                      <Link href={`/products/${item.product.slug}`}>
                        {item.product.name}
                      </Link>
                    </h4>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                      {item.variant?.color && `Color: ${item.variant.color}`}
                      {item.variant?.size && item.variant?.color && ' | '}
                      {item.variant?.size && `Size: ${item.variant.size}`}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-neutral-600 font-medium">Qty: {item.quantity}</p>
                    <p className="text-sm font-bold font-mono text-black">PKR {Number(item.price).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Info if Shipped */}
          {order.trackingNumber && (
            <div className="pt-8 mt-8 border-t border-neutral-200">
              <div className="bg-neutral-50 p-6 flex items-center justify-between border border-neutral-100 rounded-[12px]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white flex items-center justify-center border border-neutral-200 rounded-[8px] shadow-sm">
                    <Truck className="w-5 h-5 text-black stroke-[2]" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">
                      {order.carrier ? `${order.carrier} Tracking` : 'Tracking Number'}
                    </p>
                    <p className="text-sm font-mono font-bold uppercase text-black">{order.trackingNumber}</p>
                  </div>
                </div>
                {trackingUrl && (
                  <Button variant="link" asChild className="text-black font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:gap-3 transition-all">
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                      Track on {order.carrier} <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                    </a>
                  </Button>
                )}
                {!trackingUrl && (
                  <Button variant="link" className="text-black font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:gap-3 transition-all">
                    Track Package <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Summaries */}
        <div className="lg:col-span-4 space-y-10">
          {/* Order Summary */}
          <div className="space-y-6">
            <h3 className="font-display text-2xl border-b border-neutral-200 pb-4 text-black">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Subtotal</span>
                <span className="font-mono text-black">PKR {Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-neutral-600 font-medium">
                <span>Shipping</span>
                <span className="font-mono text-black">PKR {Number(order.shippingCost).toLocaleString()}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Discount</span>
                  <span className="font-mono">- PKR {Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-neutral-200 flex justify-between font-bold text-lg text-black">
                <span className="font-display">Total</span>
                <span className="font-mono font-bold">PKR {Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 flex items-center gap-2">
              <MapPin className="w-3 h-3 stroke-[2]" /> Shipping Address
            </h3>
            <div className="text-sm text-neutral-700 font-medium leading-relaxed bg-neutral-50/50 p-6 border border-neutral-100 rounded-[12px]">
              <p className="font-bold text-black uppercase text-[11px] tracking-widest mb-2 border-b border-neutral-200 pb-2 w-fit">{order.address.label}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.province}</p>
              <p className="text-black font-bold mt-1">{order.address.postalCode}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 flex items-center gap-2">
              <CreditCard className="w-3 h-3 stroke-[2]" /> Payment Method
            </h3>
            <div className="space-y-2 p-6 border border-neutral-100 rounded-[12px] bg-neutral-50/50">
              <p className="text-[11px] font-bold uppercase tracking-widest text-black">{order.payment.method.replace('_', ' ')}</p>
              <Badge variant="outline" className="rounded-[4px] text-[8px] uppercase tracking-widest py-0 border-neutral-300 font-bold text-neutral-700">
                {order.payment.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
