import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, User, Mail, Phone, MapPin, CreditCard,
  Package, Clock, Calendar, Hash, Truck, Globe, Printer
} from 'lucide-react'
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

const getCountryLabel = (country: string) => {
  switch (country) {
    case 'PK': return { flag: '🇵🇰', label: 'Pakistan', site: 'calnza.pk' }
    case 'UK': return { flag: '🇬🇧', label: 'United Kingdom', site: 'calnza.co.uk' }
    default:   return { flag: '🌍', label: 'Global', site: 'calnza.com' }
  }
}

const getCurrencySymbol = (country: string) => {
  switch (country) {
    case 'UK': return '£'
    case 'GLOBAL': return '$'
    default: return 'PKR'
  }
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'CARD':         return 'Credit / Debit Card (Stripe)'
    case 'COD':          return 'Cash on Delivery'
    case 'EASYPAISA':    return 'EasyPaisa Mobile Account'
    case 'JAZZCASH':     return 'JazzCash'
    case 'BANK_TRANSFER': return 'Bank Transfer'
    default:             return method
  }
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params

  let order: any = null

  try {
    order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: true } },
            variant: true,
          },
        },
        user: { select: { name: true, email: true, phone: true } },
        address: true,
        payment: true,
      },
    })
  } catch (err) {
    console.warn('[AdminOrderDetailPage] DB unavailable:', err)
  }

  if (!order) notFound()

  const country = order.country || 'PK'
  const countryInfo = getCountryLabel(country)
  const currency = getCurrencySymbol(country)

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

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-neutral-800">
                Order #{order.orderNumber}
              </h1>
              <Badge variant="outline" className={cn(
                'rounded-full border font-bold uppercase text-[9px] tracking-widest px-2 py-0 shadow-sm',
                order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                'bg-neutral-50 text-neutral-600 border-neutral-100',
              )}>
                {order.status}
              </Badge>
              {/* Country badge — NEW */}
              <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                <span className="text-sm leading-none">{countryInfo.flag}</span>
                {countryInfo.label}
                <span className="text-neutral-400 font-normal normal-case text-[9px]">({countryInfo.site})</span>
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <a 
            href={`/api/admin/orders/${order.id}/invoice`} 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-black text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-md transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Download Invoice
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Items + Timeline ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-neutral-50 bg-neutral-50/30 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[400px]">
                  <thead>
                    <tr className="border-b border-neutral-50 bg-neutral-50/20">
                      <th className="text-left p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Product</th>
                      <th className="text-center p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Qty</th>
                      <th className="text-right p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Price</th>
                      <th className="text-right p-4 text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {order.items.map((item: any) => (
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
                              <p className="font-semibold text-neutral-800 text-[11px] mb-0.5">
                                {item.product.name}
                              </p>
                              {item.variant && (
                                <p className="text-xs text-neutral-500">
                                  {item.variant.title !== 'Default' ? item.variant.title : 'Standard'}
                                </p>
                              )}
                              <p className="text-[9px] font-mono text-neutral-400 mt-0.5">
                                SKU: {item.variant?.sku || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center font-medium text-neutral-600">{item.quantity}</td>
                        <td className="p-4 text-right text-black font-semibold">
                          {currency} {Number(item.price).toLocaleString()}
                        </td>
                        <td className="p-4 text-right text-black font-semibold">
                          {currency} {(item.quantity * Number(item.price)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50/10 text-neutral-700 font-medium border-t border-neutral-50">
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-[10px] uppercase tracking-widest text-neutral-400">Subtotal</td>
                      <td className="p-3 text-right font-semibold text-black">{currency} {Number(order.subtotal).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-[10px] uppercase tracking-widest text-neutral-400">
                        Shipping
                      </td>
                      <td className="p-3 text-right font-semibold text-black">
                        {Number(order.shippingCost) === 0 ? 'Free' : `${currency} ${Number(order.shippingCost).toLocaleString()}`}
                      </td>
                    </tr>
                    {Number(order.discount) > 0 && (
                      <tr className="text-rose-600">
                        <td colSpan={3} className="p-3 text-right text-[10px] uppercase tracking-widest">Discount</td>
                        <td className="p-3 text-right font-semibold">
                          -{currency} {Number(order.discount).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-neutral-900 text-white">
                      <td colSpan={3} className="p-4 text-right text-[9px] font-bold uppercase tracking-[0.2em]">Grand Total</td>
                      <td className="p-4 text-right font-mono text-base font-bold">
                        {currency} {Number(order.total).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
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
                    <p className="text-[11px] text-neutral-500">
                      via {countryInfo.flag} {countryInfo.site}
                    </p>
                    <p className="text-[9px] font-mono text-neutral-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className={cn(
                    'absolute -left-[23px] w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center',
                    order.payment?.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500',
                  )}>
                    <CreditCard className="w-2 h-2 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800">
                      Payment: {order.payment?.status || 'PENDING'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {order.payment ? getPaymentMethodLabel(order.payment.method) : '—'}
                    </p>
                    {order.payment?.gatewayRef && (
                      <p className="text-[9px] font-mono text-neutral-400 break-all">
                        Ref: {order.payment.gatewayRef}
                      </p>
                    )}
                    {order.payment?.paidAt && (
                      <p className="text-[9px] font-mono text-neutral-400">
                        {new Date(order.payment.paidAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-[23px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
                    <Clock className="w-2 h-2 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800">
                      Current Status: {order.status}
                    </p>
                    <p className="text-[9px] font-mono text-neutral-400">
                      {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Right Column: Side cards ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Status Updater */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-neutral-50 bg-neutral-50/30 p-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Manage Status
              </CardTitle>
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

          {/* Order Origin — NEW */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Order Origin
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{countryInfo.flag}</span>
              <div>
                <p className="text-sm font-bold text-neutral-900">{countryInfo.label}</p>
                <p className="text-[10px] text-neutral-400">{countryInfo.site}</p>
              </div>
            </div>
          </Card>

          {/* Payment Details — ENHANCED */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Payment Details
            </h3>
            {order.payment ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-neutral-400">Method</span>
                  <span className="font-bold text-neutral-900 text-right max-w-[60%]">
                    {getPaymentMethodLabel(order.payment.method)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Status</span>
                  <span className={cn(
                    'font-bold',
                    order.payment.status === 'COMPLETED' ? 'text-emerald-600' :
                    order.payment.status === 'FAILED' ? 'text-red-500' :
                    'text-amber-500',
                  )}>
                    {order.payment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Amount</span>
                  <span className="font-bold text-neutral-900">
                    {currency} {Number(order.payment.amount).toLocaleString()}
                  </span>
                </div>
                {order.payment.gatewayRef && (
                  <div className="border-t border-neutral-50 pt-3">
                    <span className="text-neutral-400 block mb-1">Gateway Ref</span>
                    <span className="font-mono text-[10px] text-neutral-600 break-all bg-neutral-50 p-2 block rounded">
                      {order.payment.gatewayRef}
                    </span>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Paid At</span>
                    <span className="text-neutral-700 text-[10px]">
                      {new Date(order.payment.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No payment record</p>
            )}
          </Card>

          {/* Shipping — ENHANCED with option name */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 flex items-center gap-2">
              <Truck className="w-3 h-3" /> Shipping
            </h3>
            {/* shippingOption not in schema */}
            {order.address ? (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Delivery Address
                </p>
                <div className="text-xs text-neutral-700 leading-relaxed space-y-0.5">
                  <p className="font-bold text-neutral-900">{order.address.firstName} {order.address.lastName}</p>
                  <p>{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{order.address.city}, {order.address.province}</p>
                  <p>{order.address.postalCode}</p>
                  <p className="text-neutral-500">{order.address.country}</p>
                  {order.address.phone && (
                    <p className="flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-neutral-300" /> {order.address.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No address on record</p>
            )}
          </Card>

          {/* Customer */}
          <Card className="border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-4">
            <h3 className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-4 flex items-center gap-2">
              <User className="w-3 h-3" /> Customer
            </h3>
            <div className="space-y-3 text-xs text-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                  {order.user?.name?.[0] || 'G'}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{order.user?.name || 'Guest'}</p>
                  <p className="text-[10px] text-neutral-400">{order.userId ? `ID: ${order.userId.slice(0, 8)}…` : 'Guest checkout'}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-neutral-50">
                {order.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-neutral-300 shrink-0" />
                    <span className="truncate">{order.user.email}</span>
                  </div>
                )}
                {order.user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-neutral-300 shrink-0" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Gift message */}
          {order.isGift && (
            <Card className="border-rose-100 bg-rose-50/30 shadow-none rounded-xl p-4">
              <h3 className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-2">
                🎁 Gift Message
              </h3>
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
