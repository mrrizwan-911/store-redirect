'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Heart, User, Search, Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { toggleCart } from '@/store/slices/cartSlice'
import { logout } from '@/store/slices/authSlice'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const NAV_CATEGORIES = [
  {
    label: 'Clothes',
    href: '/categories/clothes',
    sub: ['Tops', 'Bottoms', 'Outerwear', 'Formal', 'Casual'],
  },
  {
    label: 'Shoes',
    href: '/categories/shoes',
    sub: ['Sneakers', 'Formal', 'Sandals', 'Boots', 'Sports'],
  },
  {
    label: 'Apparel',
    href: '/categories/apparel',
    sub: ['Kurtas', 'Shalwar Kameez', 'Abayas', 'Sportswear'],
  },
  {
    label: 'Accessories',
    href: '/categories/accessories',
    sub: ['Bags', 'Belts', 'Wallets', 'Sunglasses', 'Watches'],
  },
]

export function Navbar() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  const router = useRouter()
  const dispatch = useAppDispatch()
  const cartItems = useAppSelector(state => state.cart.items)
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const { isAuthenticated, user } = useAppSelector(state => state.auth)

  const dashboardHref = user?.role === 'ADMIN' ? '/admin' : '/account'

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinkStyles = "relative text-[11px] font-normal uppercase tracking-[0.2em] text-gray-800 hover:text-black transition-colors font-sans after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-500 bg-white border-b-2 border-[#EEEEEE]",
      isScrolled ? "py-1" : "py-3"
    )}>
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex h-[32px] items-center justify-between gap-12">

          {/* Logo Area */}
          <Link href="/" className="shrink-0 group cursor-pointer flex items-center">
            <span className="font-display text-xl lg:text-2xl font-bold tracking-tighter text-black uppercase transition-all leading-none">
              STORE
            </span>
          </Link>

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
                </div>
              ))}
              <Link href="/lookbook" className={navLinkStyles}>
                Lookbook
              </Link>
            </nav>
          </div>

          {/* Right Icons (No Boxes, Clean Icons) */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100" aria-label="Search">
                <Search className="h-5 w-5 stroke-[1.5]" />
              </Link>
              <Link href="/wishlist" className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100" aria-label="Wishlist">
                <Heart className="h-5 w-5 stroke-[1.5]" />
              </Link>

              {/* Dynamic Account Button */}
              {!mounted ? (
                <div className="text-gray-600 h-5 w-5 stroke-[1.5]"><User className="h-5 w-5" /></div>
              ) : isAuthenticated ? (
                <div
                  className="relative"
                  onMouseEnter={() => setIsAccountOpen(true)}
                  onMouseLeave={() => setIsAccountOpen(false)}
                >
                  <DropdownMenu open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                    <DropdownMenuTrigger
                      onClick={() => router.push(dashboardHref)}
                      className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100 outline-none"
                      aria-label="Account Menu"
                    >
                      <User className="h-5 w-5 stroke-[1.5]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#F8F8F8] border border-neutral-200 shadow-xl rounded-none py-1.5 px-1.5">
                      <DropdownMenuItem
                        className="px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] font-bold cursor-pointer text-neutral-600 hover:text-black focus:bg-neutral-200/50 focus:text-black flex items-center gap-3 transition-all rounded-none outline-none"
                        onClick={() => {
                          setIsAccountOpen(false);
                          router.push(dashboardHref);
                        }}
                      >
                        <LayoutDashboard className="w-4 h-4 stroke-[1.5]" />
                        Dashboard
                      </DropdownMenuItem>
                      <div className="h-px bg-neutral-200 my-1" />
                      <DropdownMenuItem
                        className="px-4 py-2.5 text-[11px] uppercase tracking-[0.15em] font-bold cursor-pointer text-red-500 hover:text-red-700 focus:bg-red-50 focus:text-red-700 flex items-center gap-3 transition-all rounded-none outline-none"
                        onClick={() => {
                          setIsAccountOpen(false);
                          dispatch(logout());
                          router.push('/login');
                        }}
                      >
                        <LogOut className="w-4 h-4 stroke-[1.5]" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-black transition-all relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"
                  aria-label="Login"
                >
                  <User className="h-5 w-5 stroke-[1.5]" />
                </Link>
              )}

              <button
                onClick={() => dispatch(toggleCart())}
                className="relative text-gray-600 hover:text-black transition-all after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-full after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-500 hover:after:scale-x-100"
                aria-label={`Cart with ${mounted ? cartCount : 0} items`}
              >
                <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
                {mounted && cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-bold text-white rounded-none">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <div className="flex lg:hidden">
              <Sheet>
                <SheetTrigger className="text-black">
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 bg-white">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col h-full py-8 px-6">
                    <Link href="/" className="font-display text-2xl font-bold tracking-tighter mb-8">
                      STORE
                    </Link>
                    <nav className="flex flex-col gap-6">
                      <Link
                        href="/lookbook"
                        className="text-sm font-medium uppercase tracking-widest text-black border-b border-black/5 pb-2"
                      >
                        Lookbook
                      </Link>
                      {NAV_CATEGORIES.map(cat => (
                        <div key={cat.label} className="flex flex-col gap-3">
                          <Link
                            href={cat.href}
                            className="text-sm font-medium uppercase tracking-widest text-black border-b border-black/5 pb-2"
                          >
                            {cat.label}
                          </Link>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-2">
                            {cat.sub.map(sub => (
                              <Link
                                key={sub}
                                href={`${cat.href}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-[12px] text-neutral-500 hover:text-black transition-colors"
                              >
                                {sub}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </nav>

                    <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-4">
                      {isAuthenticated ? (
                        <>
                          <Link href={dashboardHref} className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-black">
                            <User className="w-4 h-4" /> Dashboard
                          </Link>
                          <button
                            onClick={() => {
                              dispatch(logout());
                              router.push('/login');
                            }}
                            className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-red-600 text-left"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </>
                      ) : (
                        <Link href="/login" className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-black">
                          <User className="w-4 h-4" /> Sign In
                        </Link>
                      )}
                      <Link href="/wishlist" className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-black">
                        <Heart className="w-4 h-4" /> Wishlist
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
