'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ProductActionsProps {
  productId: string
  productName: string
}

export function ProductActions({ productId, productName }: ProductActionsProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Product deleted successfully')
      router.refresh()
    } catch {
      toast.error('Delete failed. Please try again.')
      setDeleting(false)
    }
    setShowConfirm(false)
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/d8f2a1/admin/products/${productId}/edit`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 w-full max-w-sm border border-[#E5E5E5]">
            <p className="font-medium text-[#000000] mb-1">Delete product?</p>
            <p className="text-sm text-[#737373] mb-6">
              &ldquo;{productName}&rdquo; will be deactivated and hidden from the store.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-[#737373] hover:text-[#000000] transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors disabled:opacity-50"
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
