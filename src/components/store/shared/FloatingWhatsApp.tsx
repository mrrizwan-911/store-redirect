'use client'

import React from 'react'
import Link from 'next/link'
import { Phone } from 'lucide-react'

// Keeping the export name to avoid breaking imports in other files.
// This component now acts as a floating contact button instead of WhatsApp.
export function FloatingWhatsApp() {
  return (
    <Link
      href="/contact"
      className="fixed bottom-24 right-8 md:bottom-8 flex items-center gap-3 bg-black text-white px-5 py-4 shadow-2xl hover:scale-105 transition-all duration-300 group z-50 rounded-full"
      aria-label="Contact us"
    >
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-base font-semibold tracking-wide">
        Contact us
      </span>
      <Phone className="w-6 h-6 stroke-[1.5]" />
    </Link>
  )
}
