'use client'

import React, { useEffect, useState } from 'react'
import { FileText, MessageCircle, ArrowRight, Package, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'

interface Quotation {
  id: string
  status: string
  createdAt: string
  items: any
  company: string | null
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pending Review',       color: 'bg-amber-50 text-amber-700 border-amber-200' },
  SENT:      { label: 'Quote Sent',           color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED:  { label: 'Accepted',             color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { label: 'Rejected',             color: 'bg-rose-50 text-rose-700 border-rose-200' },
  CONVERTED: { label: 'Converted to Order',   color: 'bg-black text-white border-black' },
  EXPIRED:   { label: 'Expired',              color: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
}

function itemCount(items: any): number {
  return Array.isArray(items) ? items.length : 0
}

export default function MyQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAppSelector((s) => s.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    fetch('/api/account/quotations')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setQuotations(result.data)
      })
      .catch(() => toast.error('Failed to load quotations'))
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-black">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">
            B2B Portal
          </p>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight text-black">
            Your Quotations
          </h1>
        </div>
        <Link
          href="/quotation"
          className="self-start sm:self-auto inline-flex items-center justify-center h-12 px-8 bg-black text-white hover:bg-neutral-900 uppercase tracking-widest text-[10px] font-bold transition-all shadow-lg rounded-none"
        >
          Request New Quote
        </Link>
      </div>

      {quotations.length > 0 ? (
        <>
          {/* ── Desktop Table (md+) ──────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  {['Request ID', 'Date', 'Items', 'Company', 'Status', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {quotations.map((q) => {
                  const s = statusMap[q.status] || { label: q.status, color: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
                  return (
                    <tr key={q.id} className="group hover:bg-neutral-50 transition-colors">
                      <td className="py-5 align-middle">
                        <span className="text-[11px] font-mono font-bold tracking-widest text-neutral-700">
                          #{q.id.slice(-8)}
                        </span>
                      </td>
                      <td className="py-5 align-middle">
                        <span className="text-[11px] text-neutral-600 font-bold">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-5 align-middle">
                        <span className="text-[11px] font-bold text-black">{itemCount(q.items)}</span>
                      </td>
                      <td className="py-5 align-middle">
                        <span className="text-[11px] text-black uppercase font-bold tracking-wider">
                          {q.company || '—'}
                        </span>
                      </td>
                      <td className="py-5 align-middle">
                        <span
                          className={cn(
                            'inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-full',
                            s.color
                          )}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="py-5 align-middle text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Link
                            href={`/account/quotations/${q.id}`}
                            className="inline-flex items-center gap-1.5 h-9 px-4 border border-neutral-200 hover:border-black transition-all text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-black"
                          >
                            View Details
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ─────────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {quotations.map((q) => {
              const s = statusMap[q.status] || { label: q.status, color: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
              return (
                <Link
                  key={q.id}
                  href={`/account/quotations/${q.id}`}
                  className="block bg-white border border-neutral-200 p-4 active:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[11px] font-mono font-bold tracking-widest text-neutral-700">
                        #{q.id.slice(-8)}
                      </p>
                      {q.company && (
                        <p className="text-[11px] font-bold text-black mt-0.5 uppercase tracking-wide">
                          {q.company}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-full shrink-0',
                        s.color
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-neutral-500 font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {itemCount(q.items)} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      ) : (
        /* ── Empty State ─────────────────────────────────────────────── */
        <div className="py-28 text-center border-2 border-dashed border-neutral-200 bg-neutral-50/30">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-5 stroke-[1.5]" />
          <h2 className="font-display text-2xl mb-2 text-black">No active quotations</h2>
          <p className="text-neutral-500 text-sm font-medium max-w-xs mx-auto mb-8">
            Looking for bulk orders or wholesale pricing? Request a customised quotation.
          </p>
          <Link
            href="/quotation"
            className="inline-flex items-center justify-center h-12 px-10 border border-black text-black hover:bg-black hover:text-white uppercase tracking-widest text-[10px] font-bold transition-all"
          >
            Request A Quote
          </Link>
        </div>
      )}

      {/* ── Support Banner ────────────────────────────────────────────── */}
      <div className="bg-neutral-950 text-white px-6 md:px-10 py-8 md:py-12 relative overflow-hidden">
        <div className="max-w-lg space-y-5 relative z-10">
          <h3 className="font-display text-2xl md:text-3xl text-white">
            Corporate &amp; Wholesale
          </h3>
          <p className="text-neutral-300 text-sm font-light leading-relaxed">
            Our B2B team specialises in corporate gifting, uniform requirements, and bulk
            wholesale orders with dedicated logistics support.
          </p>
          <Button className="h-12 px-8 bg-white text-black hover:bg-neutral-200 uppercase tracking-widest text-[10px] font-bold transition-all rounded-none">
            Talk to an Expert
          </Button>
        </div>
        <FileText className="absolute -bottom-6 -right-6 w-40 h-40 text-white opacity-[0.04]" />
      </div>
    </div>
  )
}
