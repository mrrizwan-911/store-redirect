'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const PRESETS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'year', label: 'This Year' },
]

interface Props {
  onPresetChange: (preset: string) => void
  onCustomRange: (start: Date, end: Date) => void
  compareEnabled: boolean
  onCompareToggle: () => void
}

export function DateRangeSelector({ onPresetChange, onCustomRange, compareEnabled, onCompareToggle }: Props) {
  const [active, setActive] = useState('30d')
  const [customOpen, setCustomOpen] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  function handlePreset(v: string) {
    setActive(v)
    onPresetChange(v)
  }

  function handleCustomApply() {
    if (customStart && customEnd) {
      onCustomRange(new Date(customStart), new Date(customEnd + 'T23:59:59'))
      setCustomOpen(false)
      setActive('custom')
    }
  }

  return (
    <div className="an-card !p-3 sm:!p-4 space-y-3">
      {/* Preset tabs + Custom */}
      <div className="flex flex-wrap items-center gap-1">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`
              px-3 py-1.5 text-[11px] font-medium transition-all rounded-[1px]
              ${active === p.value
                ? 'text-[var(--an-ink)] border-b-2 border-[var(--an-ink)]'
                : 'text-[var(--an-ink-3)] hover:text-[var(--an-ink-2)]'
              }
            `}
          >
            {p.label}
          </button>
        ))}

        {/* Custom button */}
        <div className="relative">
          <button
            onClick={() => setCustomOpen(v => !v)}
            className={`
              flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-all rounded-[1px]
              ${active === 'custom'
                ? 'text-[var(--an-ink)] border-b-2 border-[var(--an-ink)]'
                : 'text-[var(--an-ink-3)] hover:text-[var(--an-ink-2)]'
              }
            `}
          >
            Custom <ChevronDown className="w-3 h-3" />
          </button>

          {customOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCustomOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-[var(--an-border)] rounded-[2px] shadow-lg z-20 p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="w-full border border-[var(--an-border)] rounded-[2px] px-2 py-1.5 text-[12px] text-[var(--an-ink)] bg-white focus:outline-none focus:border-[var(--an-ink)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[var(--an-ink-3)]">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="w-full border border-[var(--an-border)] rounded-[2px] px-2 py-1.5 text-[12px] text-[var(--an-ink)] bg-white focus:outline-none focus:border-[var(--an-ink)]"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full bg-[var(--an-ink)] text-white text-[11px] py-2 rounded-[2px] disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Apply Range
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compare toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCompareToggle}
          className={`
            w-8 h-4 rounded-full transition-colors relative shrink-0
            ${compareEnabled ? 'bg-[var(--an-ink)]' : 'bg-[var(--an-border-strong)]'}
          `}
          role="switch"
          aria-checked={compareEnabled}
        >
          <span
            className={`
              absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform
              ${compareEnabled ? 'translate-x-4' : 'translate-x-0.5'}
            `}
          />
        </button>
        <span className="text-[11px] text-[var(--an-ink-2)]">
          Compare to previous period
        </span>
      </div>
    </div>
  )
}
