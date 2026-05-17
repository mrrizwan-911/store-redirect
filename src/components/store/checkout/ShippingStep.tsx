'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { SITE_COUNTRY, formatPrice } from '@/lib/constants/site'

interface ShippingOption {
  id: string
  name: string
  description: string | null
  price: string | number
  estimatedDays: string | null
  freeShippingThreshold: string | number | null
}

interface ShippingStepProps {
  subtotal: number
  selectedOptionId: string
  onSelect: (option: ShippingOption) => void
  contactName: string
  contactEmail: string
  addressLine: string
  onChangeAddress: () => void
}

export function ShippingStep({
  subtotal,
  selectedOptionId,
  onSelect,
  contactName,
  contactEmail,
  addressLine,
  onChangeAddress,
}: ShippingStepProps) {
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/shipping-options?country=${SITE_COUNTRY}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOptions(data.data)
          // Auto-select first option if nothing selected
          if (!selectedOptionId && data.data.length > 0) {
            onSelect(data.data[0])
          }
        } else {
          setError('Could not load shipping options. Please refresh.')
        }
      })
      .catch(() => setError('Network error. Please refresh.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getEffectivePrice = (option: ShippingOption): number => {
    const price = Number(option.price)
    const threshold = option.freeShippingThreshold !== null
      ? Number(option.freeShippingThreshold)
      : null
    if (threshold !== null && subtotal >= threshold) return 0
    return price
  }

  return (
    <div className="space-y-4">
      {/* Address summary */}
      <div className="border border-neutral-200 rounded-[var(--radius)] p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 mb-1">Contact</p>
          <p className="text-sm font-bold text-black truncate">{contactName}</p>
          <p className="text-sm text-neutral-600 truncate">{contactEmail}</p>
        </div>
        <button
          onClick={onChangeAddress}
          className="text-[10px] uppercase tracking-widest font-bold text-black underline whitespace-nowrap self-start sm:self-auto"
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
          className="text-[10px] uppercase tracking-widest font-bold text-black underline whitespace-nowrap self-start sm:self-auto"
        >
          Change
        </button>
      </div>

      {/* Shipping options */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="border border-neutral-100 rounded-[var(--radius)] p-4 animate-pulse h-16 bg-neutral-50" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-red-100 bg-red-50 rounded-[var(--radius)] p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : options.length === 0 ? (
        <div className="border border-neutral-100 rounded-[var(--radius)] p-6 text-center">
          <p className="text-sm text-neutral-400">No shipping options available for your region.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map((option) => {
            const effectivePrice = getEffectivePrice(option)
            const isFree = effectivePrice === 0 && Number(option.price) > 0
            const isSelected = selectedOptionId === option.id

            return (
              <div
                key={option.id}
                onClick={() => onSelect(option)}
                className={`border rounded-[var(--radius)] p-4 cursor-pointer transition-all
                  flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3
                  ${isSelected
                    ? 'border-black bg-neutral-50 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-400'
                  }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                    ${isSelected ? 'border-black' : 'border-neutral-300'}`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-black">{option.name}</h4>
                    {option.description && (
                      <p className="text-xs text-neutral-500 mt-0.5">{option.description}</p>
                    )}
                    {isFree && option.freeShippingThreshold && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">
                        ✓ Free for orders over {formatPrice(Number(option.freeShippingThreshold))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-7 xs:pl-0">
                  {isFree ? (
                    <div>
                      <span className="font-bold text-sm text-emerald-600 block">Free</span>
                      <span className="text-xs text-neutral-400 line-through">
                        {formatPrice(Number(option.price))}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-sm text-black">
                      {Number(option.price) === 0 ? 'Free' : formatPrice(Number(option.price))}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
