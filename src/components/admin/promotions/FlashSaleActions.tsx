'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FlashSaleActionsProps {
  saleId: string
  saleName: string
}

export function FlashSaleActions({ saleId, saleName }: FlashSaleActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/flash-sales/${saleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Flash sale deleted successfully')
      router.refresh()
    } catch {
      toast.error('Delete failed. Please try again.')
      setDeleting(false)
    }
    setShowConfirm(false)
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href={`/d8f2a1/admin/flash-sales/${saleId}/edit`}
        className="text-[#A3A3A3] hover:text-[#000000] transition-colors"
      >
        <Edit className="h-4 w-4" />
      </Link>

      <button
        onClick={() => setShowConfirm(true)}
        className="text-[#A3A3A3] hover:text-[#EF4444] transition-colors"
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 w-full max-w-sm border border-[#E5E5E5] rounded-2xl shadow-2xl">
            <p className="font-bold text-lg text-[#000000] mb-2">Delete Flash Sale?</p>
            <p className="text-sm text-[#737373] mb-8 leading-relaxed">
              Are you sure you want to delete &ldquo;{saleName}&rdquo;? This will immediately remove all discounts applied by this sale.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#737373] hover:text-[#000000] transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors disabled:opacity-50 rounded-xl"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
