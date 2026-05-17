'use client'

interface CodPaymentProps {
  total: number
  currency: string
}

export function CodPayment({ total, currency }: CodPaymentProps) {
  return (
    <div className="border border-neutral-200 rounded-[var(--radius)] p-5 bg-neutral-50/50 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 text-sm">
          💵
        </div>
        <div>
          <h4 className="font-bold text-sm text-black">Cash on Delivery</h4>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            Pay {currency} {Number(total).toLocaleString()} in cash when your order arrives.
            Our delivery partner will collect the exact amount at your door.
          </p>
        </div>
      </div>
      <div className="border-t border-neutral-100 pt-3">
        <ul className="space-y-1">
          {[
            'No advance payment required',
            'Pay only when you receive your order',
            'Please have exact change ready',
          ].map((point) => (
            <li key={point} className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="w-1 h-1 bg-neutral-400 rounded-full shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
