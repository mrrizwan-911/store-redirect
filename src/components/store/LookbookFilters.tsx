'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FilterGroup {
  label: string
  paramKey: 'gender' | 'season' | 'occasion'
  values: string[]
}

interface LookbookFiltersProps {
  filterGroups: FilterGroup[]
  currentParams: {
    gender?: string
    season?: string
    occasion?: string
  }
}

export function LookbookFilters({ filterGroups, currentParams }: LookbookFiltersProps) {
  const router = useRouter()

  const isAllActive =
    !currentParams.gender && !currentParams.season && !currentParams.occasion

  const buildHref = useCallback(
    (paramKey: string, value: string) => {
      const params = new URLSearchParams()
      if (currentParams.gender) params.set('gender', currentParams.gender)
      if (currentParams.season) params.set('season', currentParams.season)
      if (currentParams.occasion) params.set('occasion', currentParams.occasion)

      const current = params.get(paramKey)
      if (current === value) {
        params.delete(paramKey)
      } else {
        params.set(paramKey, value)
      }

      const str = params.toString()
      return str ? `/lookbook?${str}` : '/lookbook'
    },
    [currentParams]
  )

  const isActive = (paramKey: string, value: string) =>
    (currentParams as any)[paramKey] === value

  return (
    <div className="w-full">
      {/* Mobile: full-width scrollable single row */}
      <div className="block sm:hidden">
        <div
          className="flex gap-2 overflow-x-auto pb-2 lookbook-filter-scroll"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            onClick={() => router.push('/lookbook')}
            className={`flex-shrink-0 px-4 py-2 text-xs uppercase tracking-widest border transition-all duration-200 rounded-full ${
              isAllActive
                ? 'border-black bg-black text-white'
                : 'border-neutral-200 text-neutral-500 hover:border-black hover:text-black'
            }`}
          >
            All
          </button>
          {filterGroups.map(group =>
            group.values.map(value => (
              <button
                key={`${group.paramKey}-${value}`}
                onClick={() => router.push(buildHref(group.paramKey, value))}
                className={`flex-shrink-0 px-4 py-2 text-xs uppercase tracking-widest border transition-all duration-200 rounded-full ${
                  isActive(group.paramKey, value)
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 text-neutral-500 hover:border-black hover:text-black'
                }`}
              >
                {value}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Desktop: grouped filter bar */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-8 flex-wrap justify-center">
          {/* All pill */}
          <button
            onClick={() => router.push('/lookbook')}
            className={`px-5 py-2 text-[10px] uppercase tracking-[0.2em] border transition-all duration-200 rounded-full font-medium ${
              isAllActive
                ? 'border-black bg-black text-white shadow-sm'
                : 'border-neutral-200 text-neutral-400 hover:border-black hover:text-black'
            }`}
          >
            All Looks
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-neutral-200" />

          {filterGroups.map((group, gi) => (
            <div key={group.paramKey} className="flex items-center gap-2">
              {gi > 0 && <div className="w-px h-5 bg-neutral-100 mr-2" />}
              <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-300 font-bold mr-1 select-none">
                {group.label}
              </span>
              {/* If many values, use horizontal scroll container */}
              <div
                className="flex gap-2 overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {group.values.map(value => (
                  <button
                    key={value}
                    onClick={() => router.push(buildHref(group.paramKey, value))}
                    className={`flex-shrink-0 px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] border transition-all duration-200 rounded-full ${
                      isActive(group.paramKey, value)
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-black'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .lookbook-filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
