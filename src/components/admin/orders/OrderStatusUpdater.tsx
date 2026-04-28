'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OrderStatusUpdaterProps {
  orderId: string
  currentStatus: string
  trackingNumber?: string | null
  carrier?: string | null
  notes?: string | null
}

const STATUS_OPTIONS = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED'
]

export function OrderStatusUpdater({ orderId, currentStatus, trackingNumber, carrier, notes }: OrderStatusUpdaterProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [tracking, setTracking] = useState(trackingNumber || '')
  const [carrierName, setCarrierName] = useState(carrier || '')
  const [internalNotes, setInternalNotes] = useState(notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpdate = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: tracking,
          carrier: carrierName,
          notes: internalNotes
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Order updated successfully.')
        router.refresh()
      } else {
        setMessage(data.error || 'Failed to update order.')
      }
    } catch (e) {
      setMessage('An error occurred while updating.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white border border-black p-6 rounded-none font-sans flex flex-col gap-4">
      <h3 className="text-lg font-bold font-serif uppercase">Update Order</h3>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-neutral-500 uppercase">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-black p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black rounded-none"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-neutral-500 uppercase">Tracking Number</label>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. 12345678"
          className="border border-black p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black rounded-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-neutral-500 uppercase">Carrier</label>
        <select
          value={carrierName}
          onChange={(e) => setCarrierName(e.target.value)}
          className="border border-black p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black rounded-none"
        >
          <option value="">Select Carrier</option>
          <option value="TCS">TCS</option>
          <option value="Leopards">Leopards</option>
          <option value="Trax">Trax</option>
          <option value="M&P">M&P</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-neutral-500 uppercase">Internal Notes</label>
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          rows={3}
          placeholder="Add notes..."
          className="border border-black p-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black rounded-none resize-none"
        />
      </div>

      <button
        onClick={handleUpdate}
        disabled={isSaving}
        className="w-full bg-black text-white py-3 text-sm font-bold uppercase transition-colors hover:bg-neutral-800 disabled:opacity-50 mt-2"
      >
        {isSaving ? 'Saving...' : 'Update Status'}
      </button>

      {message && (
        <p className={`text-xs text-center mt-2 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
