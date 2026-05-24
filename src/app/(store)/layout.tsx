import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { AnnouncementBar } from '@/components/store/AnnouncementBar'
import { Navbar } from '@/components/store/Navbar'
import { ConditionalFooter } from '@/components/store/layout/ConditionalFooter'
import { WishlistSyncProvider } from '@/components/store/WishlistSyncProvider'
import { ComparisonBar } from '@/components/store/compare/ComparisonBar'
import { CountrySelector } from '@/components/store/CountrySelector'
import { db } from '@/lib/db/client'

// Cache nav categories for 5 minutes — avoids DB hit on every page render
const getNavCategories = unstable_cache(
  async () => {
    return db.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, sortOrder: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }).catch(() => [])
  },
  ['nav-categories'],
  { revalidate: 300, tags: ['categories'] }
)

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Detect visitor's country from Cloudflare header or Vercel header
  const headersList = await headers()
  const cfCountry = headersList.get('cf-ipcountry')
  const vercelCountry = headersList.get('x-vercel-ip-country')
  const detectedCountry = cfCountry || vercelCountry || null

  // Cached — hits DB only once per 5 minutes across all users
  const serverCategories = await getNavCategories()


  return (
    <WishlistSyncProvider>
      <div className="flex flex-col min-h-screen relative">
        <AnnouncementBar />
        <Navbar serverCategories={serverCategories as any} />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <ComparisonBar />
        <ConditionalFooter />
        <CountrySelector detectedCountry={detectedCountry} />
      </div>
    </WishlistSyncProvider>
  )
}
