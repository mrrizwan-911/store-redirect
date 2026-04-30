'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ImageGallery from './ImageGallery'
import VariantSelector from './VariantSelector'
import AddToCartButton from './AddToCartButton'
import ReviewsSection from './ReviewsSection'
import { ProductCard } from '../shared/ProductCard'
import { SizeGuideModal } from '../shared/SizeGuideModal'
import { useWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  MessageCircle,
  Heart,
  RefreshCcw,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Share2,
  Copy,
  Check,
  Scale
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addToCompare, removeFromCompare } from '@/store/slices/compareSlice'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string | null
  basePrice: any // Decimal from Prisma
  salePrice?: any | null
  sku: string
  category: {
    name: string
    slug: string
  }
  images: {
    id: string
    url: string
    altText?: string | null
    isPrimary: boolean
  }[]
  variantOptions: any
  variants: {
    id: string
    title: string
    optionValues: any
    stock: number
    price?: any | null
    sku: string
  }[]
  reviews: any[]
  avgRating: number | null
  reviewCount: number
}

interface ProductDetailClientProps {
  product: Product
  relatedProducts: any[]
}

export default function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const dispatch = useAppDispatch()
  const { items: compareItems } = useAppSelector((state) => state.compare)
  const isInCompare = compareItems.some((item) => item.id === product.id)

  const { isInWishlist, toggle: handleWishlistToggle } = useWishlist(product.id)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const isWishlisted = mounted && isInWishlist

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isInCompare) {
      dispatch(removeFromCompare(product.id))
      toast.success('Removed from comparison')
    } else {
      if (compareItems.length >= 3) {
        toast.error('You can only compare up to 3 items')
        return
      }
      dispatch(addToCompare({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.basePrice),
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        imageUrl: product.images[0]?.url || '/placeholder.png',
        category: product.category.name,
        sku: product.sku,
        description: product.description,
        avgRating: product.avgRating,
        reviewCount: product.reviewCount
      }))
      toast.success('Added to comparison')
    }
  }

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].optionValues || {}
    }
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

  const currentPrice = Number(selectedVariant?.price || product.salePrice || product.basePrice)
  const originalPrice = product.salePrice ? Number(product.basePrice) : null

  const handleQuantityChange = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      const maxStock = selectedVariant?.stock || 99
      if (quantity < maxStock) setQuantity(prev => prev + 1)
    } else {
      if (quantity > 1) setQuantity(prev => prev - 1)
    }
  }

  const handleWhatsAppOrder = () => {
    const message = encodeURIComponent(
      `Hi! I'm interested in the ${product.name}.\n` +
      `URL: ${window.location.origin}/products/${product.slug}\n` +
      (Object.keys(selectedOptions).length > 0 ? Object.entries(selectedOptions).map(([k,v]) => `${k}: ${v}`).join('\n') + '\n' : '') +
      `Quantity: ${quantity}`
    )
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+923000000000'}?text=${message}`, '_blank')
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out ${product.name} on our store!\n${window.location.href}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${product.slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: url,
        })
      } catch (err) {
        console.log('Error sharing', err)
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-10">
        <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 opacity-50" />
        <Link href={`/categories/${product.category.slug}`} className="hover:text-text-primary transition-colors">
          {product.category.name}
        </Link>
        <ChevronRight className="w-3 h-3 opacity-50" />
        <span className="text-text-primary truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 max-w-6xl mx-auto">
        {/* Left: Image Gallery (6 cols on large screens) */}
        <div className="lg:col-span-6 lg:col-start-2">
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Product Details (4 cols on large screens) */}
        <div className="lg:col-span-4 pt-4 lg:pr-8 space-y-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-display leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={cn(
                      "text-sm",
                      i < Math.round(product.avgRating || 0) ? "opacity-100" : "opacity-20"
                    )}>★</span>
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
              <span className="text-xl font-light tracking-tight">
                PKR {currentPrice.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-base text-text-secondary line-through opacity-50">
                  PKR {originalPrice.toLocaleString()}
                </span>
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
            <SizeGuideModal
              categoryName={product.category.name}
              categorySlug={product.category.slug}
            />
          </div>

          <div className="space-y-6 pt-4">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">Quantity</span>
              <div className="flex items-center border border-border">
                <button
                  onClick={() => handleQuantityChange('dec')}
                  className="p-3 hover:bg-neutral-50 transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-12 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange('inc')}
                  className="p-3 hover:bg-neutral-50 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Stock Badge */}
              <div className="ml-auto">
                {selectedVariant && (
                  <div className={cn(
                    "flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold",
                    selectedVariant.stock > 10 ? "text-success" :
                    selectedVariant.stock > 0 ? "text-warning" : "text-error"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      selectedVariant.stock > 10 ? "bg-success" :
                      selectedVariant.stock > 0 ? "bg-warning" : "bg-error"
                    )} />
                    {selectedVariant.stock > 10 ? "In Stock" :
                     selectedVariant.stock > 0 ? `Only ${selectedVariant.stock} left!` : "Out of Stock"}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <AddToCartButton
                product={product}
                selectedVariant={selectedVariant}
                quantity={quantity}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleWhatsAppOrder}
                  className="flex-1 py-3 border border-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold hover:bg-neutral-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">WhatsApp Order</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-[#E5E5E5] text-[#737373] hover:text-[#000000] hover:border-[#000000] px-3 py-2.5 transition-colors text-[10px]"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="h-4 w-4 shrink-0" />
                    Share
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-[#E5E5E5] text-[#737373] hover:text-[#000000] hover:border-[#000000] px-3 py-2.5 transition-colors text-[10px] min-w-[90px]"
                    title="Copy link"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-[#10B981] shrink-0" />
                        <span className="text-[#10B981]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 shrink-0" />
                        Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-8 pt-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  handleWishlistToggle()
                }}
                className={cn(
                  "flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold transition-all",
                  isWishlisted ? "text-black" : "text-text-secondary hover:text-black"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", isWishlisted && "fill-current")} />
                {isWishlisted ? "In Wishlist" : "Add to Wishlist"}
              </button>
              <button
                onClick={handleCompare}
                className={cn(
                  "flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold transition-all",
                  isInCompare ? "text-black" : "text-text-secondary hover:text-black"
                )}
              >
                <Scale className={cn("w-3.5 h-3.5", isInCompare && "fill-current")} />
                {isInCompare ? "In Comparison" : "Compare"}
              </button>
            </div>

            {/* Social Share */}
            <div className="flex justify-center gap-4 pt-6 mt-6 border-t border-border">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary self-center">Share:</span>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/products/' + product.slug)}`, '_blank')}
                className="p-2 text-text-secondary hover:text-black transition-colors"
                aria-label="Share on Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/products/' + product.slug)}&text=${encodeURIComponent(product.name)}`, '_blank')}
                className="p-2 text-text-secondary hover:text-black transition-colors"
                aria-label="Share on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-text-secondary hover:text-black transition-colors"
                aria-label="Copy Link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Features */}
          <div className="grid grid-cols-2 gap-y-6 pt-10 border-t border-border">
            <div className="flex gap-3">
              <Truck className="w-4 h-4 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Free Delivery</h4>
                <p className="text-[11px] text-text-secondary">On orders over PKR 3,000</p>
              </div>
            </div>
            <div className="flex gap-3">
              <RefreshCcw className="w-4 h-4 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Easy Returns</h4>
                <p className="text-[11px] text-text-secondary">7-day hassle free returns</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="w-4 h-4 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Genuine Products</h4>
                <p className="text-[11px] text-text-secondary">100% authentic quality</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MessageCircle className="w-4 h-4 text-text-secondary" />
              <div>
                <h4 className="text-[10px] uppercase tracking-widest font-bold">Expert Support</h4>
                <p className="text-[11px] text-text-secondary">24/7 dedicated assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-32">
        <div className="flex justify-center border-b border-border mb-12">
          {['description', 'reviews', 'shipping'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-8 py-6 text-xs uppercase tracking-[0.3em] font-bold transition-all relative",
                activeTab === tab ? "text-primary" : "text-text-secondary hover:text-primary"
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
              <div className="whitespace-pre-wrap leading-loose text-lg font-light">
                {product.description}
              </div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <ReviewsSection
              reviews={product.reviews}
              avgRating={product.avgRating}
              reviewCount={product.reviewCount}
            />
          )}
          {activeTab === 'shipping' && (
            <div className="grid md:grid-cols-2 gap-12 text-sm">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest">Shipping & Handling</h4>
                <p className="text-text-secondary leading-relaxed">
                  We currently offer delivery across all major cities in Pakistan. Orders are typically processed
                  within 24-48 hours. Standard delivery takes 3-5 business days. Express delivery (available
                  in selected cities) takes 1-2 business days.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Free standard delivery is available on all orders exceeding PKR 3,000.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest">Returns & Exchanges</h4>
                <p className="text-text-secondary leading-relaxed">
                  We accept returns for items in their original condition (unworn, unwashed, with tags attached)
                  within 7 days of delivery. For hygiene reasons, certain categories like undergarments and
                  earrings are not eligible for return unless defective.
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Refunds are processed to your original payment method within 5-7 working days after we
                  receive and inspect the return.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-32 border-t border-border pt-24">
          <div className="flex justify-between items-end mb-12">
            <h3 className="text-3xl font-display uppercase tracking-tight">You Might Also Like</h3>
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-[10px] uppercase tracking-[0.2em] font-bold border-b border-black pb-1 hover:opacity-50 transition-opacity"
            >
              View All {product.category.name}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                price={Number(p.basePrice)}
                salePrice={p.salePrice ? Number(p.salePrice) : undefined}
                category={p.category.name}
                imageUrl={p.images[0]?.url || '/placeholder.png'}
                sku={p.sku}
                description={p.description}
                avgRating={p.avgRating || undefined}
                reviewCount={p.reviewCount}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
