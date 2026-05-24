'use client'

import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addItem, openCart } from '@/store/slices/cartSlice'
import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fbAddToCart } from '@/lib/utils/metaPixel'
import { sendGAEvent } from '@next/third-parties/google'

interface AddToCartButtonProps {
  product: {
    id: string
    name: string
    basePrice: number
    salePrice?: number | null
    images: { url: string }[]
  }
  selectedVariant: {
    id: string
    title: string
    stock: number
    price?: number | null
  } | null
  quantity: number
  priceOverride?: number // Added for flash sale support
  className?: string
}

export default function AddToCartButton({
  product,
  selectedVariant,
  quantity,
  priceOverride,
  className,
}: AddToCartButtonProps) {
  const dispatch = useAppDispatch()
  const { items: cartItems } = useAppSelector((state) => state.cart)
  const [isAdding, setIsAdding] = useState(false)

  const existingInCart = cartItems.find(
    i => i.productId === product.id && i.variantId === selectedVariant?.id
  )

  const currentQtyInCart = existingInCart?.quantity || 0
  const availableStock = selectedVariant?.stock || 0
  const isOutOfStock = availableStock <= 0
  const isMaxInCart = selectedVariant ? currentQtyInCart >= availableStock : false
  const isDisabled = !selectedVariant || isOutOfStock || isMaxInCart || isAdding

  const handleAddToCart = () => {
    if (!selectedVariant) return

    setIsAdding(true)

    // Simulate a small delay for better UX
    setTimeout(() => {
      // Fire Meta Pixel event
      const finalPrice = priceOverride ?? Number(selectedVariant.price || product.salePrice || product.basePrice)
      fbAddToCart({
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: finalPrice * quantity,
        currency: typeof window !== 'undefined' && window.location.hostname.includes('co.uk') ? 'GBP' : 'PKR',
        quantity: quantity,
      })

      // Fire Google Analytics add_to_cart event
      sendGAEvent('event', 'add_to_cart', {
        currency: typeof window !== 'undefined' && window.location.hostname.includes('co.uk') ? 'GBP' : 'PKR',
        value: finalPrice * quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: finalPrice,
            quantity: quantity,
          }
        ]
      })

      dispatch(
        addItem({
          productId: product.id,
          variantId: selectedVariant.id,
          name: product.name,
          price: finalPrice,
          validatedPrice: priceOverride, // Store the validated price if available
          quantity: quantity,
          stock: availableStock,
          imageUrl: product.images[0]?.url || '',
          variantTitle: selectedVariant.title,
        })
      )
      dispatch(openCart())
      setIsAdding(false)
    }, 500)
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      variant="outline"
      className={cn(
        'w-full h-auto py-5 text-[12px] uppercase tracking-[0.3em] font-bold transition-all duration-700 border-2 rounded-full',
        !isDisabled && 'border-primary text-primary bg-transparent hover:bg-primary hover:text-white shadow-none active:scale-[0.99] ring-offset-2 hover:ring-2 hover:ring-primary',
        isDisabled && 'opacity-50 cursor-not-allowed border-border text-text-secondary',
        className
      )}
    >
      <ShoppingBag className="mr-2 h-4 w-4" />
      {isAdding ? (
        'Adding...'
      ) : isOutOfStock ? (
        'Out of Stock'
      ) : isMaxInCart ? (
        'Max Quantity in Cart'
      ) : !selectedVariant ? (
        'Select Size & Color'
      ) : (
        'Add to Cart'
      )}
    </Button>
  )
}
