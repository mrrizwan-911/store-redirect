'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart2, Package, ShoppingBag, Users, FileText,
  Archive, Tag, Zap, Shirt, Star, Mail, Settings, LogOut,
  ExternalLink, FolderTree, Info, Phone, Menu, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAppDispatch } from '@/store/hooks'
import { logout } from '@/store/slices/authSlice'
import { clearCart } from '@/store/slices/cartSlice'
import { persistor } from '@/store'

const navItems = [
  { icon: BarChart2, label: 'Analytics', route: '/d8f2a1/admin/analytics' },
  { icon: ShoppingBag, label: 'Orders', route: '/d8f2a1/admin/orders' },
  { icon: Package, label: 'Products', route: '/d8f2a1/admin/products' },
  { icon: Archive, label: 'Inventory', route: '/d8f2a1/admin/inventory' },
  { icon: FolderTree, label: 'Categories', route: '/d8f2a1/admin/categories' },
  { icon: Users, label: 'Customers', route: '/d8f2a1/admin/customers' },
  { icon: FileText, label: 'Quotations', route: '/d8f2a1/admin/quotations' },
  { icon: FileText, label: 'Size Guides', route: '/d8f2a1/admin/size-guides' },
  { icon: Tag, label: 'Coupons', route: '/d8f2a1/admin/coupons' },
  { icon: Zap, label: 'Flash Sales', route: '/d8f2a1/admin/flash-sales' },
  { icon: Shirt, label: 'Outfits', route: '/d8f2a1/admin/outfits' },
  { icon: Star, label: 'Loyalty', route: '/d8f2a1/admin/loyalty' },
  { icon: Mail, label: 'Inquiries', route: '/d8f2a1/admin/inquiries' },
  { icon: Mail, label: 'Newsletter', route: '/d8f2a1/admin/notifications?filter=subscribers' },
  { icon: Info, label: 'About', route: '/d8f2a1/admin/settings#about' },
  { icon: Phone, label: 'Contact', route: '/d8f2a1/admin/settings#contact' },
  { icon: Mail, label: 'Notifications', route: '/d8f2a1/admin/notifications' },
  { icon: Settings, label: 'Settings', route: '/d8f2a1/admin/settings' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // still clear client state even if API call fails
    } finally {
      dispatch(logout())
      dispatch(clearCart())
      await persistor.purge()
      router.push('/login')
    }
  }

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-56'
      } bg-white border-r border-neutral-100 flex flex-col h-full font-sans transition-all duration-300 ease-in-out relative`}
    >
      <div className={`p-4 border-b border-neutral-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h1 className="text-sm font-bold font-serif tracking-widest uppercase truncate">Admin</h1>}
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <Link
              href="/"
              className="text-neutral-400 hover:text-black transition-colors"
              title="Back to Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-neutral-400 hover:text-black transition-colors p-1"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.route)
            const Icon = item.icon
            return (
              <li key={item.route} className="px-3">
                <Link
                  href={item.route}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-1.5 text-xs transition-all duration-200 rounded-md ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-semibold'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-neutral-100 mt-auto">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} mb-4`}>
          <div className="w-7 h-7 shrink-0 bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold rounded-full">
            A
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="text-[11px] font-bold text-neutral-900 truncate">Admin User</p>
              <p className="text-[9px] text-neutral-400 truncate">admin@calnza.com</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} w-full text-[11px] font-medium text-neutral-400 hover:text-rose-600 transition-colors`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
