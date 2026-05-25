'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { closeCart, updateQuantity, removeItem } from '@/store/slices/cartSlice'
import { addItem as addToWishlist } from '@/store/slices/wishlistSlice'
import { currencySymbol, formatPrice } from '@/lib/utils/currency'
import { X, Minus, Plus, Trash2, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function CartDrawer() {
  const dispatch = useAppDispatch()
  const { items, isOpen, serverSubtotal } = useAppSelector((state) => state.cart)

  // Debounced quantity update wrapper
  const handleQuantityChange = (productId: string, variantId: string | undefined, currentQty: number, change: number) => {
    const newQty = currentQty + change
    if (newQty < 1) return
    dispatch(updateQuantity({ productId, variantId, quantity: newQty }))
    // Note: Debounced API call for logged-in users would go here
  }

  const handleRemove = (productId: string, variantId?: string) => {
    dispatch(removeItem({ productId, variantId }))
  }

  const handleMoveToWishlist = (item: { productId: string; variantId?: string; variantTitle?: string }) => {
    dispatch(addToWishlist({ productId: item.productId, variantId: item.variantId, variantTitle: item.variantTitle }))
    dispatch(removeItem({ productId: item.productId, variantId: item.variantId }))
  }

  const subtotal = serverSubtotal ?? items.reduce((sum, item) => sum + (item.validatedPrice ?? item.price) * item.quantity, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/35 transition-opacity" 
        onClick={() => dispatch(closeCart())}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white border-l border-[#E5E5E5] flex flex-col h-full animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5]">
          <h3 className="font-serif text-base tracking-[0.12em] font-bold uppercase">
            Cart <span className="text-neutral-400 font-sans font-bold tracking-[0.2em] text-[10px]">({items.length})</span>
          </h3>
          <button 
            onClick={() => dispatch(closeCart())}
            className="text-neutral-500 hover:text-black transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <p className="text-neutral-500 text-sm">Your cart is empty.</p>
              <button
                onClick={() => dispatch(closeCart())}
                className="h-10 px-6 border border-black text-black hover:bg-[#FAFAFA] transition-colors uppercase text-[10px] font-bold tracking-[0.22em] rounded-[var(--radius)]"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'base'}`}>
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-20 bg-[#FAFAFA] border border-[#E5E5E5] shrink-0 rounded-[var(--radius)] overflow-hidden relative">
                    <Image 
                      src={item.imageUrl || '/placeholder.png'} 
                      alt={item.name} 
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif text-sm leading-tight font-bold pr-4">{item.name}</h4>
                      <button 
                        onClick={() => handleRemove(item.productId, item.variantId)}
                        className="text-neutral-400 hover:text-black transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.variantTitle ? (
                      <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                        Variant: {item.variantTitle}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2">
                      <p className="font-bold text-[12px] tracking-tight">{formatPrice(item.validatedPrice ?? item.price)}</p>
                      {item.validatedPrice && item.validatedPrice < item.price && (
                        <p className="text-[10px] text-neutral-400 line-through">{formatPrice(item.price)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleMoveToWishlist(item)}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-neutral-400 hover:text-black transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Save
                    </button>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#E5E5E5] w-24 h-8 rounded-[var(--radius)] overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity, -1)}
                          className="w-8 h-full flex justify-center items-center text-neutral-500 hover:text-black hover:bg-[#FAFAFA] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center font-bold text-[12px]">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.variantId, item.quantity, 1)}
                          className="w-8 h-full flex justify-center items-center text-neutral-500 hover:text-black hover:bg-[#FAFAFA] transition-colors disabled:opacity-30"
                          disabled={item.quantity >= item.stock}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="border-[#E5E5E5] mt-5" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E5E5] px-5 py-5 bg-[#FAFAFA]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-neutral-500 font-medium text-[11px] uppercase tracking-[0.22em]">Subtotal</span>
              <span className="font-serif text-lg font-bold tracking-tight">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[11px] text-neutral-500 mb-5">Shipping & taxes calculated at checkout.</p>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/cart"
                onClick={() => dispatch(closeCart())}
                className="w-full h-11 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 uppercase text-[10px] font-bold tracking-[0.22em] rounded-full flex items-center justify-center"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => dispatch(closeCart())}
                className="w-full h-11 border-2 border-black bg-transparent text-black hover:bg-black hover:text-white transition-all duration-500 uppercase text-[10px] font-bold tracking-[0.3em] rounded-full flex items-center justify-center shadow-none active:scale-[0.98]"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
