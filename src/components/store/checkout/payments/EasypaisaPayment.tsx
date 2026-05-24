'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/constants/site'

interface EasypaisaPaymentProps {
  orderId: string
  total: number
  onSuccess: () => void
  onError: (msg: string) => void
}

type FlowState = 'idle' | 'waiting' | 'success' | 'failed'

export function EasypaisaPayment({
  orderId,
  total,
  onSuccess,
  onError,
}: EasypaisaPaymentProps) {
  const [mobile, setMobile] = useState('')
  const [mobileError, setMobileError] = useState('')
  const [flowState, setFlowState] = useState<FlowState>('idle')
  const [countdown, setCountdown] = useState(60)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [])

  const validateMobile = (value: string) => {
    if (!/^03\d{9}$/.test(value)) {
      setMobileError('Enter a valid Pakistani mobile number (03XXXXXXXXX)')
      return false
    }
    setMobileError('')
    return true
  }

  const handlePay = async () => {
    if (!validateMobile(mobile)) return

    setFlowState('waiting')
    setCountdown(60)

    // Start 60-second countdown (EasyPaisa USSD approval window)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          setFlowState('failed')
          onError('Payment approval timed out. Please try again.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    try {
      const res = await fetch('/api/payments/easypaisa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, mode: 'MA', mobileAccountNo: mobile }),
      })

      const data = await res.json()
      clearInterval(countdownRef.current!)

      if (data.success && data.data?.responseCode === '0000') {
        setFlowState('success')
        toast.success('Payment confirmed!')
        onSuccess()
      } else {
        const errMsg = data.error || data.data?.responseDesc || 'Payment failed. Please try again.'
        setFlowState('failed')
        onError(errMsg)
        toast.error(errMsg)
      }
    } catch {
      clearInterval(countdownRef.current!)
      setFlowState('failed')
      const errMsg = 'Network error. Please try again.'
      onError(errMsg)
      toast.error(errMsg)
    }
  }

  const handleRetry = () => {
    setFlowState('idle')
    setCountdown(60)
  }

  return (
    <div className="space-y-4">
      {/* Logo & header */}
      <div className="flex items-center gap-3 p-4 border border-neutral-200 rounded-[var(--radius)] bg-[#1B4332]/5">
        <div className="w-10 h-10 bg-[#1B4332] rounded-full flex items-center justify-center text-white font-black text-xs shrink-0">
          EP
        </div>
        <div>
          <h4 className="font-bold text-sm text-black">EasyPaisa Mobile Account</h4>
          <p className="text-xs text-neutral-500">Instant payment via USSD push notification</p>
        </div>
      </div>

      {flowState === 'idle' && (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1.5">
              EasyPaisa Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={e => {
                setMobile(e.target.value)
                if (mobileError) validateMobile(e.target.value)
              }}
              placeholder="03XXXXXXXXX"
              maxLength={11}
              className={`w-full border rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none transition-colors
                ${mobileError ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'}`}
            />
            {mobileError && (
              <p className="text-xs text-red-500 mt-1">{mobileError}</p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-[var(--radius)] p-3">
            <p className="text-xs text-amber-800 font-bold mb-1">How it works:</p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              <li>Enter your EasyPaisa-registered mobile number</li>
              <li>Tap "Pay Now" — you'll get a USSD pop-up or app notification</li>
              <li>Telenor users: enter your 5-digit EasyPaisa PIN</li>
              <li>Other users: open EasyPaisa app → Side Menu → My Approvals</li>
              <li>Approve within 60 seconds</li>
            </ol>
          </div>

          <button
            onClick={handlePay}
            disabled={mobile.length < 11}
            className="w-full bg-[#1B4332] text-white rounded-full h-12 text-[11px] uppercase tracking-[0.2em] font-bold
              hover:bg-[#145229] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Pay {formatPrice(total)} Now
          </button>
        </>
      )}

      {flowState === 'waiting' && (
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 rounded-full border-4 border-[#1B4332] border-t-transparent animate-spin mx-auto" />
          <div>
            <p className="font-bold text-sm text-black">Waiting for your approval</p>
            <p className="text-xs text-neutral-500 mt-1">
              Check your phone for a USSD pop-up or EasyPaisa app notification
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            <span className="text-xs text-neutral-500">
              Expires in <strong className={countdown <= 15 ? 'text-red-500' : 'text-black'}>{countdown}s</strong>
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 italic">
            Non-Telenor users: EasyPaisa App → Side Menu → My Approvals
          </p>
        </div>
      )}

      {flowState === 'success' && (
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-2xl">✓</div>
          <p className="font-bold text-sm text-emerald-700">Payment Confirmed!</p>
          <p className="text-xs text-neutral-500">Your EasyPaisa payment was successful.</p>
        </div>
      )}

      {flowState === 'failed' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-100 rounded-[var(--radius)] p-4 text-center">
            <p className="font-bold text-sm text-red-700">Payment Failed</p>
            <p className="text-xs text-red-500 mt-1">The payment was not approved in time or was declined.</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full border-2 border-black text-black rounded-full h-11 text-[11px] uppercase tracking-[0.2em] font-bold
              hover:bg-black hover:text-white transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
