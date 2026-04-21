'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Search, ChevronRight, Clock, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Quotation {
  id: string
  status: string
  createdAt: string
  items: any
  company: string | null
}

const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: 'Pending Review', variant: 'outline' },
  SENT: { label: 'Quote Sent', variant: 'secondary' },
  ACCEPTED: { label: 'Accepted', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  CONVERTED: { label: 'Converted to Order', variant: 'default' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
}

export default function MyQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const res = await fetch('/api/account/quotations')
        const result = await res.json()
        if (result.success) setQuotations(result.data)
      } catch (error) {
        toast.error('Failed to load quotations')
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuotations()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-black">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">B2B Portal</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Your Quotations</h1>
        </div>
        <Link
          href="/quotation"
          className="rounded-[12px] h-14 px-8 bg-black text-white hover:bg-neutral-900 uppercase tracking-widest text-[10px] font-bold transition-all shadow-lg flex items-center justify-center"
        >
          Request New Quote
        </Link>
      </div>

      {quotations.length > 0 ? (
        <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Request ID</th>
                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Date</th>
                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Company</th>
                <th className="py-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">Status</th>
                <th className="py-4 text-right text-[10px] uppercase tracking-widest font-bold text-neutral-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-black font-medium">
              {quotations.map((q) => (
                <tr key={q.id} className="group hover:bg-neutral-50 transition-colors">
                  <td className="py-6 align-middle">
                    <span className="text-[11px] font-bold tracking-widest uppercase">#{q.id.slice(-8)}</span>
                  </td>
                  <td className="py-6 align-middle">
                    <span className="text-xs text-neutral-600 font-bold">{new Date(q.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="py-6 align-middle">
                    <span className="text-xs text-black uppercase font-bold tracking-wider">{q.company || 'Personal'}</span>
                  </td>
                  <td className="py-6 align-middle">
                    <Badge
                      variant={statusMap[q.status]?.variant || 'outline'}
                      className="rounded-[4px] text-[8px] uppercase tracking-widest px-2 py-0 border-neutral-300 font-bold"
                    >
                      {statusMap[q.status]?.label || q.status}
                    </Badge>
                  </td>
                  <td className="py-6 text-right align-middle">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" className="h-10 px-4 rounded-[8px] text-[10px] uppercase tracking-widest font-bold border border-transparent hover:border-black transition-all text-neutral-500 hover:text-black">
                        View Details
                      </Button>
                      <Button variant="ghost" className="h-10 w-10 p-0 rounded-[8px] bg-neutral-50 hover:bg-[#25D366] hover:text-white transition-all text-neutral-400">
                        <MessageCircle className="w-4 h-4 stroke-[2]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-neutral-200 rounded-[12px] bg-neutral-50/30">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-6 stroke-[1.5]" />
          <h2 className="font-display text-2xl mb-2 text-black">No active quotations</h2>
          <p className="text-neutral-500 text-sm font-medium max-w-xs mx-auto mb-8">
            Looking for bulk orders or wholesale pricing? Request a customized quotation from our team.
          </p>
          <Link
            href="/quotation"
            className="rounded-[12px] border border-black text-black hover:bg-black hover:text-white uppercase tracking-widest text-[10px] font-bold h-12 px-10 transition-all flex items-center justify-center w-fit mx-auto"
          >
            Request A Quote
          </Link>
        </div>
      )}

      {/* Support Panel */}
      <Card className="rounded-[12px] border-neutral-200 shadow-none bg-neutral-950 text-white p-8 md:p-12 relative overflow-hidden mt-12">
        <div className="max-w-xl space-y-6 relative z-10">
          <h3 className="font-display text-3xl text-white">Corporate & Wholesale</h3>
          <p className="text-neutral-300 text-sm font-light leading-relaxed">
            Our B2B team specializes in providing tailored solutions for corporate gifting, uniform requirements, and bulk wholesale orders with dedicated logistics support.
          </p>
          <Button className="rounded-[12px] h-12 px-8 bg-white text-black hover:bg-neutral-200 uppercase tracking-widest text-[10px] font-bold transition-all shadow-2xl">
            Talk to an Expert
          </Button>
        </div>
        <FileText className="absolute -bottom-6 -right-6 w-48 h-48 text-white opacity-[0.05] -z-0" />
      </Card>
    </div>
  )
}
