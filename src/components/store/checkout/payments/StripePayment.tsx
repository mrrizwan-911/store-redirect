'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { formatPrice, SITE_COUNTRY } from '@/lib/constants/site'

// Load Stripe once — publishable key is safe to expose
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

// ── Inner form (needs Stripe context) ────────────────────────────────────────

interface CardFormProps {
  orderId: string
  total: number
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
}

function CardForm({ orderId, total, onSuccess, onError }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Create PaymentIntent when component mounts
  useEffect(() => {
    if (!orderId) return
    fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setClientSecret(data.data.clientSecret)
        } else {
          onError(data.error || 'Could not initialise payment. Please refresh.')
        }
      })
      .catch(() => onError('Network error. Please refresh and try again.'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const handleSubmit = async () => {
    if (!stripe || !elements || !clientSecret) return
    if (!name.trim()) {
      toast.error('Please enter the cardholder name')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setProcessing(true)
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: name.trim() },
        },
      })

      if (result.error) {
        const msg = result.error.message || 'Card payment failed'
        toast.error(msg)
        onError(msg)
      } else if (result.paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!')
        onSuccess(result.paymentIntent.id)
      } else {
        onError('Unexpected payment state. Please contact support.')
      }
    } finally {
      setProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '14px',
        color: '#000000',
        fontFamily: '"Inter", system-ui, sans-serif',
        '::placeholder': { color: '#9CA3AF' },
        iconColor: '#000000',
      },
      invalid: { color: '#EF4444', iconColor: '#EF4444' },
    },
    hidePostalCode: SITE_COUNTRY === 'PK', // PK addresses don't use zip for Stripe
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Initialising secure payment...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cardholder Name */}
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1.5">
          Cardholder Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name as on card"
          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none"
          autoComplete="cc-name"
        />
      </div>

      {/* Stripe Card Element — renders in a secure iframe */}
      <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1.5">
          Card Details
        </label>
        <div className="border border-neutral-200 rounded-[var(--radius)] px-4 py-3 focus-within:border-black transition-colors">
          <CardElement
            options={cardElementOptions}
            onChange={e => setCardReady(e.complete && !e.error)}
          />
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
        <span>🔒</span>
        <span>Encrypted & secured by Stripe. We never store your card details.</span>
      </div>

      {/* Pay button */}
      <button
        onClick={handleSubmit}
        disabled={!stripe || !cardReady || processing || !clientSecret}
        className="w-full bg-black text-white rounded-full h-12 text-[11px] uppercase tracking-[0.2em] font-bold
          hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(total)}`
        )}
      </button>
    </div>
  )
}

// ── Outer wrapper with Elements provider ─────────────────────────────────────

interface StripePaymentProps {
  orderId: string
  total: number
  onSuccess: (paymentIntentId: string) => void
  onError: (msg: string) => void
}

export function StripePayment({ orderId, total, onSuccess, onError }: StripePaymentProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border border-neutral-200 rounded-[var(--radius)] bg-neutral-50/50">
        <div className="flex gap-1.5 shrink-0">
          {['💳', '🏦'].map((icon, i) => (
            <div key={i} className="w-8 h-5 bg-neutral-200 rounded text-center text-[10px] leading-5">
              {icon}
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-bold text-sm text-black">Credit / Debit Card</h4>
          <p className="text-xs text-neutral-500">Visa, Mastercard, Amex accepted</p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <CardForm
          orderId={orderId}
          total={total}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  )
}
