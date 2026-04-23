'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Search, ChevronRight, ArrowRight, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  _count: {
    items: number
  }
}

const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: 'Pending', variant: 'outline' },
  CONFIRMED: { label: 'Confirmed', variant: 'outline' },
  PROCESSING: { label: 'Processing', variant: 'outline' },
  SHIPPED: { label: 'Shipped', variant: 'outline' },
  DELIVERED: { label: 'Delivered', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'secondary' },
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    fetchOrders(1)
  }, [isAuthenticated])

  async function fetchOrders(page: number) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/account/orders?page=${page}&limit=10`)
      const result = await res.json()
      if (result.success) {
        setOrders(result.data.orders)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Purchase History</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Your Orders</h1>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {/* Mobile: Card List / Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Order #</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Date</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Status</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Items</th>
                  <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Total</th>
                  <th className="py-4 text-right text-[10px] uppercase tracking-widest font-bold text-neutral-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-black">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-neutral-50 transition-colors">
                    <td className="py-6 align-middle">
                      <span className="text-[11px] font-bold tracking-widest uppercase">#{order.orderNumber}</span>
                    </td>
                    <td className="py-6 align-middle">
                      <span className="text-xs text-neutral-600 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-6 align-middle">
                      <Badge
                        variant={statusMap[order.status]?.variant || 'outline'}
                        className="rounded-[4px] text-[8px] uppercase tracking-widest px-2 py-0 border-neutral-300 font-bold"
                      >
                        {statusMap[order.status]?.label || order.status}
                      </Badge>
                    </td>
                    <td className="py-6 align-middle">
                      <span className="text-xs text-neutral-600 font-medium">{order._count.items} Products</span>
                    </td>
                    <td className="py-6 align-middle">
                      <span className="text-[13px] font-bold font-mono">PKR {Number(order.total).toLocaleString()}</span>
                    </td>
                    <td className="py-6 text-right align-middle">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black hover:text-white transition-all text-neutral-400"
                      >
                        <ArrowRight className="w-4 h-4 stroke-[2]" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block p-5 bg-white border border-neutral-200 active:bg-neutral-50 transition-colors rounded-[12px] shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1 text-black">
                    <h3 className="text-[11px] font-bold tracking-widest uppercase">#{order.orderNumber}</h3>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge
                    variant={statusMap[order.status]?.variant || 'outline'}
                    className="rounded-[4px] text-[8px] uppercase tracking-widest px-2 py-0 border-neutral-300 font-bold"
                  >
                    {statusMap[order.status]?.label || order.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2 text-neutral-500 font-bold">
                    <Package className="w-3 h-3 stroke-[2]" />
                    <span className="text-[10px] uppercase tracking-widest">{order._count.items} Items</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-black">PKR {Number(order.total).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                className="rounded-[10px] text-[10px] uppercase tracking-widest h-10 px-6 border-neutral-300 font-bold"
              >
                Previous
              </Button>
              <span className="text-[10px] uppercase tracking-widest font-bold text-black">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchOrders(pagination.page + 1)}
                className="rounded-[10px] text-[10px] uppercase tracking-widest h-10 px-6 border-neutral-300 font-bold"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-neutral-200 rounded-[12px] bg-neutral-50/30">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-6 stroke-[1.5]" />
          <h2 className="font-display text-2xl mb-2 text-black">No orders found</h2>
          <p className="text-neutral-500 text-sm font-medium max-w-xs mx-auto mb-8">
            You haven't placed any orders yet. Explore our collection to find something you love.
          </p>
          <Link
            href="/products"
            className="rounded-[12px] bg-black text-white h-12 px-10 uppercase tracking-widest text-[10px] font-bold shadow-lg flex items-center justify-center w-fit mx-auto transition-all hover:bg-neutral-900"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  )
}
