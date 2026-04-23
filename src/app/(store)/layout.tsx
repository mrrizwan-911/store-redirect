import { AnnouncementBar } from '@/components/store/AnnouncementBar'
import { Navbar } from '@/components/store/Navbar'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'

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
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar serverCategories={serverCategories} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
