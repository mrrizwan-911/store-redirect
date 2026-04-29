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

export const dynamic = 'force-dynamic'

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
    <div className="max-w-6xl mx-auto space-y-6 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/d8f2a1/admin/orders"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Orders
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-neutral-800">Order #{order.orderNumber}</h1>
              <Badge variant="outline" className={cn(
                "rounded-full border font-bold uppercase text-[9px] tracking-widest px-2 py-0 shadow-sm",
                order.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                order.status === 'CANCELLED' ? "bg-rose-50 text-rose-700 border-rose-100" :
                "bg-neutral-50 text-neutral-600 border-neutral-100"
              )}>
                {order.status}
              </Badge>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-neutral-50 bg-neutral-50/30 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-50 bg-neutral-50/20">
                    <th className="text-left p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Product</th>
                    <th className="text-center p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Qty</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Price</th>
                    <th className="text-right p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex gap-3">
                          <div className="relative w-10 h-14 bg-neutral-50 border border-neutral-100 rounded-md overflow-hidden flex-shrink-0">
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
                            <p className="font-semibold text-neutral-800 text-[11px] mb-0.5">{item.product.name}</p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {item.variant ? (
                                <>
                                  {item.variant.title !== 'Default' ? item.variant.title : 'Standard'}
                                  {item.variant.optionValues && Object.keys(item.variant.optionValues).length > 0 && (
                                    <span className="ml-2 opacity-70">
                                      ({Object.entries(item.variant.optionValues as any).map(([k, v]) => `${k}: ${v}`).join(', ')})
                                    </span>
                                  )}
                                </>
                              ) : (
                                'Standard'
                              )}
                            </p>
                            <p className="text-[9px] font-mono text-neutral-400 mt-0.5">SKU: {item.variant?.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-neutral-600">{item.quantity}</td>
                      <td className="p-4 text-right text-black font-semibold">PKR {Number(item.price).toLocaleString()}</td>
                      <td className="p-4 text-right text-black font-semibold">PKR {(item.quantity * Number(item.price)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50/10 text-neutral-700 font-medium border-t border-neutral-50">
                  <tr>
                    <td colSpan={3} className="p-3 text-right text-[10px] uppercase tracking-widest text-neutral-400">Subtotal</td>
                    <td className="p-3 text-right font-semibold text-black">PKR {Number(order.subtotal).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-3 text-right text-[10px] uppercase tracking-widest text-neutral-400">Shipping</td>
                    <td className="p-3 text-right font-semibold text-black">PKR {Number(order.shippingCost).toLocaleString()}</td>
                  </tr>
                  {Number(order.discount) > 0 && (
                    <tr className="text-rose-600">
                      <td colSpan={3} className="p-3 text-right text-[10px] uppercase tracking-widest">Discount</td>
                      <td className="p-3 text-right font-semibold">-PKR {Number(order.discount).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="bg-neutral-900 text-white">
                    <td colSpan={3} className="p-4 text-right text-[9px] font-bold uppercase tracking-[0.2em]">Grand Total</td>
                    <td className="p-4 text-right font-mono text-base font-bold">PKR {Number(order.total).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          {/* Customer Timeline */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Order Timeline
            </h3>
            <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-5">
              <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-[1px] before:bg-neutral-100">
                <div className="relative">
                  <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-neutral-900 border-2 border-white shadow-sm flex items-center justify-center">
                    <Calendar className="w-2 h-2 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800">Order Placed</p>
                    <p className="text-[11px] text-neutral-500">The order was successfully created.</p>
                    <p className="text-[9px] font-mono text-neutral-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="relative">
                  <div className={cn(
                    "absolute -left-[23px] w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
                    order.payment?.status === 'COMPLETED' ? "bg-emerald-500" : "bg-amber-500"
                  )}>
                    <CreditCard className="w-2 h-2 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800">
                      Payment: {order.payment?.status}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      via {order.payment?.method.replace('_', ' ')}
                    </p>
                    {order.payment?.paidAt && (
                      <p className="text-[9px] font-mono text-neutral-400">{new Date(order.payment.paidAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
                    <Clock className="w-2 h-2 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800">Current Status: {order.status}</p>
                    <p className="text-[9px] font-mono text-neutral-400">{new Date(order.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Status Panel */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-neutral-50 bg-neutral-50/30 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Manage Status</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <OrderStatusUpdater
                orderId={order.id}
                currentStatus={order.status}
                trackingNumber={order.trackingNumber}
                carrier={order.carrier}
                notes={order.notes}
              />
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 flex items-center gap-2">
              <User className="w-3 h-3" /> Customer Details
            </h3>
            <div className="space-y-3 text-xs text-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                  {order.user?.name?.[0] || 'G'}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{order.user?.name || 'Guest Customer'}</p>
                  <p className="text-[10px] text-neutral-400">ID: {order.userId || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-neutral-50">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-neutral-300" />
                  <span>{order.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-neutral-300" />
                  <span>{order.user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping & Payment */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Shipping Address
            </h3>
            {order.address ? (
              <div className="text-xs text-neutral-700 leading-relaxed space-y-1">
                <p className="font-bold text-neutral-900 uppercase text-[9px] tracking-widest mb-2 border-b border-neutral-50 w-fit pb-1">{order.address.label}</p>
                <p>{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>{order.address.city}, {order.address.province}</p>
                <p className="font-semibold text-neutral-900 mt-2">{order.address.postalCode}</p>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No address provided</p>
            )}
          </Card>

          {/* Gift Message */}
          {order.isGift && (
            <Card className="border-rose-100 bg-rose-50/30 shadow-none rounded-xl p-4">
              <h3 className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-2">🎁 Gift Message</h3>
              <p className="italic text-xs text-rose-700 leading-relaxed">
                "{order.giftMessage || 'No message provided'}"
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
