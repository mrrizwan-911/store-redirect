'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, TrendingDown, Package, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ForecastItem {
  productId: string
  name: string
  sku: string
  currentStock: number
  avgDailySales: number
  daysRemaining: number
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
}

export function ForecastAlerts() {
  const [data, setData] = useState<ForecastItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/inventory-forecast')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-neutral-100 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-300" />
      </div>
    )
  }

  const criticalItems = data.filter(i => i.riskLevel === 'CRITICAL' || i.riskLevel === 'HIGH')

  if (data.length === 0) return null

  return (
    <div className="bg-white p-6 rounded-xl border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Inventory Forecast (AI)</h3>
        {criticalItems.length > 0 && (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded-full uppercase tracking-tighter animate-pulse">
            {criticalItems.length} High Risk
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
        {data.map((item) => (
          <div
            key={item.productId}
            className={cn(
              "p-4 rounded-lg border flex items-center justify-between transition-all",
              item.riskLevel === 'CRITICAL' ? "bg-rose-50/30 border-rose-100" :
              item.riskLevel === 'HIGH' ? "bg-orange-50/30 border-orange-100" :
              "bg-neutral-50/30 border-neutral-100"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                item.riskLevel === 'CRITICAL' ? "bg-rose-100 text-rose-600" :
                item.riskLevel === 'HIGH' ? "bg-orange-100 text-orange-600" :
                "bg-neutral-100 text-neutral-500"
              )}>
                {item.riskLevel === 'CRITICAL' ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-tighter">SKU: {item.sku}</span>
                  <div className="w-1 h-1 bg-neutral-200 rounded-full" />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tight">Stock: {item.currentStock}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 text-neutral-900 font-bold">
                <TrendingDown className="w-3 h-3 text-neutral-400" />
                <span className="text-sm">
                  {item.daysRemaining > 90 ? '> 3 Mo.' : `${item.daysRemaining} Days`}
                </span>
              </div>
              <p className={cn(
                "text-[9px] uppercase font-bold tracking-widest mt-1",
                item.riskLevel === 'CRITICAL' ? "text-rose-600" :
                item.riskLevel === 'HIGH' ? "text-orange-600" :
                "text-neutral-400"
              )}>
                {item.riskLevel === 'CRITICAL' ? 'Critical Reorder' :
                 item.riskLevel === 'HIGH' ? 'Low Stock Soon' : 'Stable'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-neutral-50">
        <p className="text-[9px] text-neutral-400 italic text-center">
          * AI Forecast based on average sales velocity over the last 30 days.
        </p>
      </div>
    </div>
  )
}
