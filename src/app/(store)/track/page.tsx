'use client'

import React, { useState } from 'react'
import { Search, Package, Truck, Calendar, MapPin, CreditCard, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState('')
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingId.trim()) return

    setIsLoading(true)
    setError(null)
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/track/${trackingId.trim()}`)
      const result = await res.json()

      if (result.success) {
        setOrder(result.data)
      } else {
        setError(result.error || 'Order not found. Please check your Tracking ID.')
      }
    } catch (err) {
      setError('Failed to track order. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const statusSteps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-black">
      <div className="text-center space-y-4 mb-16">
        <h1 className="font-display text-5xl md:text-6xl tracking-tight">Track Your Order</h1>
        <p className="text-neutral-500 text-sm max-w-md mx-auto uppercase tracking-widest font-bold">
          Enter your Order Number or Tracking ID to see live updates.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-20">
        <form onSubmit={handleTrack} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="e.g. AS-12345678 or Order #..."
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="h-14 pl-12 bg-white border-2 border-neutral-100 rounded-[12px] focus-visible:ring-0 focus-visible:border-black transition-all text-sm font-medium"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 px-8 bg-black text-white hover:bg-neutral-800 rounded-[12px] uppercase tracking-widest text-[10px] font-bold shadow-xl transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
          </Button>
        </form>
        {error && (
          <p className="mt-4 text-center text-red-600 text-xs font-bold uppercase tracking-widest">{error}</p>
        )}
      </div>

      {order && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Order Info Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none bg-neutral-50/50 rounded-[16px] shadow-none">
              <CardContent className="p-6 space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-bold text-neutral-500">Status</p>
                <p className="font-bold text-black text-sm uppercase tracking-wider">{order.status}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-neutral-50/50 rounded-[16px] shadow-none">
              <CardContent className="p-6 space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-bold text-neutral-500">Order Number</p>
                <p className="font-bold text-black text-sm uppercase tracking-wider">#{order.orderNumber}</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-neutral-50/50 rounded-[16px] shadow-none">
              <CardContent className="p-6 space-y-1">
                <p className="text-[9px] uppercase tracking-widest font-bold text-neutral-500">Tracking ID</p>
                <p className="font-bold text-black text-sm uppercase tracking-wider">{order.trackingNumber}</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracker */}
          <div className="relative py-8">
             <div className="absolute top-1/2 left-0 w-full h-[2px] bg-neutral-100 -translate-y-1/2" />
             <div
               className="absolute top-1/2 left-0 h-[2px] bg-black -translate-y-1/2 transition-all duration-1000"
               style={{ width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
             />
             <div className="relative flex justify-between">
                {statusSteps.map((step, idx) => {
                  const isActive = idx <= currentStepIndex
                  const isCurrent = idx === currentStepIndex
                  return (
                    <div key={step} className="flex flex-col items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white",
                        isActive ? "border-black text-black" : "border-neutral-100 text-neutral-300"
                      )}>
                        {isActive ? <Truck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>
                      <span className={cn(
                        "text-[9px] uppercase tracking-widest font-bold",
                        isActive ? "text-black" : "text-neutral-300"
                      )}>
                        {step}
                      </span>
                    </div>
                  )
                })}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-neutral-100">
            {/* Items */}
            <div className="space-y-6">
              <h3 className="font-display text-2xl tracking-tight uppercase">Order Content</h3>
              <div className="divide-y divide-neutral-50">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="py-4 flex gap-4">
                    <div className="relative w-16 h-20 bg-neutral-50 rounded-md overflow-hidden shrink-0">
                      {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider">{item.name}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                        {item.variant?.color} / {item.variant?.size}
                      </p>
                      <p className="text-[10px] font-bold">QTY: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-display text-2xl tracking-tight uppercase">Shipping Destination</h3>
                {order.address ? (
                  <div className="bg-neutral-50/50 p-6 rounded-[16px] space-y-1">
                    <p className="text-sm font-bold">{order.address.firstName} {order.address.lastName}</p>
                    <p className="text-sm text-neutral-600">{order.address.city}, {order.address.province}</p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mt-2">Verified Destination</p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 italic">Address data unavailable for this tracking view.</p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-display text-2xl tracking-tight uppercase">Payment</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Method</p>
                    <p className="text-xs font-bold uppercase">{order.payment?.method.replace('_', ' ')}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto rounded-none text-[8px] uppercase tracking-widest">{order.payment?.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!order && !isLoading && (
        <div className="mt-32 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full text-[9px] uppercase tracking-widest font-bold text-neutral-500">
            Need help with your order?
          </div>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
            If you cannot find your tracking information, please contact our support team on WhatsApp.
          </p>
          <Button variant="link" className="text-black font-bold uppercase tracking-widest text-[10px] underline underline-offset-4">
            Contact Support
          </Button>
        </div>
      )}
    </div>
  )
}
