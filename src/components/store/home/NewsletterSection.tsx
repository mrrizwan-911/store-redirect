'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {isSubmitted ? (
          <div className="animate-in fade-in zoom-in duration-700 text-center py-10">
            <CircleCheck className="w-16 h-16 text-black mx-auto mb-8 stroke-[1]" />
            <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight mb-4 text-black">
              You&apos;re on the list
            </h2>
            <p className="text-neutral-600 max-w-md mx-auto font-sans text-base leading-relaxed">
              Thank you for joining. Check your inbox soon for your exclusive 10% discount code.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-16 lg:gap-24">
            {/* Typography Block */}
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 font-bold mb-8 block">
                Newsletter
              </span>
              <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[0.95] text-black">
                Get 10% off <br className="hidden lg:block" /> your first order
              </h2>
              <p className="text-neutral-600 text-base md:text-lg mt-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans">
                Exclusive access to new arrivals, private sales, and seasonal editorials. No noise.
              </p>
            </div>

            {/* Action Block */}
            <div className="w-full lg:w-[450px] shrink-0">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col lg:flex-row items-stretch lg:items-end gap-6 lg:gap-0 group"
              >
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "h-16 lg:h-14 rounded-none border-0 border-b border-neutral-200 bg-transparent px-0",
                      "text-lg lg:text-base focus-visible:ring-0 focus-visible:border-black transition-all duration-500",
                      "placeholder:text-neutral-300 placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]"
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className={cn(
                    "h-16 lg:h-14 px-12 rounded-none uppercase tracking-[0.2em] text-[11px] font-bold",
                    "bg-black text-white hover:bg-neutral-900 transition-all duration-500",
                    "active:scale-95 shadow-2xl lg:shadow-none"
                  )}
                >
                  Subscribe
                </Button>
              </form>

              <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-medium text-center lg:text-left">
                Unsubscribe anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
