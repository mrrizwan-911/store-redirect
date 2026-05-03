'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const [manualEmail, setManualEmail] = useState('')
  const [isManual, setIsManual] = useState(false)

  useEffect(() => {
    // We strictly avoid automatic unsubscription to provide a clear UX
    // If an email is provided in the URL, we just pre-fill the manual input
    if (email) {
      setManualEmail(email)
    }
    // No automatic API call is made here.
    setStatus('error') // 'error' status is used to trigger the input form view
    setIsManual(true)
  }, [email])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualEmail) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manualEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        setMessage(data.message)
        setIsManual(false)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to unsubscribe.')
        setIsManual(true)
      }
    } catch (error) {
      setStatus('error')
      setMessage('An unexpected error occurred.')
      setIsManual(true)
    }
  }

  return (
    <div className="max-w-md w-full bg-white p-12 border border-neutral-100 shadow-sm text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="space-y-4">
        <h1 className="font-serif text-3xl font-light uppercase tracking-tight text-black">Newsletter</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">Unsubscribe Protocol</p>
      </div>

      <div className="py-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-black animate-spin stroke-[1]" />
            <p className="text-sm text-neutral-500 italic font-serif">Processing your request...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 flex items-center justify-center rounded-full">
              <CheckCircle2 className="w-8 h-8 text-black stroke-[1.5]" />
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed font-sans">
              {message}
            </p>
            <Button
              variant="outline"
              className="rounded-[var(--radius)] border-black text-[10px] font-bold uppercase tracking-widest px-8 py-6 h-auto hover:bg-black hover:text-white transition-all"
              onClick={() => window.location.href = '/'}
            >
              Return to Store
            </Button>
          </div>
        )}

        {(status === 'error' || isManual) && status !== 'loading' && status !== 'success' && (
          <div className="flex flex-col items-center gap-6">
            {!isManual && (
              <div className="w-16 h-16 bg-rose-50 border border-rose-100 flex items-center justify-center rounded-full">
                <XCircle className="w-8 h-8 text-rose-500 stroke-[1.5]" />
              </div>
            )}

            <p className="text-sm text-neutral-600 leading-relaxed font-sans">
              {isManual ? "Please enter your email address to opt-out of our surgical dispatches." : message}
            </p>

            <form onSubmit={handleManualSubmit} className="w-full space-y-4">
              <input
                required
                type="email"
                placeholder="YOUR@EMAIL.COM"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                className="w-full border-b border-neutral-200 py-3 text-sm text-center focus:outline-none focus:border-black transition-colors rounded-[var(--radius)] placeholder:text-neutral-200 uppercase tracking-widest"
              />
              <Button
                type="submit"
                className="w-full rounded-[var(--radius)] bg-black text-white text-[10px] font-bold uppercase tracking-widest h-12"
              >
                Confirm Unsubscribe
              </Button>
            </form>

            {!isManual && (
              <button
                onClick={() => setIsManual(true)}
                className="text-[9px] uppercase tracking-[0.2em] font-bold border-b border-neutral-200 pb-1 hover:text-black hover:border-black transition-all"
              >
                Try Manual Entry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen bg-neutral-50/50 flex items-center justify-center px-6 py-24">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white p-12 border border-neutral-100 shadow-sm text-center">
          <Loader2 className="w-10 h-10 text-black animate-spin mx-auto stroke-[1]" />
        </div>
      }>
        <UnsubscribeContent />
      </Suspense>
    </main>
  )
}
