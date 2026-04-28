'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Heart, User, Search, Menu, X, LayoutDashboard, LogOut, ChevronDown, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleCart, clearCart } from '@/store/slices/cartSlice'
import { logout } from '@/store/slices/authSlice'
import { persistor } from '@/store'
import { cn } from '@/lib/utils'
import { useRouter, usePathname } from 'next/navigation'

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
  {
    label: 'Clothes',
    slug: 'clothes',
    href: '/categories/clothes',
  },
  {
    label: 'Shoes',
    slug: 'shoes',
    href: '/categories/shoes',
  },
  {
    label: 'Apparel',
    slug: 'apparel',
    href: '/categories/apparel',
  },
  {
    label: 'Accessories',
    slug: 'accessories',
    href: '/categories/accessories',
  },
  {
    label: 'Lookbook',
    slug: 'lookbook',
    href: '/lookbook',
  },
]

export function Navbar({ serverCategories = [] }: NavbarProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()

  const getSubcategories = (rootSlug: string) =>
    serverCategories.find(c => c.slug === rootSlug)?.children ?? []

  const sideMenuCategories = serverCategories.filter(c => !c.parentId)

  const cartItems = useAppSelector(state => state.cart.items)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { isAuthenticated, user } = useAppSelector(state => state.auth)
  const rehydrated = useAppSelector(state => (state as any)._persist?.rehydrated ?? false)

  const dashboardHref = user?.role === 'ADMIN' ? '/d8f2a1/admin' : '/account'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // still clear client state even if API call fails
    } finally {
      setIsSidebarOpen(false);
      dispatch(logout());
      dispatch(clearCart());
      await persistor.purge();
      router.push('/login');
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (pathname === '/search') {
          const input = document.getElementById('page-search-input')
          input?.focus()
        } else {
          router.push('/search?focus=true')
        }
      }
      if (e.key === '/' && pathname !== '/search' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        router.push('/search?focus=true')
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pathname, router])

  const navLinkStyles = "relative text-[11px] font-normal uppercase tracking-[0.2em] text-gray-800 hover:text-black transition-colors font-sans after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"

  const sidebarLinkStyles = "flex items-center gap-4 py-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-all group"

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500 bg-white border-b-2 border-[#EEEEEE]",
      isScrolled ? "py-1" : "py-3"
    )}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex h-[32px] items-center justify-between gap-4 md:gap-12">

          <div className="flex items-center gap-4">
            {/* Unified Side Menu Toggle */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger>
                <div role="button" className="text-black hover:opacity-70 transition-opacity cursor-pointer" aria-label="Open menu">
                  <Menu className="h-6 w-6 stroke-[1.5]" />
                </div>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-[400px] p-0 bg-[#111111] border-none shadow-2xl">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full text-white">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between px-8 py-10">
                    <Link href="/" onClick={() => setIsSidebarOpen(false)} className="group">
                      <span className="font-display text-2xl font-bold tracking-tighter text-white uppercase">
                        CALNZA
                      </span>
                      <p className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 mt-1">Your Curated Wardrobe</p>
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                      <X className="w-6 h-6 stroke-[1.5]" />
                    </button>
                  </div>

                  {/* Sidebar Links */}
                  <nav className="flex-1 px-8 overflow-y-auto scrollbar-hide space-y-2">
                    <Link href="/" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 group-hover:bg-white group-hover:text-black transition-colors">
                        <Menu className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      Home
                    </Link>
                    <Link href="/products" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 group-hover:bg-white group-hover:text-black transition-colors">
                        <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      Store
                    </Link>
                    <Link href="/products?sort=createdAt_desc" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 group-hover:bg-white group-hover:text-black transition-colors">
                        <Plus className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      New Arrivals
                    </Link>
                    <Link href="/story" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 group-hover:bg-white group-hover:text-black transition-colors">
                        <X className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      About
                    </Link>

                    {/* Divider */}
                    <div className="h-px bg-zinc-900 my-8" />

                    {/* Dynamic Categories */}
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-bold mb-4 px-1">Categories</p>
                      {sideMenuCategories.map(cat => (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.slug}`}
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex items-center justify-between py-3 px-1 text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-white transition-colors"
                        >
                          {cat.name}
                          <ChevronDown className="w-3 h-3 -rotate-90 opacity-40" />
                        </Link>
                      ))}
                      <Link
                         href="/categories/sale"
                         onClick={() => setIsSidebarOpen(false)}
                         className="flex items-center justify-between py-3 px-1 text-xs uppercase tracking-[0.2em] text-amber-500/80 hover:text-amber-400 transition-colors"
                       >
                         Flash Sale
                         <span className="text-[7px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-500/20">LIVE</span>
                       </Link>
                    </div>

                    {/* Upcoming */}
                    <div className="pt-10">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-bold mb-4 px-1">Coming Soon</p>
                      <div className="space-y-4 opacity-40">
                         <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                           Home Decor <span className="text-[7px] border border-zinc-800 px-2 py-0.5 rounded-full">JUNE '26</span>
                         </div>
                         <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                           Beauty <span className="text-[7px] border border-zinc-800 px-2 py-0.5 rounded-full">AUG '26</span>
                         </div>
                      </div>
                    </div>
                  </nav>

                  {/* Sidebar Footer */}
                  <div className="p-8 bg-[#0a0a0a] border-t border-zinc-900 space-y-6">
                    <div className="flex items-center justify-between">
                       <button
                         onClick={() => {
                           setIsSidebarOpen(false);
                           isAuthenticated ? router.push(dashboardHref) : router.push('/login');
                         }}
                         className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors"
                       >
                         <User className="w-4 h-4" /> {isAuthenticated ? 'Account' : 'Sign In'}
                       </button>
                       <button
                         onClick={() => {
                           setIsSidebarOpen(false);
                           dispatch(toggleCart());
                         }}
                         className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-colors"
                       >
                         <ShoppingBag className="w-4 h-4" /> Cart ({cartCount})
                       </button>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-zinc-600">
                       <span className="text-[8px] uppercase tracking-widest">Shipping to:</span>
                       <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold">
                          <span role="img" aria-label="Pakistan">🇵🇰</span> Pakistan
                       </div>
                    </div>

                    <div className="pt-4 text-[8px] text-zinc-700 uppercase tracking-widest leading-relaxed">
                      © {new Date().getFullYear()} CALNZA. All rights reserved.
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo Area */}
            <Link href="/" className="shrink-0 group cursor-pointer flex items-center">
              <span className="font-display text-xl lg:text-2xl font-bold tracking-tighter text-black uppercase transition-all leading-none">
                CALNZA
              </span>
            </Link>
          </div>

          {/* Desktop Nav (Pure Text & Minimalist) */}
          <div className="hidden flex-1 justify-center lg:flex">
            <nav className="flex items-center gap-10">
              {NAV_CATEGORIES.map(cat => (
                <div
                  key={cat.label}
                  className="relative group h-full flex items-center"
                >
                  <Link href={cat.href} className={navLinkStyles}>
                    {cat.label}
                  </Link>

                  {/* Mega Menu Dropdown */}
                  {getSubcategories(cat.slug).length > 0 && (
                    <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-white border border-neutral-200 shadow-xl py-4 px-6">
                      <div className="flex flex-col gap-3">
                        {getSubcategories(cat.slug).map(sub => (
                          <Link
                            key={sub.id}
                            href={`/categories/${cat.slug}/${sub.slug}`}
                            className="text-[11px] uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
                          >
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

          {/* Right Icons (No Boxes, Clean Icons) */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Link
                href="/search?focus=true"
                onClick={(e) => {
                  if (pathname === '/search') {
                    e.preventDefault()
                    document.getElementById('page-search-input')?.focus()
                  }
                }}
                className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"
                aria-label="Search"
              >
                <Search className="h-5 w-5 stroke-[1.5]" />
              </Link>
              <Link href="/wishlist" className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100" aria-label="Wishlist">
                <Heart className="h-5 w-5 stroke-[1.5]" />
              </Link>

              {/* Dynamic Account Button */}
              {!rehydrated ? (
                <div className="text-gray-600 h-5 w-5 stroke-[1.5]"><User className="h-5 w-5" /></div>
              ) : (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push('/login');
                    } else if (user?.role === 'ADMIN') {
                      router.push('/d8f2a1/admin');
                    } else {
                      router.push('/account');
                    }
                  }}
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
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white rounded-none">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
