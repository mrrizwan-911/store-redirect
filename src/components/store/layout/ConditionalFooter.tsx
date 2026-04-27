'use client'

import { usePathname } from 'next/navigation'
import { Footer } from '../Footer'

export function ConditionalFooter() {
  const pathname = usePathname()

  if (pathname === '/search') {
    return null
  }

  return <Footer />
}
