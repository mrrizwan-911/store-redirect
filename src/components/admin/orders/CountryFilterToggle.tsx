'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
  currentCountry: string
  resourceName?: string
}

export function CountryFilterToggle({ currentCountry, resourceName = 'Orders' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setCountry = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('country', value)
    } else {
      params.delete('country')
    }
    params.delete('page')  // reset to page 1 on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className={`w-full flex rounded-xl overflow-hidden border border-neutral-200 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      {/* All orders */}
      <button
        onClick={() => setCountry('')}
        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all
          ${!currentCountry
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-400 hover:bg-neutral-50'
          }`}
      >
        All {resourceName}
      </button>

      {/* Pakistan */}
      <button
        onClick={() => setCountry('PK')}
        className={`flex-[2] py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-l border-neutral-200
          ${currentCountry === 'PK'
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-400 hover:bg-neutral-50'
          }`}
      >
        <span className="text-base leading-none">🇵🇰</span>
        <span>Pakistan</span>
      </button>

      {/* United Kingdom */}
      <button
        onClick={() => setCountry('UK')}
        className={`flex-[2] py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-l border-neutral-200
          ${currentCountry === 'UK'
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-400 hover:bg-neutral-50'
          }`}
      >
        <span className="text-base leading-none">🇬🇧</span>
        <span>United Kingdom</span>
      </button>
    </div>
  )
}
