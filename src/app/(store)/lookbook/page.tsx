import { db } from '@/lib/db/client'
import { OutfitCard } from '@/components/store/OutfitCard'
import { LookbookFilters } from '@/components/store/LookbookFilters'
import { getValidatedPrice } from '@/lib/services/payment/priceValidator'

export const dynamic = 'force-dynamic'

async function getLookbookFilters() {
  try {
    const settings = await db.siteSettings.findUnique({ where: { id: 'global' } })
    if (settings && (settings as any).lookbookFilters) {
      const f = (settings as any).lookbookFilters as any
      return {
        seasons: Array.isArray(f.seasons) ? f.seasons : ['All Season', 'Summer', 'Winter'],
        occasions: Array.isArray(f.occasions) ? f.occasions : ['Casual', 'Formal', 'Festive'],
        genders: Array.isArray(f.genders) ? f.genders : ['Men', 'Women', 'Unisex'],
      }
    }
  } catch {}
  return {
    seasons: ['All Season', 'Summer', 'Winter'],
    occasions: ['Casual', 'Formal', 'Festive'],
    genders: ['Men', 'Women', 'Unisex'],
  }
}

export default async function LookbookPage({
  searchParams,
}: {
  searchParams: Promise<{ gender?: string; season?: string; occasion?: string }>
}) {
  const params = await searchParams
  const whereClause: any = { isPublished: true }

  if (params.gender && params.gender !== 'All') whereClause.gender = params.gender
  if (params.season && params.season !== 'All') whereClause.season = params.season
  if (params.occasion && params.occasion !== 'All') whereClause.occasion = params.occasion

  const [outfits, filterOptions] = await Promise.all([
    db.outfit.findMany({
      where: whereClause,
      include: {
        items: {
          include: { product: { select: { id: true, basePrice: true, salePrice: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getLookbookFilters(),
  ])

  const mappedOutfits = await Promise.all(
    outfits.map(async outfit => {
      const itemPrices = await Promise.all(
        outfit.items.map(item => getValidatedPrice(item.product.id))
      )
      const totalPrice = itemPrices.reduce((sum, price) => sum + price, 0)
      
      const serializedItems = outfit.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          basePrice: item.product.basePrice ? Number(item.product.basePrice) : null,
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
        }
      }))
      
      return { ...outfit, items: serializedItems, itemCount: outfit.items.length, totalPrice }
    })
  )

  const filterGroups = [
    { label: 'Season', paramKey: 'season' as const, values: filterOptions.seasons },
    { label: 'Occasion', paramKey: 'occasion' as const, values: filterOptions.occasions },
    { label: 'Gender', paramKey: 'gender' as const, values: filterOptions.genders },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#f5f0eb_0%,_#ffffff_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 mb-4 font-medium">
            Curated Styles
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-playfair font-bold text-neutral-900 leading-none mb-5">
            The Look Book
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Complete outfits curated by our stylists — discover, get inspired, shop the look.
          </p>

          {mappedOutfits.length > 0 && (
            <p className="mt-4 text-[11px] uppercase tracking-[0.3em] text-neutral-300">
              {mappedOutfits.length} {mappedOutfits.length === 1 ? 'look' : 'looks'}
            </p>
          )}
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <LookbookFilters filterGroups={filterGroups} currentParams={params} />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {mappedOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-neutral-400 text-sm uppercase tracking-widest">No looks found</p>
            <p className="text-neutral-300 text-xs mt-2">Try clearing your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {mappedOutfits.map((outfit, index) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                featured={index === 0 && mappedOutfits.length > 2}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
