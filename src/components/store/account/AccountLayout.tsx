'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { AccountSidebar } from './AccountSidebar'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface AccountLayoutProps {
  children: React.ReactNode
}

export function AccountLayout({ children }: AccountLayoutProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    return { label, href, active: index === pathSegments.length - 1 }
  })

  return (
    <div className="flex flex-col lg:flex-row bg-white text-black font-sans relative min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] overflow-hidden">
      {/* Sidebar - Desktop (Fixed) / Mobile (Trigger in Sidebar component) */}
      <AccountSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
        {/* Top bar with Breadcrumbs & Toggle (Desktop only) */}
        <div className="hidden lg:flex items-center px-8 py-4 border-b border-neutral-100 bg-white shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-black hover:bg-neutral-100 transition-colors rounded-md border border-neutral-300 shadow-sm flex items-center justify-center bg-white outline-none active:scale-95"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <nav className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-500">
              <Link href="/" className="hover:text-black transition-colors">
                <Home className="w-3 h-3" />
              </Link>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && <ChevronRight className="w-3 h-3 text-neutral-300" />}
                  {crumb.active ? (
                    <span className="text-black font-bold">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-black transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12 scroll-smooth">
          <div className="max-w-5xl mx-auto pb-20 md:pb-12">
            {/* Mobile Breadcrumb (Simplified) */}
            <nav className="lg:hidden flex items-center space-x-2 text-[9px] uppercase tracking-[0.2em] font-medium text-neutral-500 mb-8">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <ChevronRight className="w-2.5 h-2.5 text-neutral-300" />
              <span className="text-black font-bold">Account</span>
              {pathSegments.length > 1 && (
                <>
                  <ChevronRight className="w-2.5 h-2.5 text-neutral-300" />
                  <span className="text-black font-bold">{pathSegments[pathSegments.length - 1]}</span>
                </>
              )}
            </nav>

            {/* Page Content with Transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
