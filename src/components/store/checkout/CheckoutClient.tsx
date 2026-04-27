'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { useRouter } from 'next/navigation'
import { clearCart } from '@/store/slices/cartSlice'
import { Check } from 'lucide-react'
import { CreateOrderInput } from '@/lib/validations/checkout'
import { AddressInput } from '@/lib/validations/address'

type CheckoutStep = 'address' | 'shipping' | 'payment' | 'confirm'

export function CheckoutClient() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items } = useAppSelector((state) => state.cart)
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
  const [isLoading, setIsLoading] = useState(false)

  // Form State matching CreateOrderInput
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [guestAddress, setGuestAddress] = useState<AddressInput>({
    label: 'Home', line1: '', line2: '', city: '', province: '', postalCode: '', isDefault: false
  })
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' })

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'free'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'COD' | 'BANK_TRANSFER'>('COD')

  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')

  useEffect(() => {
    setMounted(true)
    if (subtotal >= 3000) setShippingMethod('free')
  }, [subtotal])

  if (!mounted) return null
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-20">
        <h1 className="font-playfair text-3xl font-bold mb-4 text-[#000000]">Your cart is empty</h1>
        <button onClick={() => router.push('/products')} className="bg-[#000000] text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-[#262626] transition-colors">
          Continue Shopping
        </button>
      </div>
    )
  }

  const shippingCost = shippingMethod === 'express' ? 500 : (shippingMethod === 'standard' ? 200 : 0)
  const total = subtotal + shippingCost

  const handlePlaceOrder = async () => {
    setIsLoading(true)
    try {
      const orderPayload: CreateOrderInput = {
        addressId: isAuthenticated && selectedAddressId ? selectedAddressId : undefined,
        guestAddress: !isAuthenticated || !selectedAddressId ? guestAddress : undefined,
        guestName: !isAuthenticated ? guestInfo.name : undefined,
        guestEmail: !isAuthenticated ? guestInfo.email : undefined,
        guestPhone: !isAuthenticated ? guestInfo.phone : undefined,
        shippingMethod,
        paymentMethod,
        isGift,
        giftMessage: isGift ? giftMessage : undefined,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity
        }))
      }

      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')

      dispatch(clearCart())
      router.push(`/account/orders/${data.data.orderId}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const steps = ['address', 'shipping', 'payment', 'confirm'] as const
  const stepIndex = steps.indexOf(currentStep)

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-12">

      {/* Left Column - Forms */}
      <div className="flex-1">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4">
          {['Address', 'Shipping', 'Payment', 'Confirm'].map((label, idx) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${idx <= stepIndex ? 'bg-[#E8D5B0] text-black' : 'bg-neutral-200 text-neutral-500'}`}>
                {idx < stepIndex ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`ml-2 text-xs uppercase tracking-widest font-bold ${idx <= stepIndex ? 'text-black' : 'text-neutral-400'}`}>
                {label}
              </span>
              {idx < 3 && <div className={`w-8 h-px mx-3 ${idx < stepIndex ? 'bg-[#E8D5B0]' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white p-8 border border-[#E5E5E5] shadow-sm min-h-[400px]">
           <h2 className="font-playfair text-2xl font-bold capitalize mb-6">{currentStep}</h2>

           {currentStep === "address" && (
             <div className="space-y-6">
               {!isAuthenticated && (
                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Full Name</label>
                     <input type="text" value={guestInfo.name} onChange={e => setGuestInfo({...guestInfo, name: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                     <input type="email" value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Phone</label>
                     <input type="tel" value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none" />
                   </div>
                 </div>
               )}

               {isAuthenticated && (
                 <p className="text-sm text-neutral-500 mb-4">Please enter your shipping address below.</p>
               )}

               <div className="space-y-4">
                 <input type="text" placeholder="Address Line 1" value={guestAddress.line1} onChange={e => setGuestAddress({...guestAddress, line1: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none" />
                 <input type="text" placeholder="Address Line 2 (Optional)" value={guestAddress.line2 || ""} onChange={e => setGuestAddress({...guestAddress, line2: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none" />
                 
                 <div className="grid grid-cols-2 gap-4">
                   <select value={guestAddress.city} onChange={e => setGuestAddress({...guestAddress, city: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none bg-white">
                     <option value="">Select City</option>
                     {["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta", "Faisalabad", "Multan", "Sialkot"].map(c => (
                       <option key={c} value={c}>{c}</option>
                     ))}
                   </select>
                   <select value={guestAddress.province} onChange={e => setGuestAddress({...guestAddress, province: e.target.value})} className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none bg-white">
                     <option value="">Select Province</option>
                     {["Sindh", "Punjab", "KPK", "Balochistan", "Islamabad Capital Territory"].map(p => (
                       <option key={p} value={p}>{p}</option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>
           )}

           {currentStep === "shipping" && (
             <div className="space-y-4">
               <div 
                 onClick={() => subtotal < 3000 ? setShippingMethod("standard") : null}
                 className={`border p-4 cursor-pointer flex justify-between items-center transition-colors ${shippingMethod === "standard" ? "border-black bg-neutral-50" : "border-[#E5E5E5] hover:border-black/30"} ${subtotal >= 3000 ? "opacity-50 cursor-not-allowed" : ""}`}
               >
                 <div>
                   <h4 className="font-bold text-sm">Standard Delivery</h4>
                   <p className="text-xs text-neutral-500 mt-1">3-5 Business Days</p>
                 </div>
                 <span className="font-bold text-sm">PKR 200</span>
               </div>

               <div 
                 onClick={() => setShippingMethod("express")}
                 className={`border p-4 cursor-pointer flex justify-between items-center transition-colors ${shippingMethod === "express" ? "border-black bg-neutral-50" : "border-[#E5E5E5] hover:border-black/30"}`}
               >
                 <div>
                   <h4 className="font-bold text-sm">Express Delivery</h4>
                   <p className="text-xs text-neutral-500 mt-1">1-2 Business Days</p>
                 </div>
                 <span className="font-bold text-sm">PKR 500</span>
               </div>

               {subtotal >= 3000 && (
                 <div 
                   onClick={() => setShippingMethod("free")}
                   className={`border p-4 cursor-pointer flex justify-between items-center transition-colors ${shippingMethod === "free" ? "border-black bg-neutral-50" : "border-[#E5E5E5] hover:border-black/30"}`}
                 >
                   <div>
                     <h4 className="font-bold text-sm">Free Shipping</h4>
                     <p className="text-xs text-neutral-500 mt-1">Eligible for orders over PKR 3,000</p>
                   </div>
                   <span className="font-bold text-sm uppercase text-[#10B981]">Free</span>
                 </div>
               )}
             </div>
           )}

           {currentStep === "payment" && (
             <div className="space-y-6">
               <div className="space-y-3">
                 {["COD", "JAZZCASH", "EASYPAISA", "BANK_TRANSFER", "CARD"].map((method) => (
                   <div 
                     key={method}
                     onClick={() => setPaymentMethod(method as any)}
                     className={`border p-4 cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === method ? "border-black bg-neutral-50" : "border-[#E5E5E5] hover:border-black/30"}`}
                   >
                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === method ? "border-black" : "border-neutral-300"}`}>
                       {paymentMethod === method && <div className="w-2 h-2 bg-black rounded-full" />}
                     </div>
                     <span className="font-bold text-sm">
                       {method === "COD" ? "Cash on Delivery" : 
                        method === "BANK_TRANSFER" ? "Bank Transfer" : 
                        method === "CARD" ? "Credit / Debit Card" : 
                        method}
                     </span>
                   </div>
                 ))}
               </div>

               <div className="border-t border-[#E5E5E5] pt-6 mt-6">
                 <label className="flex items-center gap-2 cursor-pointer mb-4">
                   <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="accent-black w-4 h-4" />
                   <span className="text-sm font-bold">This order is a gift</span>
                 </label>
                 
                 {isGift && (
                   <textarea 
                     placeholder="Enter a gift message (optional)..."
                     value={giftMessage}
                     onChange={(e) => setGiftMessage(e.target.value)}
                     className="w-full border border-[#E5E5E5] p-3 text-sm focus:border-black outline-none resize-none h-24"
                   />
                 )}
               </div>
             </div>
           )}

           {currentStep === "confirm" && (
             <div className="text-center py-10">
               <div className="w-16 h-16 bg-[#E8D5B0]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Check className="w-8 h-8 text-[#E8D5B0]" />
               </div>
               <h3 className="font-playfair text-2xl font-bold mb-2">Ready to Place Order?</h3>
               <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                 Please review your order summary on the right. By placing this order, you agree to our Terms & Conditions.
               </p>
             </div>
           )}

           {/* Navigation Buttons */}
           <div className="mt-10 flex justify-between border-t border-[#E5E5E5] pt-6">
             {stepIndex > 0 ? (
               <button onClick={() => setCurrentStep(steps[stepIndex - 1])} className="text-xs uppercase tracking-widest font-bold text-neutral-500 hover:text-black transition-colors">
                 Back
               </button>
             ) : <div />}

             {stepIndex < 3 ? (
               <button onClick={() => setCurrentStep(steps[stepIndex + 1])} className="bg-black text-white px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#262626] transition-colors">
                 Continue to {steps[stepIndex + 1]}
               </button>
             ) : (
               <button onClick={handlePlaceOrder} disabled={isLoading} className="bg-[#E8D5B0] text-black px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-[#d6c19a] transition-colors disabled:opacity-50">
                 {isLoading ? 'Processing...' : 'Place Order'}
               </button>
             )}
           </div>
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:w-[400px]">
        <div className="bg-white p-6 border border-[#E5E5E5] sticky top-8">
          <h3 className="font-playfair text-xl font-bold mb-6">Order Summary</h3>

          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                <div className="w-16 h-20 bg-neutral-100 relative shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-neutral-500 text-xs mt-1">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-sm">PKR {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-sm border-t border-[#E5E5E5] pt-6">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `PKR ${shippingCost.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-4 border-t border-[#E5E5E5] pt-4">
              <span>Total</span>
              <span>PKR {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}