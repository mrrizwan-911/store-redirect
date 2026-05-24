'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ImageGallery from './ImageGallery'
import VariantSelector from './VariantSelector'
import AddToCartButton from './AddToCartButton'
import ReviewsSection from './ReviewsSection'
import { ProductCard } from '../shared/ProductCard'
import { SizeGuideModal } from '../shared/SizeGuideModal'
import { RecentlyViewed } from '../shared/RecentlyViewed'
import { FlashSaleCountdown } from '../FlashSaleCountdown'
import { useWishlist } from '@/hooks/useWishlist'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import {
  ChevronRight, MessageCircle, Heart, RefreshCcw, Truck,
  ShieldCheck, Plus, Minus, Share2, Copy, Check, Scale,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToCompare, removeFromCompare } from '@/store/slices/compareSlice'
import { toast } from 'sonner'
import { formatPrice, currencySymbol } from '@/lib/utils/currency'
import { generateWhatsAppOrderUrl } from '@/lib/utils/whatsapp'
import { fbViewContent } from '@/lib/utils/metaPixel'
import { sendGAEvent } from '@next/third-parties/google'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  basePrice: any
  salePrice?: any | null
  activeSale?: {
    id: string
    name: string
    discountPct: number | null
    discountType: string
    discountFlat: number | null
    flashSalePrice: number
    endTime: string
  } | null
  sku: string
  category: { name: string; slug: string }
  images: { id: string; url: string; altText?: string | null; isPrimary: boolean }[]
  variantOptions: any
  variants: { id: string; title: string; optionValues: any; stock: number; price?: any | null; sku: string }[]
  reviews: any[]
  avgRating: number | null
  reviewCount: number
}

interface ProductDetailClientProps {
  product: Product
  categoryProducts: any[]
  relatedProducts: any[]
}

export default function ProductDetailClient({ product, categoryProducts, relatedProducts }: ProductDetailClientProps) {
  const dispatch = useAppDispatch()
  const { items: compareItems } = useAppSelector((state) => state.compare)
  const isInCompare = compareItems.some((item) => item.id === product.id)

  const { isInWishlist, toggle: handleWishlistToggle } = useWishlist(product.id)
  const { addViewedProduct } = useRecentlyViewed()
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const isWishlisted          = mounted && isInWishlist

  useEffect(() => {
    setMounted(true)
    if (product.id) addViewedProduct(product.id)
    
    // Fire Meta Pixel ViewContent event
    fbViewContent({
      content_name: product.name,
      content_ids: [product.id],
      content_type: 'product',
      value: Number(product.salePrice || product.basePrice),
      currency: typeof window !== 'undefined' && window.location.hostname.includes('co.uk') ? 'GBP' : 'PKR'
    })

    // Fire Google Analytics view_item event
    sendGAEvent('event', 'view_item', {
      currency: typeof window !== 'undefined' && window.location.hostname.includes('co.uk') ? 'GBP' : 'PKR',
      value: Number(product.salePrice || product.basePrice),
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          item_category: product.category.name,
          price: Number(product.salePrice || product.basePrice),
        }
      ]
    })

    // Fetch dynamic WhatsApp number from site settings
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.whatsappNumber) {
          setWhatsappPhone(d.data.whatsappNumber.replace(/[^0-9]/g, ''))
        }
      })
      .catch(() => {})
  }, [product.id])

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isInCompare) {
      dispatch(removeFromCompare(product.id))
      toast.success('Removed from comparison')
    } else {
      if (compareItems.length >= 3) { toast.error('You can only compare up to 3 items'); return }
      dispatch(addToCompare({
        id: product.id, name: product.name, slug: product.slug, price: Number(product.basePrice),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        imageUrl: product.images[0]?.url || '/placeholder.png',
        category: product.category.name, sku: product.sku, description: product.description,
        avgRating: product.avgRating, reviewCount: product.reviewCount,
      }))
      toast.success('Added to comparison')
    }
  }

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (product.variants && product.variants.length > 0) return product.variants[0].optionValues || {}
    return {}
  })
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description')

  const selectedVariant = useMemo(() => {
    if (product.variants.length === 0) return null
    return product.variants.find((v) => {
      const vOpts = v.optionValues || {}
      return Object.keys(selectedOptions).every(k => vOpts[k] === selectedOptions[k])
    }) || null
  }, [product.variants, selectedOptions])

  const currentPrice = useMemo(() => {
    const baseUnitPrice = Number(selectedVariant?.price || product.salePrice || product.basePrice)
    if (product.activeSale) {
      if (product.activeSale.discountType === 'PERCENTAGE') {
        const discountPct = product.activeSale.discountPct || 0
        return Math.round(baseUnitPrice * (1 - discountPct / 100) * 100) / 100
      } else if (product.activeSale.discountType === 'FLAT') {
        const discountFlat = Number(product.activeSale.discountFlat || 0)
        return Math.max(0, Math.round((baseUnitPrice - discountFlat) * 100) / 100)
      }
    }
    return baseUnitPrice
  }, [selectedVariant, product.salePrice, product.basePrice, product.activeSale])

  const originalPrice = useMemo(() => {
    if (product.activeSale) return Number(selectedVariant?.price || product.basePrice)
    return product.salePrice ? Number(product.basePrice) : null
  }, [selectedVariant, product.basePrice, product.salePrice, product.activeSale])

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      const maxStock = selectedVariant?.stock || 9999
      if (quantity < maxStock) setQuantity(prev => prev + 1)
    } else {
      if (quantity > 1) setQuantity(prev => prev - 1)
    }
  }

  const handleWhatsAppOrder = () => {
    const opts = selectedOptions || {}
    const color = opts['Color'] || opts['color'] || undefined
    const size  = opts['Size']  || opts['size']  || undefined
    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/products/${product.slug}`
    const url = generateWhatsAppOrderUrl({
      productName: product.name,
      sku: selectedVariant?.sku || product.sku,
      color,
      size,
      quantity,
      unitPrice: currentPrice,
      total: currentPrice * quantity,
      productUrl,
      currencySymbol: currencySymbol(),
      phoneOverride: whatsappPhone,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleWhatsAppShare = () => {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/products/${product.slug}`
    const text = encodeURIComponent(`Check out this ${product.name} on CALNZA!\n\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleCopyLink = async () => {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/products/${product.slug}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/products/${product.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: product.shortDescription || product.description, url }) }
      catch (err) { logger.error('Error sharing', err) }
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    /* overflow-x-hidden prevents any inner element from causing horizontal scroll */
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 pb-16 overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-4 overflow-x-auto scrollbar-hide">
        <Link href="/" className="hover:text-text-primary transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
        <Link href={`/categories/${product.category.slug}`} className="hover:text-text-primary transition-colors shrink-0">
          {product.category.name}
        </Link>
        <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
        <span className="text-text-primary truncate max-w-[120px] sm:max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-6xl mx-auto">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 lg:col-start-2">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Product Details */}
        <div className="lg:col-span-4 pt-4 lg:pr-8 space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={cn('text-sm', i < Math.round(product.avgRating || 0) ? 'opacity-100' : 'opacity-20')}>★</span>
                  ))}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                  ({product.reviewCount} Reviews)
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                SKU: {selectedVariant?.sku || product.sku}
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-xl font-light tracking-tight">{formatPrice(currentPrice)}</span>
              {originalPrice && (
                <span className="text-base text-text-secondary line-through opacity-50">{formatPrice(originalPrice)}</span>
              )}
            </div>
          </div>

          <p className="text-text-secondary text-xs leading-relaxed">
            {product.shortDescription || product.description.substring(0, 160) + '...'}
          </p>

          <VariantSelector
            variantOptions={product.variantOptions || []}
            variants={product.variants}
            selectedOptions={selectedOptions}
            onOptionsChange={setSelectedOptions}
          />

          <div className="flex justify-end">
            <SizeGuideModal categoryName={product.category.name} categorySlug={product.category.slug} />
          </div>

          {product.activeSale && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
              <FlashSaleCountdown
                saleEndTimeUTC={product.activeSale.endTime}
                saleName={product.activeSale.name}
                discountPct={product.activeSale.discountPct || 0}
              />
            </div>
          )}

          <div className="space-y-6 pt-4">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Quantity</span>
              <div className="flex items-center border border-border rounded-[var(--radius)] overflow-hidden">
                <button onClick={() => handleQuantityChange('dec')} className="p-3 hover:bg-neutral-50 transition-colors disabled:opacity-30 border-r border-border" disabled={quantity <= 1}>
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => handleQuantityChange('inc')} className="p-3 hover:bg-neutral-50 transition-colors border-l border-border">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {selectedVariant && (
                <div className={cn(
                  'flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold ml-auto',
                  selectedVariant.stock > 10 ? 'text-success' : selectedVariant.stock > 0 ? 'text-warning' : 'text-error',
                )}>
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full animate-pulse',
                    selectedVariant.stock > 10 ? 'bg-success' : selectedVariant.stock > 0 ? 'bg-warning' : 'bg-error',
                  )} />
                  {selectedVariant.stock > 10 ? 'In Stock' : selectedVariant.stock > 0 ? `Only ${selectedVariant.stock} left!` : 'Out of Stock'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 pt-4">
              <AddToCartButton product={product} selectedVariant={selectedVariant} quantity={quantity} priceOverride={currentPrice} />

              {/* WhatsApp + Share buttons
                  On phones ≤ 360px, flex-row was overflowing. flex-col first,
                  then flex-row at xs (480px) via Tailwind. */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3.5 px-6 border-2 border-black rounded-full flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all duration-500 group"
                >
                  <MessageCircle className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>WhatsApp Order</span>
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 flex items-center justify-center gap-2 border border-border rounded-full text-text-secondary hover:text-black hover:border-black px-4 py-3 transition-all duration-500 text-[10px] uppercase tracking-widest font-bold"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="h-4 w-4 shrink-0" />
                    Share
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 border border-border rounded-full text-text-secondary hover:text-black hover:border-black px-4 py-3 transition-all duration-500 text-[10px] uppercase tracking-widest font-bold"
                    title="Copy link"
                  >
                    {copied ? (
                      <><Check className="h-4 w-4 text-success shrink-0" /><span className="text-success">Copied!</span></>
                    ) : (
                      <><Copy className="h-4 w-4 shrink-0" />Link</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 pt-2">
              <button
                onClick={(e) => { e.preventDefault(); handleWishlistToggle() }}
                className={cn(
                  'flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold transition-all',
                  isWishlisted ? 'text-black' : 'text-text-secondary hover:text-black',
                )}
              >
                <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
                {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleCompare}
                className={cn(
                  'flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold transition-all',
                  isInCompare ? 'text-black' : 'text-text-secondary hover:text-black',
                )}
              >
                <Scale className={cn('w-3.5 h-3.5', isInCompare && 'fill-current')} />
                {isInCompare ? 'In Comparison' : 'Compare'}
              </button>
            </div>

            {/* Social Share */}
            <div className="flex flex-wrap justify-center gap-4 pt-6 mt-6 border-t border-border">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary self-center">Share:</span>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent((process.env.NEXT_PUBLIC_APP_URL || window.location.origin) + '/products/' + product.slug)}`, '_blank')}
                className="p-2 text-text-secondary hover:text-black transition-colors" aria-label="Share on Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent((process.env.NEXT_PUBLIC_APP_URL || window.location.origin) + '/products/' + product.slug)}&text=${encodeURIComponent(product.name)}`, '_blank')}
                className="p-2 text-text-secondary hover:text-black transition-colors" aria-label="Share on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </button>
              <button onClick={handleShare} className="p-2 text-text-secondary hover:text-black transition-colors" aria-label="Copy Link">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Features */}
          <div className="grid grid-cols-2 gap-y-6 pt-10 border-t border-border">
            {[
              { icon: Truck,        title: 'Free Delivery',     sub: 'On orders over {formatPrice(3000)}' },
              { icon: RefreshCcw,   title: 'Easy Returns',      sub: '7-day hassle free returns' },
              { icon: ShieldCheck,  title: 'Genuine Products',  sub: '100% authentic quality' },
              { icon: MessageCircle,title: 'Expert Support',    sub: '24/7 dedicated assistance' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex gap-3">
                <Icon className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold">{title}</h4>
                  <p className="text-[11px] text-text-secondary">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs Section ──
          Tab padding px-8 was overflowing on mobile. Changed to px-3 sm:px-6 md:px-8. */}
      <div className="mt-16 md:mt-32 overflow-x-hidden">
        <div className="flex justify-center border-b border-border mb-10 md:mb-12 overflow-x-auto scrollbar-hide">
          {(['description', 'reviews', 'shipping'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 sm:px-6 md:px-8 py-5 sm:py-6 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold transition-all relative whitespace-nowrap',
                activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-primary',
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
              )}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto py-8 min-h-[300px]">
          {activeTab === 'description' && (
            <div className="prose prose-neutral max-w-none text-text-primary">
              <div className="whitespace-pre-wrap leading-loose text-base sm:text-lg font-light">
                {product.description}
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <ReviewsSection reviews={product.reviews} avgRating={product.avgRating} reviewCount={product.reviewCount} />
          )}
          {activeTab === 'shipping' && (
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 text-sm">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest">Shipping & Handling</h4>
                <p className="text-text-secondary leading-relaxed">
                  We currently offer delivery across all major cities in Pakistan. Orders are typically processed within 24–48 hours. Standard delivery takes 3–5 business days. Express delivery (available in selected cities) takes 1–2 business days.
                </p>
                <p className="text-text-secondary leading-relaxed">Free standard delivery is available on all orders exceeding {formatPrice(3000)}.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest">Returns & Exchanges</h4>
                <p className="text-text-secondary leading-relaxed">
                  We accept returns for items in their original condition (unworn, unwashed, with tags attached) within 7 days of delivery. Certain categories like undergarments and earrings are not eligible for return unless defective.
                </p>
                <p className="text-text-secondary leading-relaxed">Refunds are processed to your original payment method within 5–7 working days after inspection.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Products */}
      {categoryProducts.length > 0 && (
        <div className="mt-16 md:mt-32 border-t border-border pt-16 md:pt-24">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 md:mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-bold mb-2 block">Discovery</span>
              <h3 className="text-2xl sm:text-3xl font-display uppercase tracking-tight">More from {product.category.name}</h3>
            </div>
            <Link href={`/categories/${product.category.slug}`} className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity w-fit">
              Explore Category
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {categoryProducts.map((p) => (
              <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={Number(p.basePrice)} salePrice={p.salePrice ? Number(p.salePrice) : undefined} category={p.category.name} imageUrl={p.images[0]?.url || '/placeholder.png'} sku={p.sku} description={p.description} avgRating={p.avgRating || undefined} reviewCount={p.reviewCount} />
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 md:mt-32 border-t border-border pt-16 md:pt-24">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10 md:mb-12">
            <h3 className="text-2xl sm:text-3xl font-display uppercase tracking-tight">You Might Also Like</h3>
            <Link href={`/categories/${product.category.slug}`} className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity w-fit">
              View All {product.category.name}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} id={p.id} name={p.name} slug={p.slug} price={Number(p.basePrice)} salePrice={p.salePrice ? Number(p.salePrice) : undefined} category={p.category.name} imageUrl={p.images[0]?.url || '/placeholder.png'} sku={p.sku} description={p.description} avgRating={p.avgRating || undefined} reviewCount={p.reviewCount} />
            ))}
          </div>
        </div>
      )}

      <RecentlyViewed />
    </div>
  )
}
