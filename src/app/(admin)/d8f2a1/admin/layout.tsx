import { validateAdmin } from '@/lib/auth/serverAuth'
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Centralized admin validation (redirects if not admin)
  await validateAdmin()

  return (
    <div className="flex h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
