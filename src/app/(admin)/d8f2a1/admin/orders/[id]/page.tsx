import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, Mail, Phone, MapPin, CreditCard, Package, Clock, Calendar, Hash } from 'lucide-react'
import { db } from '@/lib/db/client'
import { OrderStatusUpdater } from '@/components/admin/orders/OrderStatusUpdater'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Order Details | Admin Dashboard',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: { images: true }
          },
          variant: true
        }
      },
      user: {
        select: { name: true, email: true, phone: true }
      },
      address: true,
      payment: true
    }
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/d8f2a1/admin/orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-serif font-bold tracking-tight">Order #{order.orderNumber}</h1>
              <Badge variant="outline" className={cn(
                "rounded-none border-black font-bold uppercase text-[10px] tracking-widest px-3 py-1",
                order.status === 'DELIVERED' ? "bg-green-50 text-green-700 border-green-200" :
                order.status === 'CANCELLED' ? "bg-red-50 text-red-700 border-red-200" :
                "bg-neutral-50 text-black border-neutral-300"
              )}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500">
              Placed on {new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Order Items */}
          <Card className="rounded-none border-black shadow-none overflow-hidden">
            <CardHeader className="border-b border-black bg-neutral-50">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="text-left p-4 font-bold uppercase text-[10px] tracking-widest">Product</th>
                    <th className="text-center p-4 font-bold uppercase text-[10px] tracking-widest">Qty</th>
                    <th className="text-right p-4 font-bold uppercase text-[10px] tracking-widest">Price</th>
                    <th className="text-right p-4 font-bold uppercase text-[10px] tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex gap-4">
                          <div className="relative w-16 h-20 bg-neutral-100 border border-neutral-200 flex-shrink-0">
                            {item.product.images[0]?.url && (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="font-bold text-black uppercase text-[11px] tracking-widest mb-1">{item.product.name}</p>
                            {item.variant?.optionValues && typeof item.variant.optionValues === 'object' && Object.keys(item.variant.optionValues as any).length > 0 && (
                              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">
                                {Object.entries(item.variant.optionValues as any).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                              </p>
                            )}
                            <p className="text-[9px] font-mono text-neutral-400 mt-1">SKU: {item.variant?.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold">{item.quantity}</td>
                      <td className="p-4 text-right font-mono">PKR {Number(item.price).toLocaleString()}</td>
                      <td className="p-4 text-right font-bold font-mono">PKR {(item.quantity * Number(item.price)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50/30 font-bold border-t border-neutral-200">
                  <tr>
                    <td colSpan={3} className="p-4 text-right uppercase text-[10px] tracking-widest">Subtotal</td>
                    <td className="p-4 text-right font-mono">PKR {Number(order.subtotal).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-4 text-right uppercase text-[10px] tracking-widest">Shipping</td>
                    <td className="p-4 text-right font-mono">PKR {Number(order.shippingCost).toLocaleString()}</td>
                  </tr>
                  {Number(order.discount) > 0 && (
                    <tr className="text-red-600">
                      <td colSpan={3} className="p-4 text-right uppercase text-[10px] tracking-widest">Discount</td>
                      <td className="p-4 text-right font-mono">-PKR {Number(order.discount).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="text-lg bg-neutral-100">
                    <td colSpan={3} className="p-4 text-right font-serif uppercase tracking-widest">Grand Total</td>
                    <td className="p-4 text-right font-mono text-xl">PKR {Number(order.total).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Customer Timeline */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Order History & Timeline
            </h3>
            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-100">
              {/* Placed */}
              <div className="relative">
                <div className="absolute -left-8 w-6 h-6 rounded-full bg-black border-4 border-white shadow-sm flex items-center justify-center">
                  <Calendar className="w-2 h-2 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-black">Order Placed</p>
                  <p className="text-xs text-neutral-500">The order was successfully created by the customer.</p>
                  <p className="text-[10px] font-mono text-neutral-400">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Payment */}
              <div className="relative">
                <div className={cn(
                  "absolute -left-8 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                  order.payment?.status === 'COMPLETED' ? "bg-green-600" : "bg-orange-500"
                )}>
                  <CreditCard className="w-2 h-2 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-black">
                    Payment Status: {order.payment?.status}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Method: {order.payment?.method.replace('_', ' ')}
                    {order.payment?.gatewayRef && ` | Ref: ${order.payment.gatewayRef}`}
                  </p>
                  {order.payment?.paidAt && (
                    <p className="text-[10px] font-mono text-neutral-400">{new Date(order.payment.paidAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Latest Update */}
              <div className="relative">
                <div className="absolute -left-8 w-6 h-6 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center">
                  <Clock className="w-2 h-2 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-black">Latest Activity</p>
                  <p className="text-xs text-neutral-500">Order status was updated to <strong>{order.status}</strong>.</p>
                  <p className="text-[10px] font-mono text-neutral-400">{new Date(order.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          {/* Status Panel */}
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.trackingNumber}
            carrier={order.carrier}
            notes={order.notes}
          />

          {/* Customer Info */}
          <Card className="rounded-none border-neutral-200 shadow-none">
            <CardHeader className="border-b border-neutral-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold">
                    {order.user?.name?.[0] || 'G'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black">{order.user?.name || 'Guest Customer'}</p>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase">Customer ID: {order.userId || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3 text-xs text-neutral-600">
                    <Mail className="w-3 h-3" />
                    <span>{order.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-600">
                    <Phone className="w-3 h-3" />
                    <span>{order.user?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="rounded-none border-neutral-200 shadow-none">
            <CardHeader className="border-b border-neutral-100">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {order.address ? (
                <div className="text-xs text-neutral-700 leading-relaxed space-y-1">
                  <p className="font-bold text-black uppercase text-[10px] tracking-widest mb-2 pb-1 border-b border-neutral-100 w-fit">{order.address.label}</p>
                  <p>{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{order.address.city}, {order.address.province}</p>
                  <p className="font-bold text-black mt-2">{order.address.postalCode}</p>
                </div>
              ) : (
                <p className="text-xs text-neutral-400 italic">No address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Gift Message */}
          {order.isGift && (
            <Card className="rounded-none border-neutral-200 bg-neutral-50 shadow-none">
              <CardHeader className="border-b border-neutral-200">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest">🎁 Gift Message</CardTitle>
              </CardHeader>
              <CardContent className="p-4 italic text-xs text-neutral-600">
                "{order.giftMessage || 'No message provided'}"
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
