'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingBag, Heart, User, Search, Menu, X,
  ChevronDown, Plus, Sparkles, Info, Mail, Phone, Home,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleCart, clearCart } from '@/store/slices/cartSlice'
import { logout } from '@/store/slices/authSlice'
import { persistor } from '@/store'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'

// ─── App config — never hardcoded ────────────────────────────────────────────
const APP_NAME   = process.env.NEXT_PUBLIC_APP_NAME   || 'Calnza'
const LOGO_PATH  = process.env.NEXT_PUBLIC_LOGO_PATH  || '/bgless-logo.png'
const LOGO_TAGLINE = process.env.NEXT_PUBLIC_LOGO_TAGLINE || 'Your Curated Wardrobe'

interface NavbarProps {
  serverCategories?: {
    id: string
    name: string
    slug: string
    parentId: string | null
    children: { id: string; name: string; slug: string }[]
  }[]
}

const NAV_CATEGORIES = [
  { label: 'Clothes',     slug: 'clothes',     href: '/categories/clothes' },
  { label: 'Shoes',       slug: 'shoes',       href: '/categories/shoes' },
  { label: 'Apparel',     slug: 'apparel',     href: '/categories/apparel' },
  { label: 'Accessories', slug: 'accessories', href: '/categories/accessories' },
  { label: 'Lookbook',    slug: 'lookbook',    href: '/lookbook' },
]

export function Navbar({ serverCategories = [] }: NavbarProps) {
  const [isScrolled,        setIsScrolled       ] = useState(false)
  const [isSidebarOpen,     setIsSidebarOpen    ] = useState(false)
  const [isCategoriesOpen,  setIsCategoriesOpen ] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  const router   = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()

  const getSubcategories = (rootSlug: string) =>
    serverCategories.find(c => c.slug === rootSlug)?.children ?? []
  const sideMenuCategories = serverCategories.filter(c => !c.parentId)

  const cartItems  = useAppSelector(state => state.cart.items)
  const cartCount  = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { isAuthenticated, user } = useAppSelector(state => state.auth)
  const rehydrated = useAppSelector(state => (state as any)._persist?.rehydrated ?? false)

  const dashboardHref = user?.role === 'ADMIN' ? '/d8f2a1/admin' : '/account'

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* non-fatal */ }
    setIsSidebarOpen(false)
    dispatch(logout())
    dispatch(clearCart())
    await persistor.purge()
    router.refresh()
    router.push('/login')
  }

  useEffect(() => {
    const onScroll  = () => {
      setIsScrolled(window.scrollY > 50)
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight
        document.documentElement.style.setProperty('--header-height', `${height}px`)
      }
    }
    onScroll() // Initial call
    window.addEventListener('scroll',  onScroll)
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (pathname === '/search') {
          document.getElementById('page-search-input')?.focus()
        } else {
          router.push('/search?focus=true')
        }
      }
      if (
        e.key === '/' &&
        pathname !== '/search' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        router.push('/search?focus=true')
      }
    }
    window.addEventListener('scroll',  onScroll)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('scroll',  onScroll)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [pathname, router])

  const navLinkStyles =
    'relative text-[11px] font-normal uppercase tracking-[0.2em] text-gray-800 hover:text-black transition-colors font-sans after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100'

  const sidebarLinkStyles =
    'flex items-center gap-5 py-3 text-[11px] font-normal text-zinc-700 hover:text-black transition-all group'

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          'z-50 w-full transition-all duration-500 md:sticky md:top-0 md:bg-background md:border-b-2 md:border-border',
          pathname === '/' ? 'relative h-16 -mb-16 md:mb-0 bg-transparent md:bg-background border-none md:border-b-2' : 'hidden md:block',
          isScrolled ? 'md:py-1' : 'md:py-3',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="hidden md:flex h-[32px] items-center justify-between gap-4 md:gap-12">

            {/* ── Left: hamburger + logo ── */}
            <div className="flex items-center gap-4">
              {/* Side menu trigger (Desktop) */}
              <div role="button" onClick={() => setIsSidebarOpen(true)} className="text-black hover:opacity-70 transition-opacity cursor-pointer" aria-label="Open menu">
                <Menu className="h-6 w-6 stroke-[1.5]" />
              </div>

              {/* ── Navbar logo: image on desktop, image on mobile ── */}
              <Link href="/" className="shrink-0 flex items-center gap-2 group cursor-pointer">
                {/* Logo image — 36px height in header (Increased 25%) */}
                <div className="relative h-9 w-9 flex-shrink-0">
                  <Image
                    src={LOGO_PATH}
                    alt={APP_NAME}
                    fill
                    sizes="36px"
                    className="object-contain"
                    priority
                  />
                </div>
                {/* Wordmark text — visible on all screen sizes */}
                <span className="font-display text-xl lg:text-2xl font-bold tracking-tighter text-black uppercase transition-all leading-none">
                  {APP_NAME}
                </span>
              </Link>
            </div>

            {/* ── Desktop nav links ── */}
            <div className="hidden flex-1 justify-center lg:flex">
              <nav className="flex items-center gap-10">
                {NAV_CATEGORIES.map(cat => (
                  <div key={cat.label} className="relative group h-full flex items-center">
                    <Link href={cat.href} className={navLinkStyles}>{cat.label}</Link>
                    {getSubcategories(cat.slug).length > 0 && (
                      <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-background border border-border shadow-xl py-4 px-6 rounded-[var(--radius)]">
                        <div className="flex flex-col gap-3">
                          {getSubcategories(cat.slug).map(sub => (
                            <Link key={sub.id} href={`/categories/${cat.slug}/${sub.slug}`} className="text-[11px] uppercase tracking-wider text-neutral-500 hover:text-black transition-colors">
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* ── Right icons ── */}
            <div className="flex items-center gap-6">
              <Link
                href="/search?focus=true"
                onClick={(e) => { if (pathname === '/search') { e.preventDefault(); document.getElementById('page-search-input')?.focus() } }}
                className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"
                aria-label="Search"
              >
                <Search className="h-5 w-5 stroke-[1.5]" />
              </Link>

              <Link href="/wishlist" className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100" aria-label="Wishlist">
                <Heart className="h-5 w-5 stroke-[1.5]" />
              </Link>

              {!rehydrated ? (
                <div className="text-gray-600"><User className="h-5 w-5" /></div>
              ) : (
                <button
                  onClick={() => { !isAuthenticated ? router.push('/login') : user?.role === 'ADMIN' ? router.push('/d8f2a1/admin') : router.push('/account') }}
                  className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100 outline-none"
                  aria-label="Account"
                >
                  <User className="h-5 w-5 stroke-[1.5]" />
                </button>
              )}

              <button
                onClick={() => dispatch(toggleCart())}
                className="relative text-gray-600 hover:text-black transition-all after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"
                aria-label={`Cart with ${rehydrated ? cartCount : 0} items`}
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                {rehydrated && cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Mobile Top Header (Visible only on Mobile Home) */}
          {pathname === '/' && (
            <div className="flex md:hidden h-16 items-center justify-center">
              <Link href="/" className="flex items-center justify-center">
                {/* Cloud shape or logo */}
                <div className="relative w-80 h-[120px] flex items-center justify-center top-[20px]">
                  <Image
                    src="/images/logo.png"
                    alt={APP_NAME}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Side Menu Drawer (Sheet) - Rendered at root for both mobile and desktop */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SheetContent
          side="left"
          showCloseButton={false}
          style={{ backgroundColor: 'var(--background)' }}
          className="w-full sm:w-[400px] p-0 !bg-background border-r border-border shadow-2xl overflow-hidden"
        >
          <div className="flex flex-col h-full !bg-background !text-black overflow-hidden" style={{ backgroundColor: 'var(--background)', color: 'black' }}>

            {/* Sidebar header with logo image */}
            <div className="flex items-center justify-between px-8 py-10 border-b border-border shrink-0">
              <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 group">
                {/* Logo image — 44px height in sidebar (Increased 25%) */}
                <div className="relative h-11 w-11 flex-shrink-0">
                  <Image
                    src={LOGO_PATH}
                    alt={APP_NAME}
                    fill
                    sizes="44px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-base font-medium tracking-tight text-black uppercase">
                    {APP_NAME}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium tracking-wider">
                    {LOGO_TAGLINE}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-zinc-400 hover:text-black transition-colors p-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[1.2]" />
              </button>
            </div>

            {/* Sidebar navigation */}
            <nav className="flex-1 px-10 overflow-y-auto scrollbar-hide py-4 space-y-4">
              <div className="flex flex-col space-y-0.5">
                <Link href="/"         onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Menu      className="w-5 h-5 stroke-[1.2]" />Home</Link>
                <Link href="/products" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><ShoppingBag className="w-5 h-5 stroke-[1.2]" />Store</Link>

                {/* Categories accordion */}
                <div className="flex flex-col">
                  <button onClick={() => setIsCategoriesOpen(!isCategoriesOpen)} className={sidebarLinkStyles}>
                    <ChevronDown className={cn('w-5 h-5 stroke-[1.2] transition-transform duration-300', isCategoriesOpen ? 'rotate-0' : '-rotate-90')} />
                    <span className="flex-1 text-left">Categories</span>
                  </button>
                  {isCategoriesOpen && (
                    <div className="flex flex-col pl-10 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                      {sideMenuCategories.map(cat => (
                        <Link key={cat.id} href={`/categories/${cat.slug}`} onClick={() => setIsSidebarOpen(false)} className="py-2 text-[11px] font-normal text-zinc-500 hover:text-black transition-colors">
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link href="/products?sort=createdAt_desc" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Plus      className="w-5 h-5 stroke-[1.2]" />New Arrivals</Link>
                <Link href="/lookbook"  onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Sparkles  className="w-5 h-5 stroke-[1.2]" />Lookbook</Link>
                <Link href="/wishlist"  onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Heart     className="w-5 h-5 stroke-[1.2]" />Wishlist</Link>

                <div className="h-px bg-border my-2" />

                <Link href="/story"      onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Info  className="w-5 h-5 stroke-[1.2]" />Our Story</Link>
                <Link href="/newsletter" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Mail  className="w-5 h-5 stroke-[1.2]" />Newsletter</Link>
                <Link href="/contact"    onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}><Phone className="w-5 h-5 stroke-[1.2]" />Contact</Link>
              </div>
            </nav>

            {/* Sidebar footer */}
            <div className="shrink-0 px-10 py-6 border-t border-border bg-background space-y-4">
              <div className="flex flex-col space-y-0.5">
                <button onClick={() => { setIsSidebarOpen(false); dispatch(toggleCart()) }} className={sidebarLinkStyles}>
                  <ShoppingBag className="w-5 h-5 stroke-[1.2]" />Cart ({cartCount})
                </button>
                <button onClick={() => { setIsSidebarOpen(false); isAuthenticated ? router.push(dashboardHref) : router.push('/login') }} className={sidebarLinkStyles}>
                  <User className="w-5 h-5 stroke-[1.2]" />{isAuthenticated ? 'Account' : 'Login'}
                </button>
              </div>
              <div className="text-[9.5px] font-medium text-zinc-400 uppercase tracking-[0.2em] mt-auto pt-2 text-center w-full">
                © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Menu (Visible on all pages on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
        <div className="grid grid-cols-5 h-16 items-center">
          {/* Menu */}
          <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
            <Menu className="h-5 w-5 stroke-[1.5]" />
            <span className="text-[10px] mt-1 font-sans">Menu</span>
          </button>
          {/* Bag */}
          <button onClick={() => dispatch(toggleCart())} className="flex flex-col items-center justify-center text-gray-600 hover:text-black relative">
            <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
            {rehydrated && cartCount > 0 && (
              <span className="absolute right-1/4 top-1 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white rounded-full">
                {cartCount}
              </span>
            )}
            <span className="text-[10px] mt-1 font-sans">Bag</span>
          </button>
          {/* Home */}
          <Link href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
            <Home className="h-5 w-5 stroke-[1.5]" />
            <span className="text-[10px] mt-1 font-sans">Home</span>
          </Link>
          {/* Search */}
          <Link href="/search?focus=true" className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
            <Search className="h-5 w-5 stroke-[1.5]" />
            <span className="text-[10px] mt-1 font-sans">Search</span>
          </Link>
          {/* Account */}
          <button onClick={() => { !isAuthenticated ? router.push('/login') : user?.role === 'ADMIN' ? router.push('/d8f2a1/admin') : router.push('/account') }} className="flex flex-col items-center justify-center text-gray-600 hover:text-black">
            <User className="h-5 w-5 stroke-[1.5]" />
            <span className="text-[10px] mt-1 font-sans">Account</span>
          </button>
        </div>
      </div>
    </>
  )
}
