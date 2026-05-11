import { AnnouncementBar } from '@/components/store/AnnouncementBar'
import { Navbar } from '@/components/store/Navbar'
import { ConditionalFooter } from '@/components/store/layout/ConditionalFooter'
import { WishlistSyncProvider } from '@/components/store/WishlistSyncProvider'
import { ComparisonBar } from '@/components/store/compare/ComparisonBar'
import { PWASplashScreen } from '@/components/store/PWASplashScreen'
import { db } from '@/lib/db/client'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Directly fetch categories from DB to avoid build-time fetch timeouts
  const serverCategories = await db.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  }).catch(() => [])

  return (
    <WishlistSyncProvider>
      <PWASplashScreen />
      <div className="flex flex-col min-h-screen relative">
        <AnnouncementBar />
        <Navbar serverCategories={serverCategories as any} />
        <main className="flex-1">
          {children}
        </main>
        <ComparisonBar />
        <ConditionalFooter />
      </div>
    </WishlistSyncProvider>
  )
}
