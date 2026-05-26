import { db } from '@/lib/db/client'
import { FlashSaleForm } from '@/components/admin/promotions/FlashSaleForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface EditFlashSalePageProps {
  params: Promise<{ id: string }>
}

export default async function EditFlashSalePage({ params }: EditFlashSalePageProps) {
  const { id } = await params

  let sale: any = null
  let categories: any[] = []

  try {
    ;[sale, categories] = await Promise.all([
      db.flashSale.findUnique({
        where: { id },
      }),
      db.category.findMany({
        where: { isActive: true },
        include: {
          products: {
            where: { isActive: true },
            select: { id: true, name: true, basePrice: true },
            orderBy: { name: 'asc' },
          }
        },
        orderBy: { name: 'asc' },
      })
    ])
  } catch (err) {
    console.warn('[EditFlashSalePage] DB unavailable:', err)
  }

  if (!sale) {
    notFound()
  }

  // Format categorized products for the form
  const categorizedProducts = categories
    .filter(cat => cat.products.length > 0)
    .map((cat) => ({
      categoryName: cat.name,
      products: cat.products.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.basePrice),
      }))
    }))

  // Convert dates and decimal to match form requirements
  // We use a helper to ensure datetime-local compatibility (YYYY-MM-DDTHH:mm)
  const formatForInput = (date: Date) => {
    const d = new Date(date)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const initialData = {
    ...sale,
    discountFlat: sale.discountFlat ? Number(sale.discountFlat) : 0,
    startTime: formatForInput(sale.startTime),
    endTime: formatForInput(sale.endTime),
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Edit Flash Sale</h1>
      </div>
      <FlashSaleForm initialData={initialData} categorizedProducts={categorizedProducts} />
    </div>
  )
}
