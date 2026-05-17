import { validateAdmin } from '@/lib/auth/serverAuth'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Centralized admin validation (redirects if not admin)
  await validateAdmin()

  return (
    <div className="flex h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-hidden">
      <AdminSidebar />
      {/*
        On mobile: AdminSidebar renders only a fixed top bar (h=~48px).
        We add pt-12 on mobile so content doesn't go under the top bar.
        On lg+: the sidebar is a side panel, no top padding needed.
      */}
      <main className="flex-1 overflow-y-auto pt-20 pb-12 px-4 sm:px-6 md:px-8 lg:px-12 lg:py-12 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
