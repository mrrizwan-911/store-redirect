'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OrdersExportButtonProps {
  status?: string
}

export function OrdersExportButton({ status }: OrdersExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleExport = async () => {
    setIsLoading(true)
    const toastId = toast.loading('Generating orders export…')
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)

      const res = await fetch(`/api/admin/orders/export?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to export orders')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Calnza-Orders-Export-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('Orders exported successfully!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Could not export orders', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="inline-flex items-center gap-2 border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 bg-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FileDown className="w-3.5 h-3.5" />
      )}
      {isLoading ? 'Exporting…' : status ? `Export ${status}` : 'Export PDF'}
    </button>
  )
}
