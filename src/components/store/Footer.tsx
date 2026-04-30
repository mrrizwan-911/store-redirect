'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Camera, Globe, Share2, Phone as WhatsApp, Mail, MapPin } from 'lucide-react'

export function Footer() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.success) {
          setSettings(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch footer settings', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  if (loading || !settings) {
    return <footer className="bg-black text-white py-16 text-center text-xs opacity-50 uppercase tracking-widest">Loading...</footer>
  }

  const {
    footerTitle,
    footerDescription,
    footerLinks,
    socialLinks,
    contactEmail,
    contactPhone,
    contactAddress,
    showPaymentMethods,
    paymentMethods
  } = settings

  return (
    <footer className="bg-black text-white pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-12 mb-24">

          {/* About */}
          <div className="space-y-8">
            <Link href="/" className="shrink-0 group cursor-pointer flex flex-col items-start gap-1">
              <span className="font-serif text-2xl font-medium tracking-[0.2em] text-white uppercase transition-all group-hover:tracking-[0.25em] leading-tight">
                {footerTitle || 'CALNZA'}
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-sans font-medium">
                Curated modern wardrobe
              </span>
            </Link>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-xs font-light font-sans">
              {footerDescription}
            </p>
            <div className="flex gap-4">
              {socialLinks?.instagram && (
                <Link href={socialLinks.instagram} target="_blank" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                  <Camera className="w-4 h-4" />
                </Link>
              )}
              {socialLinks?.facebook && (
                <Link href={socialLinks.facebook} target="_blank" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                  <Globe className="w-4 h-4" />
                </Link>
              )}
              {socialLinks?.whatsapp && (
                <Link href={socialLinks.whatsapp} target="_blank" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500">
                  <WhatsApp className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 text-white/30">Collections</h4>
            <ul className="flex flex-col gap-5">
              {footerLinks?.categories?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About/Help Section 1 */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 text-white/30">About</h4>
            <ul className="flex flex-col gap-5">
              {footerLinks?.about?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.href} className="text-[11px] text-white/50 hover:text-white transition-colors font-medium uppercase tracking-[0.2em]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Help */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-10 text-white/30">Customer Care</h4>
            <ul className="flex flex-col gap-8">
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
                   <p className="text-[13px] text-white/60 font-light">{contactPhone}</p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[11px] text-white/30 uppercase tracking-widest font-bold">Concierge</p>
                   <p className="text-[13px] text-white/60 font-light">{contactEmail}</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-medium">
            © {new Date().getFullYear()} {footerTitle || 'CALNZA'} E-COMMERCE. ALL RIGHTS RESERVED.
          </p>

          <div className="flex gap-8 items-center">
            {showPaymentMethods && (
              <div className="flex gap-6 opacity-20 grayscale hover:grayscale-0 transition-all duration-700 items-center">
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
