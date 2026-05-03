'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Heart, User, Search, Menu, X, LayoutDashboard, LogOut, ChevronDown, Plus, Sparkles, Info, Mail, Phone } from 'lucide-react'
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
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)

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
      router.refresh();
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

  const sidebarLinkStyles = "flex items-center gap-5 py-3 text-[11px] font-normal text-zinc-700 hover:text-black transition-all group"

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
              <SheetContent side="left" showCloseButton={false} style={{ backgroundColor: 'white' }} className="w-full sm:w-[400px] p-0 !bg-white border-r border-neutral-200 shadow-2xl overflow-hidden">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full !bg-white !text-black overflow-hidden" style={{ backgroundColor: 'white', color: 'black' }}>
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between px-8 py-10 border-b border-neutral-100 shrink-0">
                    <div className="flex items-center gap-4">
                      <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex flex-col group">
                        <span className="font-display text-xl font-medium tracking-tight text-black uppercase">
                          CALNZA
                        </span>
                        <span className="text-[9px] text-zinc-400 font-medium tracking-wider mt-0.5">
                          Your Curated Wardrobe
                        </span>
                      </Link>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="text-zinc-400 hover:text-black transition-colors p-2"
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5 stroke-[1.2]" />
                    </button>
                  </div>

                  {/* Sidebar Links */}
                  <nav className="flex-1 px-10 overflow-y-auto scrollbar-hide py-4 space-y-4">
                    <div className="flex flex-col space-y-0.5">
                      <Link href="/" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Menu className="w-5 h-5 stroke-[1.2]" />
                        Home
                      </Link>
                      <Link href="/products" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <ShoppingBag className="w-5 h-5 stroke-[1.2]" />
                        Store
                      </Link>

                      {/* Categories Dropdown */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                          className={sidebarLinkStyles}
                        >
                          <ChevronDown className={cn("w-5 h-5 stroke-[1.2] transition-transform duration-300", isCategoriesOpen ? "rotate-0" : "-rotate-90")} />
                          <span className="flex-1 text-left">Categories</span>
                        </button>

                        {isCategoriesOpen && (
                          <div className="flex flex-col pl-10 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300">
                            {sideMenuCategories.map(cat => (
                              <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                onClick={() => setIsSidebarOpen(false)}
                                className="py-2 text-[11px] font-normal text-zinc-500 hover:text-black transition-colors"
                              >
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      <Link href="/products?sort=createdAt_desc" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Plus className="w-5 h-5 stroke-[1.2]" />
                        New Arrivals
                      </Link>
                      <Link href="/lookbook" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Sparkles className="w-5 h-5 stroke-[1.2]" />
                        Lookbook
                      </Link>
                      <Link href="/wishlist" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Heart className="w-5 h-5 stroke-[1.2]" />
                        Wishlist
                      </Link>

                      <div className="h-px bg-neutral-100 my-2" />

                      <Link href="/story" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Info className="w-5 h-5 stroke-[1.2]" />
                        Our Story
                      </Link>
                      <Link href="/newsletter" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Mail className="w-5 h-5 stroke-[1.2]" />
                        Newsletter
                      </Link>
                      <Link href="/contact" onClick={() => setIsSidebarOpen(false)} className={sidebarLinkStyles}>
                        <Phone className="w-5 h-5 stroke-[1.2]" />
                        Contact
                      </Link>
                    </div>
                  </nav>

                  {/* Sidebar Footer (Fixed) */}
                  <div className="shrink-0 px-10 py-6 border-t border-neutral-100 bg-white space-y-4">
                    <div className="flex flex-col space-y-0.5">
                       <button
                          onClick={() => {
                            setIsSidebarOpen(false);
                            dispatch(toggleCart());
                          }}
                          className={sidebarLinkStyles}
                       >
                          <ShoppingBag className="w-5 h-5 stroke-[1.2]" />
                          Cart ({cartCount})
                       </button>
                       <button
                          onClick={() => {
                            setIsSidebarOpen(false);
                            isAuthenticated ? router.push(dashboardHref) : router.push('/login');
                          }}
                          className={sidebarLinkStyles}
                       >
                          <User className="w-5 h-5 stroke-[1.2]" />
                          {isAuthenticated ? 'Account' : 'Login'}
                       </button>
                    </div>

                    <div className="text-[9.5px] font-medium text-zinc-400 uppercase tracking-[0.2em] whitespace-nowrap mt-auto pt-2 text-center w-full">
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
                    <div className="absolute top-full left-0 hidden group-hover:block w-48 bg-white border border-neutral-200 shadow-xl py-4 px-6 rounded-[var(--radius)]">
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
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white rounded-full">
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
