'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Award,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store/hooks'

interface DashboardData {
  user: {
    name: string
    loyalty: {
      points: number
      tier: string
    }
  }
  stats: {
    totalOrders: number
    savedAddresses: number
  }
  latestOrder: any | null
}

export default function AccountOverview() {
  const { user: reduxUser, isAuthenticated } = useAppSelector((state) => state.auth)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    async function fetchDashboardData() {
      try {
        const [profileRes, ordersRes, addressesRes] = await Promise.all([
          fetch('/api/account/profile').then(res => res.json()),
          fetch('/api/account/orders?limit=1').then(res => res.json()),
          fetch('/api/account/addresses').then(res => res.json())
        ])

        if (profileRes.success) {
          setData({
            user: profileRes.data,
            stats: {
              totalOrders: ordersRes.data?.pagination?.total || 0,
              savedAddresses: addressesRes.data?.length || 0
            },
            latestOrder: ordersRes.data?.orders?.[0] || null
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const welcomeName = data?.user?.name || reduxUser?.name || 'User'

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Dashboard</p>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-black">
          Hello, {welcomeName.split(' ')[0]}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[12px] border-neutral-200 shadow-none bg-neutral-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-2 font-bold">
              <Package className="w-3 h-3 stroke-[2]" /> Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-black">{data?.stats.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-neutral-200 shadow-none bg-neutral-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-600 flex items-center gap-2 font-black">
              <Award className="w-3 h-3 stroke-[2.5]" /> Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display text-black font-bold">{data?.user.loyalty?.points || 0}</div>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border-neutral-200 shadow-none bg-neutral-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-600 flex items-center gap-2 font-black">
              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" /> Member Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-display uppercase tracking-tight text-black font-bold">
              {data?.user.loyalty?.tier || 'Bronze'}
            </div>
            <Link href="/account/loyalty" className="text-[9px] uppercase tracking-widest font-black underline underline-offset-4 text-black hover:text-neutral-600 transition-colors">
              Details
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Latest Order & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest Order */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <h3 className="font-display text-xl text-black">Recent Activity</h3>
            <Link href="/account/orders" className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:gap-3 transition-all text-black">
              View All Orders <ArrowRight className="w-3 h-3 stroke-[2]" />
            </Link>
          </div>

          {data?.latestOrder ? (
            <Card className="rounded-[12px] border-neutral-200 shadow-none overflow-hidden group">
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-[6px] text-[9px] uppercase tracking-widest py-0 border-neutral-300 text-black">
                      {data.latestOrder.status}
                    </Badge>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                      Order #{data.latestOrder.orderNumber}
                    </span>
                  </div>
                  <h4 className="font-display text-2xl text-black">
                    Your order is being processed
                  </h4>
                  <div className="flex items-center gap-4 text-neutral-600 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 stroke-[2]" /> {new Date(data.latestOrder.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3 h-3 stroke-[2]" /> {data.latestOrder._count.items} Items
                    </span>
                  </div>
                </div>
                <Link
                  href={`/account/orders/${data.latestOrder.id}`}
                  className="rounded-[12px] h-12 px-8 border border-black text-black hover:bg-black hover:text-white transition-all text-[10px] uppercase tracking-widest font-bold flex items-center justify-center"
                >
                  Track Order
                </Link>
              </div>
            </Card>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[12px]">
              <Package className="w-8 h-8 text-neutral-300 mx-auto mb-4 stroke-[1.5]" />
              <p className="text-neutral-500 text-sm font-medium">No recent orders found.</p>
              <Link
                href="/products"
                className="mt-2 text-black font-bold uppercase tracking-widest text-[10px] hover:underline underline-offset-4 inline-block mx-auto"
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links & Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <h3 className="font-display text-xl border-b border-neutral-200 pb-4 text-black">Account Shortcuts</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Edit Profile', href: '/account/profile' },
                { label: 'Address Book', href: '/account/addresses' },
                { label: 'My Wishlist', href: '/account/wishlist' },
                { label: 'Points History', href: '/account/loyalty' },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center justify-between p-4 bg-white border border-neutral-200 hover:border-black transition-all group rounded-[12px]"
                >
                  <span className="text-[11px] uppercase tracking-widest font-bold text-neutral-700 group-hover:text-black">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <Card className="rounded-[12px] border-neutral-200 shadow-none bg-neutral-950 text-white p-6">
            <div className="space-y-4">
              <h4 className="font-display text-lg tracking-tight">Need assistance?</h4>
              <p className="text-neutral-300 text-xs leading-relaxed font-light">
                Our luxury concierge team is available 24/7 to help with your orders or styling advice.
              </p>
              <Button className="w-full rounded-[12px] bg-white text-black hover:bg-neutral-200 text-[10px] uppercase tracking-widest font-bold h-12 shadow-xl">
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
