'use client'

import { cn } from '@/lib/utils'

interface Variant {
  id: string
  title: string
  optionValues: any
  stock: number
  price?: number | null
}

interface VariantOption {
  name: string
  values: string[]
}

interface VariantSelectorProps {
  variantOptions: VariantOption[]
  variants: Variant[]
  selectedOptions: Record<string, string>
  onOptionsChange: (options: Record<string, string>) => void
}

const COLOR_MAP: Record<string, string> = {
  White: '#FFFFFF',
  Black: '#000000',
  Navy: '#001f54',
  Beige: '#f5f0e8',
  Red: '#CC0000',
  Green: '#228B22',
  Blue: '#0000FF',
  Gray: '#808080',
  Gold: '#E8D5B0',
}

export default function VariantSelector({
  variantOptions,
  variants,
  selectedOptions,
  onOptionsChange,
}: VariantSelectorProps) {
  if (!variantOptions || variantOptions.length === 0) return null

  const isValueAvailable = (optionName: string, optionValue: string) => {
    return variants.some((v) => {
      const vOpts = v.optionValues || {}
      if (vOpts[optionName] !== optionValue) return false

      let matchesOthers = true
      for (const [k, val] of Object.entries(selectedOptions)) {
        if (k !== optionName && vOpts[k] !== val) matchesOthers = false
      }
      return matchesOthers && v.stock > 0
    })
  }

  return (
    <div className="space-y-8">
      {variantOptions.map((option) => (
        <div key={option.name} className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
              {option.name}: <span className="text-text-primary ml-1">{selectedOptions[option.name] || 'Select'}</span>
            </h3>
            {option.name.toLowerCase() === 'size' && (
              <button className="text-xs text-text-secondary underline underline-offset-4 hover:text-primary transition-colors">
                Size Guide
              </button>
            )}
          </div>

          <div className={option.name.toLowerCase() === 'color' ? 'flex flex-wrap gap-3' : 'grid grid-cols-5 gap-2'}>
            {option.values.map((val) => {
              const isSelected = selectedOptions[option.name] === val
              const isAvailable = isValueAvailable(option.name, val)

              if (option.name.toLowerCase() === 'color') {
                const hex = COLOR_MAP[val] || '#CCCCCC'
                return (
                  <button
                    key={val}
                    onClick={() => onOptionsChange({ ...selectedOptions, [option.name]: val })}
                    className={cn(
                      'relative w-10 h-10 rounded-full border transition-all duration-200',
                      isSelected ? 'ring-2 ring-primary ring-offset-2 border-primary' : 'border-border hover:scale-110',
                      !isAvailable && 'opacity-40 grayscale-[0.5]'
                    )}
                    title={val}
                  >
                    <span
                      className="absolute inset-0.5 rounded-full border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-[1px] bg-neutral-400 rotate-45" />
                      </div>
                    )}
                  </button>
                )
              }

              return (
                <button
                  key={val}
                  onClick={() => onOptionsChange({ ...selectedOptions, [option.name]: val })}
                  disabled={!isAvailable && !isSelected}
                  className={cn(
                    'h-12 border text-sm font-medium transition-all duration-200 uppercase px-2',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-text-primary border-border hover:border-text-primary',
                    !isAvailable && 'text-text-secondary relative overflow-hidden'
                  )}
                >
                  {val}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-neutral-300 -rotate-45" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
