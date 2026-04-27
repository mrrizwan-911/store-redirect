import { AnnouncementBar } from '@/components/store/AnnouncementBar'
import { Navbar } from '@/components/store/Navbar'
import { ConditionalFooter } from '@/components/store/layout/ConditionalFooter'
import { WishlistSyncProvider } from '@/components/store/WishlistSyncProvider'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, {
    next: { revalidate: 300 },
  }).catch(() => null)
  const serverCategories = res?.ok ? (await res.json()).data ?? [] : []

  return (
    <WishlistSyncProvider>
      <div className="flex flex-col min-h-screen">
        <AnnouncementBar />
        <Navbar serverCategories={serverCategories} />
        <main className="flex-1">
          {children}
        </main>
        <ConditionalFooter />
      </div>
    </WishlistSyncProvider>
  )
}
