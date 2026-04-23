'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  User,
  Package,
  MapPin,
  Heart,
  Award,
  Users,
  FileText,
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { clearCart } from '@/store/slices/cartSlice'
import { persistor } from '@/store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavLink {
  label: string
  href: string
  icon: React.ElementType
}

interface AccountSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

const navLinks: NavLink[] = [
  { label: 'Overview', href: '/account', icon: User },
  { label: 'Orders', href: '/account/orders', icon: Package },
  { label: 'Profile', href: '/account/profile', icon: User },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'Loyalty', href: '/account/loyalty', icon: Award },
  { label: 'Referral', href: '/account/referral', icon: Users },
  { label: 'Quotations', href: '/account/quotations', icon: FileText },
]

export function AccountSidebar({ isCollapsed, onToggle }: AccountSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // still clear client state even if API call fails
    }
    dispatch(logout())
    dispatch(clearCart())
    await persistor.purge()
    router.push('/login')
  }

  // Mock loyalty tier for now - in a real app this would come from a loyalty slice or user profile
  const loyaltyTier = 'Silver Tier'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("flex flex-col h-full bg-white transition-all duration-300", !mobile && isCollapsed && "w-20")}>
      {/* User Summary */}
      <div className={cn("p-8 border-b border-neutral-200", !mobile && isCollapsed && "p-4 flex flex-col items-center")}>
        <div className={cn("flex items-center gap-4", !mobile && isCollapsed && "flex-col gap-2")}>
          <Avatar size={!mobile && isCollapsed ? "sm" : "lg"} className="border border-neutral-300 rounded-[12px]">
            <AvatarFallback className="bg-black text-white font-display rounded-[12px]">
              {mounted && user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {mounted && (!isCollapsed || mobile) && (
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold tracking-tight uppercase truncate max-w-[150px] text-black">
                {user?.name || 'Guest User'}
              </h2>
              <Badge variant="outline" className="w-fit text-[9px] uppercase tracking-widest font-bold border-neutral-300 rounded-[6px] px-2 py-0 text-neutral-600">
                {loyaltyTier}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 overflow-y-auto overflow-x-hidden text-black">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={!mobile && isCollapsed ? link.label : undefined}
                  className={cn(
                    "flex items-center justify-between px-8 py-3 group transition-all duration-300",
                    !mobile && isCollapsed && "px-0 justify-center",
                    isActive
                      ? "text-black bg-neutral-100 font-bold"
                      : "text-neutral-600 hover:text-black"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4 stroke-[1.8]", isActive ? "text-black" : "text-neutral-500 group-hover:text-black")} />
                    {(!isCollapsed || mobile) && (
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap">
                        {link.label}
                      </span>
                    )}
                  </div>
                  {(!isCollapsed || mobile) && isActive && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  {(!isCollapsed || mobile) && !isActive && (
                    <div className="h-[1px] w-0 bg-black transition-all duration-300 group-hover:w-4" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className={cn("p-8 border-t border-neutral-200", !mobile && isCollapsed && "p-4 flex justify-center")}>
        <button
          onClick={handleLogout}
          title={!mobile && isCollapsed ? "Sign Out" : undefined}
          className="flex items-center gap-3 text-neutral-600 hover:text-red-600 transition-colors group w-full text-left font-bold"
        >
          <LogOut className="w-4 h-4 stroke-[1.8]" />
          {(!isCollapsed || mobile) && (
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold group-hover:underline underline-offset-4 decoration-1">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r border-neutral-100 overflow-hidden transition-all duration-300 bg-white h-full",
        isCollapsed ? "w-20" : "w-72"
      )}>
        <NavContent />
      </aside>

      {/* Mobile Header / Trigger */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-100 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="bg-black text-white text-[10px]">
              {mounted && user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Account</span>
        </div>

        <Sheet>
          <SheetTrigger className="p-2 text-black hover:bg-neutral-100 transition-colors rounded-full outline-none">
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="sr-only">
              <SheetTitle>Account Navigation</SheetTitle>
            </SheetHeader>
            <NavContent mobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
