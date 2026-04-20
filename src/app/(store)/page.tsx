import { HeroBanner } from '@/components/store/home/HeroBanner'
import { CategoryTiles } from '@/components/store/home/CategoryTiles'
import { FeaturedProducts } from '@/components/store/home/FeaturedProducts'
import { NewArrivalsStrip } from '@/components/store/home/NewArrivalsStrip'
import { LookbookTeaser } from '@/components/store/home/LookbookTeaser'
import { NewsletterSection } from '@/components/store/home/NewsletterSection'
import { headers } from 'next/headers'
import { appendFile } from 'node:fs/promises'

export default async function Homepage() {
  try {
    const requestHeaders = await headers()
    const userAgent = requestHeaders.get('user-agent') ?? 'unknown'
    const secChUa = requestHeaders.get('sec-ch-ua') ?? 'missing'
    // #region agent log
    await appendFile(
      '/home/hasan/clothes-store/.cursor/debug-072827.log',
      `${JSON.stringify({
        sessionId: '072827',
        runId: 'initial-repro-2',
        hypothesisId: 'H6',
        location: 'src/app/(store)/page.tsx:16',
        message: 'homepage-server-render',
        data: {
          route: '/',
          userAgent: userAgent.slice(0, 140),
          secChUa: secChUa.slice(0, 140),
        },
        timestamp: Date.now(),
      })}\n`
    )
    // #endregion
  } catch {}

  return (
    <main>
      <HeroBanner />
      <CategoryTiles />
      <FeaturedProducts />
      <NewArrivalsStrip />
      <LookbookTeaser />
      <NewsletterSection />
    </main>
  )
}
