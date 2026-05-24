import { db } from '@/lib/db/client'
import { notFound } from 'next/navigation'
import { VariantsMatrixClient } from '@/components/admin/products/VariantsMatrixClient'

export const dynamic = 'force-dynamic'

export default async function VariantsMatrixPage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
  const product = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sku: 'asc' } }
    },
  })

  if (!product) {
    notFound()
  }

  // Serialize decimal to numbers
  const variants = product.variants.map((v) => ({
    id: v.id,
    title: v.title,
    sku: v.sku,
    stock: v.stock,
    price: v.price ? Number(v.price) : null,
    pricePK: v.pricePK ? Number(v.pricePK) : null,
    priceUK: v.priceUK ? Number(v.priceUK) : null
  }))

  return (
    <div className="p-8">
      <h1 className="font-playfair text-3xl font-bold text-[#000000] mb-2">Variant Matrix</h1>
      <p className="text-[#737373] mb-8">Bulk edit inventory, SKUs, and pricing for <span className="font-semibold text-black">{product.name}</span></p>
      
      {variants.length === 0 ? (
        <div className="p-8 bg-[#FAFAFA] border border-[#E5E5E5] text-center">
          <p className="text-[#737373]">No variants found for this product.</p>
        </div>
      ) : (
        <VariantsMatrixClient productId={product.id} variants={variants} />
      )}
    </div>
  )
}
