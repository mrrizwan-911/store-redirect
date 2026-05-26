import { notFound } from 'next/navigation'
import { db } from '@/lib/db/client'
import ProductDetailClient from '@/components/store/pdp/ProductDetailClient'
import { Metadata } from 'next'
import { enrichProductsWithFlashSales, getActiveFlashSaleForProduct, calculateFlashSalePrice } from '@/lib/services/payment/priceValidator'
import { SITE_COUNTRY } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const product = await db.product.findUnique({
    where: { slug: resolvedParams.slug, isActive: true },
    select: {
      name: true,
      shortDescription: true,
      description: true,
      images: { where: { isPrimary: true }, take: 1 },
      pricePK: true,
      priceUK: true,
    }
  })

  if (!product) return { title: 'Product Not Found' }

  const isUK = SITE_COUNTRY === 'UK'
  const price = isUK ? Number(product.priceUK) : Number(product.pricePK)
  const currency = isUK ? 'GBP' : 'PKR'
  const domain = isUK ? 'https://calnza.co.uk' : 'https://calnza.pk'
  const description = product.shortDescription || product.description.substring(0, 155)
  const region = isUK ? 'UK' : 'Pakistan'
  const paymentNote = isUK ? 'Secure GBP payment.' : 'Pay via EasyPaisa, COD or Card.'

  return {
    title: `Buy ${product.name} Online in ${region} | Calnza`,
    description: `${description}. ${paymentNote}`,
    openGraph: {
      title: `${product.name} | Calnza`,
      description,
      type: 'website',
      images: product.images[0]?.url
        ? [{ url: product.images[0].url, width: 800, height: 1000, alt: product.name }]
        : [],
    },
    alternates: {
      canonical: `${domain}/products/${resolvedParams.slug}`,
      languages: {
        'en-PK': `https://calnza.pk/products/${resolvedParams.slug}`,
        'en-GB': `https://calnza.co.uk/products/${resolvedParams.slug}`,
      },
    },
    other: {
      // Preload product image for LCP
      ...(product.images[0]?.url
        ? { 'og:image:secure_url': product.images[0].url }
        : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params
  const product = await db.product.findUnique({
    where: { slug: resolvedParams.slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variants: {
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          optionValues: true,
          stock: true,
          sku: true,
          price: true,
          pricePK: true,
          priceUK: true,
        }
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Calculate avgRating and reviewCount
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : null

  // Fetch category-specific products (Same category, excluding current product, up to 8)
  const categoryProducts = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    take: 8,
  })

  // Fetch related products (e.g., featured or trending items from other categories)
  const relatedProducts = await db.product.findMany({
    where: {
      id: { not: product.id },
      isActive: true,
      isFeatured: true,
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, slug: true } },
    },
    take: 4,
  })

  // Fetch active flash sale for this product
  const activeSale = await getActiveFlashSaleForProduct(product.id)

  // Country-specific pricing
  const isUK = SITE_COUNTRY === 'UK'
  const currentPrice = isUK ? Number(product.priceUK) : Number(product.pricePK)
  const currentSalePrice = isUK
    ? (product.salePriceUK ? Number(product.salePriceUK) : null)
    : (product.salePricePK ? Number(product.salePricePK) : null)

  const enrichedProduct = {
    ...product,
    avgRating,
    reviewCount: product.reviews.length,
    // Ensure Decimal values are converted to Numbers or Strings for client components
    basePrice: currentPrice,
    salePrice: currentSalePrice,
    pricePK: Number(product.pricePK),
    priceUK: Number(product.priceUK),
    salePricePK: product.salePricePK ? Number(product.salePricePK) : null,
    salePriceUK: product.salePriceUK ? Number(product.salePriceUK) : null,
    variants: product.variants.map(v => ({
      ...v,
      price: v.price ? Number(v.price) : null,
      pricePK: v.pricePK ? Number(v.pricePK) : null,
      priceUK: v.priceUK ? Number(v.priceUK) : null,
    })),
    activeSale: activeSale ? {
      id: activeSale.id,
      name: activeSale.name,
      discountPct: activeSale.discountPct,
      discountType: activeSale.discountType,
      discountFlat: activeSale.discountFlat ? Number(activeSale.discountFlat) : null,
      flashSalePrice: calculateFlashSalePrice(currentPrice, activeSale),
      endTime: activeSale.endTime.toISOString()
    } : null
  }

  const enrichedCategoryProducts = await enrichProductsWithFlashSales(categoryProducts.map(p => {
    const cPrice = isUK ? Number(p.priceUK) : Number(p.pricePK)
    const cSalePrice = isUK
      ? (p.salePriceUK ? Number(p.salePriceUK) : null)
      : (p.salePricePK ? Number(p.salePricePK) : null)
    return {
      ...p,
      basePrice: cPrice,
      salePrice: cSalePrice,
      pricePK: Number(p.pricePK),
      priceUK: Number(p.priceUK),
      salePricePK: p.salePricePK ? Number(p.salePricePK) : null,
      salePriceUK: p.salePriceUK ? Number(p.salePriceUK) : null,
    }
  }))

  const enrichedRelatedProducts = await enrichProductsWithFlashSales(relatedProducts.map(p => {
    const cPrice = isUK ? Number(p.priceUK) : Number(p.pricePK)
    const cSalePrice = isUK
      ? (p.salePriceUK ? Number(p.salePriceUK) : null)
      : (p.salePricePK ? Number(p.salePricePK) : null)
    return {
      ...p,
      basePrice: cPrice,
      salePrice: cSalePrice,
      pricePK: Number(p.pricePK),
      priceUK: Number(p.priceUK),
      salePricePK: p.salePricePK ? Number(p.salePricePK) : null,
      salePriceUK: p.salePriceUK ? Number(p.salePriceUK) : null,
    }
  }))

  // Build JSON-LD Product schema for Google rich results
  const domain = SITE_COUNTRY === 'UK' ? 'https://calnza.co.uk' : 'https://calnza.pk'
  const currency = SITE_COUNTRY === 'UK' ? 'GBP' : 'PKR'
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'Calnza' },
    image: product.images.map(img => img.url),
    offers: {
      '@type': 'Offer',
      url: `${domain}/products/${resolvedParams.slug}`,
      priceCurrency: currency,
      price: enrichedProduct.basePrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.variants.some(v => v.stock > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Calnza' },
    },
    ...(enrichedProduct.avgRating && enrichedProduct.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: enrichedProduct.avgRating.toFixed(1),
        reviewCount: enrichedProduct.reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
  }

  return (
    <main className="min-h-screen bg-background pt-4">
      {/* JSON-LD structured data for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        product={enrichedProduct as any}
        categoryProducts={enrichedCategoryProducts as any}
        relatedProducts={enrichedRelatedProducts as any}
      />
    </main>
  )
}
