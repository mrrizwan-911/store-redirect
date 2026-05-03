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
  Silver: '#C0C0C0',
  Pink: '#FFC0CB',
  Yellow: '#FFFF00',
  Orange: '#FFA500',
  Purple: '#800080',
  Brown: '#A52A2A',
  Maroon: '#800000',
  Olive: '#808000',
}

const getColorHex = (colorName: string) => {
  if (COLOR_MAP[colorName]) return COLOR_MAP[colorName]
  return colorName.toLowerCase()
}

export default function VariantSelector({
  variantOptions,
  variants,
  selectedOptions,
  onOptionsChange,
}: VariantSelectorProps) {
  if (!variantOptions || variantOptions.length === 0) return null

  // Skip rendering a section if only value is "DEFAULT"
  const filteredOptions = variantOptions.filter(opt =>
    !(opt.values.length === 1 && (opt.values[0] === 'DEFAULT' || opt.values[0] === 'default'))
  )

  if (filteredOptions.length === 0) return null

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
      {filteredOptions.map((option) => (
        <div key={option.name} className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-secondary">
              {option.name}: <span className="text-text-primary ml-1">{selectedOptions[option.name] || 'Select'}</span>
            </h3>
            {option.name.toLowerCase() === 'size' && (
              <button className="text-[10px] font-bold uppercase tracking-widest text-text-secondary underline underline-offset-4 hover:text-primary transition-colors">
                Size Guide
              </button>
            )}
          </div>

          <div className={cn(
            "flex flex-wrap gap-2.5",
            option.name.toLowerCase() === 'color' ? "gap-3.5" : "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2"
          )}>
            {option.values.map((val) => {
              const isSelected = selectedOptions[option.name] === val
              const isAvailable = isValueAvailable(option.name, val)

              if (option.name.toLowerCase() === 'color') {
                const hex = getColorHex(val)
                return (
                  <button
                    key={val}
                    onClick={() => onOptionsChange({ ...selectedOptions, [option.name]: val })}
                    className={cn(
                      'relative w-11 h-11 rounded-full border-2 transition-all duration-500 group',
                      isSelected
                        ? 'border-black ring-2 ring-black ring-offset-2 scale-110'
                        : 'border-neutral-100 hover:border-neutral-300 hover:scale-105',
                      !isAvailable && 'opacity-30 grayscale-[0.5]'
                    )}
                    title={val}
                  >
                    <span
                      className="absolute inset-1 rounded-full border border-black/5"
                      style={{ backgroundColor: hex }}
                    />
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[70%] h-[1px] bg-neutral-400 rotate-45" />
                      </div>
                    )}
                    <span className="sr-only">{val}</span>
                  </button>
                )
              }

              return (
                <button
                  key={val}
                  onClick={() => onOptionsChange({ ...selectedOptions, [option.name]: val })}
                  disabled={!isAvailable && !isSelected}
                  className={cn(
                    'h-12 border text-[11px] font-medium transition-all duration-500 uppercase px-4 rounded-full tracking-[0.15em]',
                    isSelected
                      ? 'border-black ring-2 ring-black ring-offset-2 bg-transparent text-black font-bold'
                      : 'bg-transparent text-text-primary border-neutral-100 hover:border-black',
                    !isAvailable && 'text-text-secondary opacity-30 grayscale-[0.5] relative overflow-hidden'
                  )}
                >
                  {val}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-neutral-300 -rotate-45 opacity-50" />
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
