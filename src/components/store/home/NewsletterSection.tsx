'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CircleCheck, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TurnstileWidget } from '@/components/ui/TurnstileWidget'

export function NewsletterSection() {
  const [email, setEmail]           = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (!turnstileToken) {
      toast.error('Please complete the security verification.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'HOMEPAGE', turnstileToken }),
      })

      const result = await response.json()

      if (result.success) {
        setIsSubmitted(true)
        setEmail('')
        setTurnstileToken('')
        toast.success('Welcome to the inner circle!')
      } else {
        toast.error(result.error || 'Failed to subscribe')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-20 md:py-24 lg:py-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10">
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
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12 lg:gap-24">
            {/* Typography Block */}
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 font-bold mb-6 sm:mb-8 block">
                Newsletter
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight leading-[0.95] text-black">
                Get 10% off <br className="hidden lg:block" /> your first order
              </h2>
              <p className="text-neutral-600 text-base md:text-lg mt-6 sm:mt-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans">
                Exclusive access to new arrivals, private sales, and seasonal editorials. No noise.
              </p>
            </div>

            {/* Action Block */}
            <div className="w-full lg:w-[450px] shrink-0">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-stretch gap-4 sm:gap-6"
              >
                <div className="relative flex-1">
                  <Input
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      'h-14 rounded-[var(--radius)] border-0 border-b border-neutral-200 bg-transparent px-0',
                      'text-base focus-visible:ring-0 focus-visible:border-black transition-all duration-500',
                      'placeholder:text-neutral-300 placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]',
                    )}
                  />
                </div>
                <TurnstileWidget
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className={cn(
                    'h-14 px-12 rounded-[var(--radius)] uppercase tracking-[0.2em] text-[11px] font-bold',
                    'bg-black text-white hover:bg-neutral-900 transition-all duration-500',
                    'active:scale-95 shadow-2xl lg:shadow-none disabled:opacity-70',
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </form>

              <p className="mt-5 sm:mt-6 text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-medium text-center lg:text-left">
                Unsubscribe anytime.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
