'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Download,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'
import { useParams, useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuotationItem {
  productId: string
  productName: string
  quantity: number
  unitPrice?: number
  discountAmount?: number
  notes?: string
}

interface QuotationData {
  id: string
  name: string
  email: string
  company: string | null
  phone: string | null
  status: string
  items: QuotationItem[]
  createdAt: string
  expiresAt: string | null
  pdfUrl: string | null
  aiDraft: string | null
}

// ─── Timeline definition ──────────────────────────────────────────────────────

type TimelineStep = {
  id: string
  label: string
  description: string
  icon: React.ElementType
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 'PENDING',
    label: 'Request Submitted',
    description: 'Your quotation request has been received and is awaiting review by our team.',
    icon: Clock,
  },
  {
    id: 'SENT',
    label: 'Quotation Sent',
    description: 'Our team has reviewed your request and sent a formal quotation to your email.',
    icon: Send,
  },
  {
    id: 'ACCEPTED',
    label: 'Accepted',
    description: 'You have accepted the quotation. Our team will reach out to finalise the order.',
    icon: CheckCircle,
  },
  {
    id: 'CONVERTED',
    label: 'Converted to Order',
    description: 'Your quotation has been converted to a confirmed order.',
    icon: RefreshCw,
  },
]

const STATUS_ORDER = ['PENDING', 'SENT', 'ACCEPTED', 'CONVERTED']

function getStepState(stepId: string, currentStatus: string): 'completed' | 'current' | 'upcoming' {
  if (currentStatus === 'REJECTED' || currentStatus === 'EXPIRED') {
    if (stepId === 'PENDING') return 'completed'
    return 'upcoming'
  }
  const stepIndex = STATUS_ORDER.indexOf(stepId)
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'Pending Review',     color: 'bg-amber-50 text-amber-700 border-amber-200' },
  SENT:      { label: 'Quote Sent',         color: 'bg-blue-50 text-blue-700 border-blue-200' },
  ACCEPTED:  { label: 'Accepted',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED:  { label: 'Rejected',           color: 'bg-rose-50 text-rose-700 border-rose-200' },
  CONVERTED: { label: 'Converted to Order', color: 'bg-black text-white border-black' },
  EXPIRED:   { label: 'Expired',            color: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountQuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const [quotation, setQuotation] = useState<QuotationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  const id = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!id) return

    fetch(`/api/account/quotations/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setQuotation(res.data)
        else toast.error('Quotation not found')
      })
      .catch(() => toast.error('Failed to load quotation'))
      .finally(() => setIsLoading(false))
  }, [id, isAuthenticated])

  async function handleDownloadPDF() {
    if (!quotation) return
    setDownloadingPDF(true)
    const toastId = toast.loading('Preparing PDF…')
    try {
      // If pdfUrl stored, open directly; otherwise hit the admin download route
      if (quotation.pdfUrl) {
        window.open(quotation.pdfUrl, '_blank')
        toast.success('PDF opened', { id: toastId })
      } else {
        // Customer-facing download via account route
        const res = await fetch(`/api/account/quotations/${quotation.id}/pdf`)
        if (!res.ok) throw new Error('PDF not yet generated')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Calnza-Quotation-${quotation.id.slice(-8).toUpperCase()}.pdf`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('PDF downloaded', { id: toastId })
      }
    } catch (e: any) {
      toast.error(e.message || 'PDF not available yet. It will be emailed once the quote is sent.', { id: toastId })
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="py-24 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto" />
        <p className="text-neutral-500 font-bold text-sm">Quotation not found.</p>
        <Link href="/account/quotations" className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">
          Back to Quotations
        </Link>
      </div>
    )
  }

  const s = statusLabels[quotation.status] || { label: quotation.status, color: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
  const isRejectedOrExpired = quotation.status === 'REJECTED' || quotation.status === 'EXPIRED'

  const hasPrices = quotation.items.some((i) => i.unitPrice && i.unitPrice > 0)
  const subtotal = quotation.items.reduce((acc, i) => acc + (i.unitPrice || 0) * i.quantity, 0)
  const totalDiscount = quotation.items.reduce((acc, i) => acc + (i.discountAmount || 0) * i.quantity, 0)
  const grandTotal = subtotal - totalDiscount

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-black">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Link
          href="/account/quotations"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Quotations
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-5">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
              Quotation Details
            </p>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight text-black">
              #{quotation.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-[11px] text-neutral-400 font-bold">
              Submitted {new Date(quotation.createdAt).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {quotation.expiresAt && (
                <> · Valid until {new Date(quotation.expiresAt).toLocaleDateString('en-PK', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className={cn('inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-full', s.color)}>
              {s.label}
            </span>

            {(quotation.status === 'SENT' || quotation.pdfUrl) && (
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="inline-flex items-center gap-2 h-9 px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                {downloadingPDF ? (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Rejected / Expired Banner ─────────────────────────────────── */}
      {isRejectedOrExpired && (
        <div className={cn(
          'flex items-start gap-3 p-4 border',
          quotation.status === 'REJECTED'
            ? 'bg-rose-50 border-rose-200'
            : 'bg-neutral-50 border-neutral-200'
        )}>
          <XCircle className={cn('w-4 h-4 shrink-0 mt-0.5', quotation.status === 'REJECTED' ? 'text-rose-500' : 'text-neutral-400')} />
          <div>
            <p className={cn('text-[12px] font-bold', quotation.status === 'REJECTED' ? 'text-rose-700' : 'text-neutral-600')}>
              {quotation.status === 'REJECTED'
                ? 'This quotation was not accepted. You may submit a new request.'
                : 'This quotation has expired. You may submit a new request.'}
            </p>
            <Link href="/quotation" className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 mt-1 inline-block text-black">
              Request New Quotation →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Timeline + Items ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline */}
          <div className="border border-neutral-200 bg-white">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
                Quotation Journey
              </h2>
            </div>
            <div className="p-5">
              <div className="space-y-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const state = getStepState(step.id, quotation.status)
                  const Icon = step.icon
                  const isLast = idx === TIMELINE_STEPS.length - 1
                  return (
                    <div key={step.id} className="flex gap-4">
                      {/* Icon + line */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                          state === 'completed' ? 'bg-black' :
                          state === 'current' ? 'bg-black' :
                          'bg-neutral-100'
                        )}>
                          <Icon className={cn('w-3.5 h-3.5', state === 'upcoming' ? 'text-neutral-400' : 'text-white')} />
                        </div>
                        {!isLast && (
                          <div className={cn('w-0.5 flex-1 my-1', state === 'completed' ? 'bg-black' : 'bg-neutral-200')} style={{ minHeight: 24 }} />
                        )}
                      </div>

                      {/* Content */}
                      <div className={cn('pb-6', isLast && 'pb-0')}>
                        <p className={cn(
                          'text-[12px] font-black uppercase tracking-widest',
                          state === 'upcoming' ? 'text-neutral-300' : 'text-black'
                        )}>
                          {step.label}
                          {state === 'current' && (
                            <span className="ml-2 text-[9px] font-bold bg-black text-white px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </p>
                        <p className={cn('text-[11px] mt-1 leading-relaxed', state === 'upcoming' ? 'text-neutral-300' : 'text-neutral-500')}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border border-neutral-200 bg-white">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
                Requested Items
              </h2>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full text-left">
                <thead className="border-b border-neutral-100">
                  <tr>
                    {['Product', 'Qty', 'Unit Price', 'Discount', 'Line Total'].map((h) => (
                      <th key={h} className="py-3 px-5 text-[9px] uppercase tracking-widest font-bold text-neutral-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {quotation.items.map((item, i) => {
                    const finalUnit = (item.unitPrice || 0) - (item.discountAmount || 0)
                    const lineTotal = finalUnit * item.quantity
                    return (
                      <tr key={i}>
                        <td className="py-4 px-5">
                          <p className="text-[12px] font-bold text-black">{item.productName}</p>
                          {item.notes && <p className="text-[10px] text-neutral-400 mt-0.5">{item.notes}</p>}
                        </td>
                        <td className="py-4 px-5 text-[12px] font-bold text-black">{item.quantity}</td>
                        <td className="py-4 px-5 text-[12px] font-mono text-black">
                          {item.unitPrice ? `PKR ${item.unitPrice.toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-4 px-5 text-[12px] font-mono text-neutral-500">
                          {item.discountAmount ? `-PKR ${item.discountAmount.toLocaleString('en-PK')}` : '—'}
                        </td>
                        <td className="py-4 px-5 text-[12px] font-mono font-bold text-black">
                          {item.unitPrice ? `PKR ${lineTotal.toLocaleString('en-PK')}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {quotation.items.map((item, i) => {
                const finalUnit = (item.unitPrice || 0) - (item.discountAmount || 0)
                const lineTotal = finalUnit * item.quantity
                return (
                  <div key={i} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-[12px] font-bold text-black">{item.productName}</p>
                      <span className="text-[11px] font-bold text-neutral-500">×{item.quantity}</span>
                    </div>
                    {item.notes && <p className="text-[10px] text-neutral-400">{item.notes}</p>}
                    {item.unitPrice ? (
                      <div className="flex flex-wrap gap-3 text-[10px] font-bold font-mono">
                        <span className="text-neutral-500">Unit: PKR {item.unitPrice.toLocaleString('en-PK')}</span>
                        {item.discountAmount ? (
                          <span className="text-neutral-400">Disc: -PKR {item.discountAmount.toLocaleString('en-PK')}</span>
                        ) : null}
                        <span className="text-black">Total: PKR {lineTotal.toLocaleString('en-PK')}</span>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Right: Summary ────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Request summary */}
          <div className="border border-neutral-200 bg-white">
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
                Request Summary
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <SummaryRow label="Ref" value={`#${quotation.id.slice(-8).toUpperCase()}`} mono />
              <SummaryRow label="Items" value={`${quotation.items.length} products`} />
              <SummaryRow label="Total Units" value={quotation.items.reduce((a, i) => a + i.quantity, 0).toString()} />
              {quotation.company && <SummaryRow label="Company" value={quotation.company} />}
              {quotation.expiresAt && (
                <SummaryRow
                  label="Valid Until"
                  value={new Date(quotation.expiresAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                />
              )}
            </div>
          </div>

          {/* Pricing summary — shown only when admin has set prices */}
          {hasPrices && (
            <div className="border border-neutral-200 bg-white">
              <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
                  Pricing
                </h3>
              </div>
              <div className="p-5 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-mono">PKR {subtotal.toLocaleString('en-PK')}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[11px] font-bold text-neutral-400">
                    <span>Total Discount</span>
                    <span className="font-mono">-PKR {totalDiscount.toLocaleString('en-PK')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[14px] font-black text-black border-t border-neutral-200 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span className="font-mono">PKR {grandTotal.toLocaleString('en-PK')}</span>
                </div>
              </div>
            </div>
          )}

          {/* PDF Download CTA */}
          {(quotation.status === 'SENT' || quotation.status === 'ACCEPTED' || quotation.pdfUrl) && (
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="w-full flex items-center justify-center gap-2 h-12 bg-black text-white text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all"
            >
              {downloadingPDF ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Quotation PDF
            </button>
          )}

          {/* Pending state message */}
          {quotation.status === 'PENDING' && (
            <div className="border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                Under Review
              </p>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                Our team is reviewing your request. You'll receive an email with the formal
                quotation and PDF once it's ready — typically within 1–2 business days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</span>
      <span className={cn('text-[11px] font-bold text-black text-right', mono && 'font-mono')}>{value}</span>
    </div>
  )
}
