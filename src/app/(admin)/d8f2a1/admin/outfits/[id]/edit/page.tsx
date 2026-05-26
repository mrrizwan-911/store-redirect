import { OutfitBuilder } from '@/components/admin/outfits/OutfitBuilder'
import { db } from '@/lib/db/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EditOutfitPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params

  let outfit: any = null

  try {
    outfit = await db.outfit.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, basePrice: true, images: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  } catch (err) {
    console.warn('[EditOutfitPage] DB unavailable:', err)
  }

  if (!outfit) notFound()

  const serializedOutfit = {
    ...outfit,
    items: outfit.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice),
      },
    })),
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-neutral-100 pb-5">
        <Link
          href="/d8f2a1/admin/outfits"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Edit Look</h1>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-widest truncate max-w-xs">
            {outfit.title}
          </p>
        </div>
      </div>
      <OutfitBuilder initialData={serializedOutfit} />
    </div>
  )
}

