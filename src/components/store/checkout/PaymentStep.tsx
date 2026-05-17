'use client'

import { useState } from 'react'
import { getEnabledPaymentMethods, formatPrice } from '@/lib/constants/site'
import { CodPayment } from './payments/CodPayment'
import { StripePayment } from './payments/StripePayment'
import { EasypaisaPayment } from './payments/EasypaisaPayment'

interface PaymentStepProps {
  // Order must be created before payment step (needed for Stripe intent + EasyPaisa)
  orderId: string
  total: number
  currency: string
  contactName: string
  contactEmail: string
  addressLine: string
  isGift: boolean
  giftMessage: string
  selectedMethod: string
  onSelectMethod: (method: string) => void
  onSetGift: (v: boolean) => void
  onSetGiftMessage: (v: string) => void
  onChangeAddress: () => void
  // Called when payment is actually complete (stripe/ep), or when COD selected
  onPaymentComplete: (data?: { stripePaymentIntentId?: string }) => void
}

const METHOD_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  CARD: 'Credit / Debit Card',
  EASYPAISA: 'EasyPaisa Mobile Account',
}

const METHOD_ICONS: Record<string, string> = {
  COD: '💵',
  CARD: '💳',
  EASYPAISA: '📱',
}

export function PaymentStep({
  orderId,
  total,
  currency,
  contactName,
  contactEmail,
  addressLine,
  isGift,
  giftMessage,
  selectedMethod,
  onSelectMethod,
  onSetGift,
  onSetGiftMessage,
  onChangeAddress,
  onPaymentComplete,
}: PaymentStepProps) {
  const enabledMethods = getEnabledPaymentMethods()
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handlePaymentError = (msg: string) => {
    setPaymentError(msg)
  }

  const handleStripeSuccess = (paymentIntentId: string) => {
    setPaymentError(null)
    onPaymentComplete({ stripePaymentIntentId: paymentIntentId })
  }

  const handleEasypaisaSuccess = () => {
    setPaymentError(null)
    onPaymentComplete()
  }

  return (
    <div className="space-y-5">
      {/* Address summary bars */}
      <div className="border border-neutral-200 rounded-[var(--radius)] p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">Contact</p>
          <p className="text-sm font-bold text-black truncate">{contactName}</p>
          <p className="text-sm text-neutral-600 truncate">{contactEmail}</p>
        </div>
        <button
          onClick={onChangeAddress}
          className="text-[10px] uppercase tracking-widest font-bold text-black underline whitespace-nowrap"
        >
          Change
        </button>
      </div>
      <div className="border border-neutral-200 rounded-[var(--radius)] p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">Ship to</p>
          <p className="text-sm text-black truncate">{addressLine}</p>
        </div>
        <button
          onClick={onChangeAddress}
          className="text-[10px] uppercase tracking-widest font-bold text-black underline whitespace-nowrap"
        >
          Change
        </button>
      </div>

      {/* Payment method selector */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-3">
          Payment Method
        </p>
        <div className="space-y-2">
          {enabledMethods.map((method) => (
            <button
              key={method}
              onClick={() => { onSelectMethod(method); setPaymentError(null) }}
              className={`w-full border rounded-[var(--radius)] p-4 flex items-center gap-3 text-left transition-all
                ${selectedMethod === method
                  ? 'border-black bg-neutral-50 shadow-sm'
                  : 'border-neutral-200 hover:border-neutral-400'
                }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                ${selectedMethod === method ? 'border-black' : 'border-neutral-300'}`}
              >
                {selectedMethod === method && (
                  <div className="w-2 h-2 bg-black rounded-full" />
                )}
              </div>
              <span className="text-base mr-1">{METHOD_ICONS[method] || '💰'}</span>
              <span className="font-bold text-sm text-black">
                {METHOD_LABELS[method] || method}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Per-method payment UI */}
      {selectedMethod === 'COD' && (
        <CodPayment total={total} currency={currency} />
      )}

      {selectedMethod === 'CARD' && orderId && (
        <StripePayment
          orderId={orderId}
          total={total}
          onSuccess={handleStripeSuccess}
          onError={handlePaymentError}
        />
      )}

      {selectedMethod === 'EASYPAISA' && orderId && (
        <EasypaisaPayment
          orderId={orderId}
          total={total}
          onSuccess={handleEasypaisaSuccess}
          onError={handlePaymentError}
        />
      )}

      {paymentError && (
        <div className="border border-red-100 bg-red-50 rounded-[var(--radius)] p-3">
          <p className="text-xs text-red-600">{paymentError}</p>
        </div>
      )}

      {/* Gift option */}
      <div className="border-t border-neutral-200 pt-5">
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={isGift}
            onChange={e => onSetGift(e.target.checked)}
            className="accent-black w-4 h-4 shrink-0"
          />
          <span className="text-sm font-bold">🎁 This is a gift</span>
        </label>
        {isGift && (
          <textarea
            placeholder="Gift message (optional)..."
            value={giftMessage}
            onChange={e => onSetGiftMessage(e.target.value)}
            className="w-full border border-neutral-200 rounded-[var(--radius)] p-3 text-sm focus:border-black outline-none resize-none h-20"
          />
        )}
      </div>
    </div>
  )
}
