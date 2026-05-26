'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Globe, Share2, Phone as WhatsApp, Mail, MapPin, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { TurnstileWidget } from '@/components/ui/TurnstileWidget'

export function Footer() {
  const [settings, setSettings]         = useState<any>(null)
  const [loading, setLoading]           = useState(true)
  const [email, setEmail]               = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (!turnstileToken) {
      toast.error('Please complete the security verification.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'FOOTER', turnstileToken }),
      })

      const result = await response.json()

      if (result.success) {
        setEmail('')
        setTurnstileToken('')
        toast.success('Thank you for subscribing!')
      } else {
        toast.error(result.error || 'Failed to subscribe')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res  = await fetch('/api/settings')
        const data = await res.json()
        if (data.success) setSettings(data.data)
      } catch (error) {
        console.error('Failed to fetch footer settings', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  if (loading || !settings) {
    return (
      <footer className="bg-black text-white py-12 text-center text-xs opacity-50 uppercase tracking-widest">
        Loading...
      </footer>
    )
  }

  const {
    footerTitle, footerDescription, footerLinks, socialLinks,
    contactEmail, contactPhone, contactAddress, whatsappNumber,
    showPaymentMethods, paymentMethods,
  } = settings

  // Build WhatsApp URL from the dedicated whatsappNumber field
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    : null

  const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME    || 'Calnza'
  const LOGO_PATH   = process.env.NEXT_PUBLIC_LOGO_PATH   || '/bgless-logo.png'
  const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Curated modern wardrobe'

  return (
    /* pt-32 was enormous on mobile. Now: 10rem mobile → 20rem desktop */
    <footer className="bg-black text-white pt-16 md:pt-24 lg:pt-32 pb-12 sm:pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* ── Main grid ──
            gap-10 mobile → gap-12 lg. mb-16 mobile → mb-24 lg. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12 mb-16 md:mb-24">

          {/* About */}
          <div className="space-y-6 sm:space-y-8">
            <Link href="/" className="shrink-0 group cursor-pointer flex flex-col items-start gap-3">
              <div className="relative h-12 w-12 opacity-90 group-hover:opacity-100 transition-opacity">
                <Image
                  src={LOGO_PATH}
                  alt={footerTitle || APP_NAME}
                  fill
                  sizes="48px"
                  className="object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-xl font-medium tracking-[0.25em] text-white uppercase transition-all group-hover:tracking-[0.3em]">
                  {footerTitle || APP_NAME}
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-sans font-medium">
                  {APP_TAGLINE}
                </span>
              </div>
            </Link>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-xs font-light font-sans">
              {footerDescription}
            </p>
            <div className="flex gap-4">
              {socialLinks?.instagram && (
                <Link href={socialLinks.instagram} target="_blank" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                  <Camera className="w-4 h-4" />
                </Link>
              )}
              {socialLinks?.facebook && (
                <Link href={socialLinks.facebook} target="_blank" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                  <Globe className="w-4 h-4" />
                </Link>
              )}
              {whatsappHref && (
                <Link href={whatsappHref} target="_blank" className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                  <WhatsApp className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-8 sm:mb-10 text-white/30">Collections</h4>
            <ul className="flex flex-col gap-4 sm:gap-5">
              {footerLinks?.categories?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About links */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-8 sm:mb-10 text-white/30">About</h4>
            <ul className="flex flex-col gap-4 sm:gap-5">
              {footerLinks?.about?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-8 sm:mb-10 text-white/30">Customer Care</h4>
            <ul className="flex flex-col gap-6 sm:gap-8">
              {footerLinks?.help?.map((link: any, idx: number) => (
                <li key={idx} className="mb-[-20px]">
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}

              <li className="flex gap-4 items-start pt-4 border-t border-white/5 mt-4">
                <WhatsApp className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">WhatsApp</p>
                  <p className="text-[13px] text-white/60 font-light">{contactPhone || whatsappNumber || 'N/A'}</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">Concierge</p>
                  <p className="text-[13px] text-white/60 font-light break-all">{contactEmail}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6 sm:space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">Newsletter</h4>
            <div className="space-y-4">
              <p className="text-white/40 text-[11px] uppercase tracking-[0.2em] leading-relaxed">
                Join the inner circle for exclusive updates.
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative group">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full bg-transparent border-b border-white/10 py-3 text-[11px] tracking-widest text-white outline-none transition-all duration-500',
                    'focus:border-white placeholder:text-white/20 placeholder:text-[9px]',
                    isSubmitting && 'opacity-50',
                  )}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !turnstileToken}
                  className="absolute right-0 bottom-3 text-white/40 hover:text-white transition-colors duration-500"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </button>
                </div>
                <TurnstileWidget
                  theme="dark"
                  size="compact"
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                />
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 sm:pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-10">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-medium text-center md:text-left">
            © {new Date().getFullYear()} {footerTitle || 'CALNZA'} E-COMMERCE. ALL RIGHTS RESERVED.
          </p>

          <div className="flex gap-8 items-center">
            {showPaymentMethods && (
              <div className="flex gap-4 sm:gap-6 opacity-20 grayscale hover:grayscale-0 transition-all duration-700 items-center flex-wrap justify-center">
                {paymentMethods?.map((method: string) => (
                  <span key={method} className="text-[10px] font-bold tracking-widest">{method}</span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </footer>
  )
}
