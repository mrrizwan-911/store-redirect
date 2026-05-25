'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { useRouter } from 'next/navigation'
import { clearCart, setAppliedCoupon, clearAppliedCoupon } from '@/store/slices/cartSlice'
import { Check, Star, Package, MapPin, CreditCard, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { CreateOrderInput } from '@/lib/validations/checkout'
import { AddressInput } from '@/lib/validations/address'
import { SITE_COUNTRY, getEnabledPaymentMethods, formatPrice } from '@/lib/constants/site'
import { ShippingStep } from './ShippingStep'
import { PaymentStep } from './PaymentStep'
import { TurnstileWidget } from '@/components/ui/TurnstileWidget'

type CheckoutStep = 'address' | 'shipping' | 'payment' | 'confirm'

interface ShippingOptionData {
  id: string
  name: string
  description: string | null
  price: string | number
  estimatedDays: string | null
  freeShippingThreshold: string | number | null
}

export function CheckoutClient() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { items, appliedCoupon } = useAppSelector((state) => state.cart)
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
  const [isLoading, setIsLoading] = useState(false)
  const [showPromo, setShowPromo] = useState(!!appliedCoupon)
  const [promoCode, setPromoCode] = useState(appliedCoupon?.code || '')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [redeemPoints, setRedeemPoints] = useState(0)

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [guestAddress, setGuestAddress] = useState<AddressInput>({
    firstName: '', lastName: '', label: 'Home', line1: '', line2: '',
    city: '', province: '', postalCode: '', country: SITE_COUNTRY === 'PK' ? 'Pakistan' : SITE_COUNTRY === 'UK' ? 'United Kingdom' : 'Global',
    company: '', isDefault: false, email: '', phone: '',
  })
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' })

  // Shipping state (dynamic from DB)
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOptionData | null>(null)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>(
    getEnabledPaymentMethods()[0] || 'COD'
  )
  const [isGift, setIsGift] = useState(false)
  const [giftMessage, setGiftMessage] = useState('')

  // After order creation
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null)
  const [paymentDone, setPaymentDone] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null)

  // Turnstile security token
  const [turnstileToken, setTurnstileToken] = useState<string>('')

  const getActiveAddress = () => {
    if (isAuthenticated && !isAddingNewAddress && selectedAddressId) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId)
      if (addr) return addr
    }
    return guestAddress
  }

  const activeAddress = getActiveAddress()
  const contactName = isAuthenticated ? (user?.name || '') : guestInfo.name
  const contactEmail = isAuthenticated ? (user?.email || '') : guestInfo.email

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      fetch('/api/account/addresses')
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setSavedAddresses(d.data)
            const def = d.data.find((a: any) => a.isDefault)
            if (def) setSelectedAddressId(def.id)
            else if (d.data.length > 0) setSelectedAddressId(d.data[0].id)
            else setIsAddingNewAddress(true)
          }
        })
        .catch(() => setIsAddingNewAddress(true))

      fetch('/api/account/loyalty')
        .then(r => r.json())
        .then(d => { if (d.success) setLoyaltyPoints(d.data.points) })
        .catch(() => {})
    } else {
      setIsAddingNewAddress(true)
    }
  }, [isAuthenticated])

  if (!mounted) return null
  if (items.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 text-center py-20">
        <h1 className="font-playfair text-3xl font-bold mb-4">Your cart is empty</h1>
        <button
          onClick={() => router.push('/products')}
          className="bg-black text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-neutral-800 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    )
  }

  const shippingCost = selectedShippingOption
    ? (selectedShippingOption.freeShippingThreshold !== null &&
       subtotal >= Number(selectedShippingOption.freeShippingThreshold)
       ? 0
       : Number(selectedShippingOption.price))
    : 0

  const couponDiscount = appliedCoupon?.discountAmount || 0
  const total = Math.max(0, subtotal + shippingCost - couponDiscount - redeemPoints)
  const pointsToEarn = Math.floor(subtotal / 100)

  const handleApplyCoupon = async () => {
    if (!promoCode) return
    setCouponError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderValue: subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setCouponError(data.error || 'Invalid coupon')
        dispatch(clearAppliedCoupon())
        return
      }
      dispatch(setAppliedCoupon(data.data))
      toast.success('Coupon applied!')
    } catch {
      setCouponError('Failed to validate coupon')
    }
  }

  /**
   * Step: Address → Shipping
   * Create the order and move to shipping step.
   * Order is created PENDING here — payment happens on the payment step.
   */
  const handleContinueToShipping = () => {
    // Basic validation
    const addr = getActiveAddress()
    if (!addr.line1 || !addr.city) {
      toast.error('Please fill in your shipping address')
      return
    }
    if (!isAuthenticated && !guestInfo.email) {
      toast.error('Please enter your email address')
      return
    }
    setCurrentStep('shipping')
  }

  /**
   * Step: Shipping → Payment
   * Create the order at this point (PENDING), then go to payment step.
   */
  const handleContinueToPayment = async () => {
    if (!selectedShippingOption) {
      toast.error('Please select a shipping method')
      return
    }

    if (!turnstileToken) {
      toast.error('Security verification pending. Please wait.')
      return
    }

    const itemsExceedingStock = items.filter(item => item.quantity > item.stock)
    if (itemsExceedingStock.length > 0) {
      toast.error(`Items exceed stock: ${itemsExceedingStock.map(i => i.name).join(', ')}`)
      return
    }

    setIsLoading(true)
    try {
      const addr = getActiveAddress()
      const orderPayload: CreateOrderInput = {
        addressId: (isAuthenticated && !isAddingNewAddress && selectedAddressId) ? selectedAddressId : undefined,
        guestAddress: (!isAuthenticated || isAddingNewAddress) ? {
          ...guestAddress,
          email: isAuthenticated ? (user?.email || undefined) : (guestInfo.email || undefined),
          phone: guestAddress.phone || guestInfo.phone || '',
        } : undefined,
        guestName: !isAuthenticated ? guestInfo.name : undefined,
        guestEmail: !isAuthenticated ? guestInfo.email : undefined,
        guestPhone: !isAuthenticated ? guestInfo.phone : undefined,
        shippingOptionId: selectedShippingOption.id,
        country: SITE_COUNTRY,
        paymentMethod: paymentMethod as any,
        couponCode: appliedCoupon?.code,
        loyaltyPoints: redeemPoints > 0 ? redeemPoints : undefined,
        isGift,
        giftMessage: isGift ? giftMessage : undefined,
        turnstileToken,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        })),
      }

      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create order')

      setCreatedOrderId(data.data.orderId)
      setConfirmedOrder(data.data)

      // If COD, order is already ready — skip to confirm
      if (paymentMethod === 'COD') {
        dispatch(clearCart())
        setPaymentDone(true)
        setCurrentStep('confirm')
      } else {
        setCurrentStep('payment')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Called by Stripe or EasyPaisa component when payment succeeds.
   * Then we update the order (for Stripe: pass intentId) and go to confirm.
   */
  const handlePaymentComplete = async (data?: { stripePaymentIntentId?: string }) => {
    if (data?.stripePaymentIntentId) {
      setStripePaymentIntentId(data.stripePaymentIntentId)

      // Update order with Stripe payment intent ID to mark it CONFIRMED
      if (createdOrderId) {
        try {
          // Re-call create-order is wrong — instead update payment record
          await fetch('/api/payments/stripe/confirm-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: createdOrderId,
              stripePaymentIntentId: data.stripePaymentIntentId,
            }),
          })
        } catch {
          // Webhook will catch it anyway, proceed to confirm
        }
      }
    }

    dispatch(clearCart())
    setPaymentDone(true)
    setCurrentStep('confirm')
  }

  const steps = ['address', 'shipping', 'payment', 'confirm'] as const
  const stepIndex = steps.indexOf(currentStep)

  const handleNext = () => {
    if (currentStep === 'address') handleContinueToShipping()
    else if (currentStep === 'shipping') handleContinueToPayment()
    // Payment step handled by payment components directly
  }

  const getAddressLine = () => {
    const addr = getActiveAddress()
    return `${addr.line1}${addr.city ? `, ${addr.city}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* ── Left Column: Forms ─────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          {/* Step Indicator */}
          <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2">
            {(['Address', 'Shipping', 'Payment', 'Confirm'] as const).map((label, idx) => (
              <div key={label} className="flex items-center shrink-0">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-bold
                  ${idx <= stepIndex ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                  {idx < stepIndex ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : idx + 1}
                </div>
                <span className={`ml-1 sm:ml-2 text-[9px] sm:text-xs uppercase tracking-widest font-bold hidden xs:block
                  ${idx <= stepIndex ? 'text-black' : 'text-neutral-400'}`}>
                  {label}
                </span>
                {idx < 3 && (
                  <div className={`w-4 sm:w-8 h-px mx-1 sm:mx-3 shrink-0
                    ${idx < stepIndex ? 'bg-black' : 'bg-neutral-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white p-4 sm:p-8 border border-neutral-200 rounded-[var(--radius)] shadow-sm min-h-[400px]">
            <h2 className="font-playfair text-xl sm:text-2xl font-bold capitalize mb-6">
              {currentStep}
            </h2>

            {/* ── ADDRESS STEP ──────────────────────────────────────────── */}
            {currentStep === 'address' && (
              <div className="space-y-8">
                {!isAuthenticated && (
                  <div>
                    <h3 className="text-base font-playfair font-bold mb-4">Contact</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Full Name</label>
                        <input type="text" value={guestInfo.name} onChange={e => setGuestInfo({...guestInfo, name: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Email</label>
                        <input type="email" value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Phone</label>
                        <input type="tel" value={guestInfo.phone} onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {isAuthenticated && savedAddresses.length > 0 && !isAddingNewAddress ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-playfair font-bold">Select Shipping Address</h3>
                      <button onClick={() => setIsAddingNewAddress(true)}
                        className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-black underline">
                        Add New
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map(addr => (
                        <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 border-2 rounded-[var(--radius)] cursor-pointer transition-all
                            ${selectedAddressId === addr.id ? 'border-black bg-neutral-50' : 'border-neutral-100 hover:border-neutral-300'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] uppercase tracking-widest font-black">{addr.label}</p>
                            {selectedAddressId === addr.id && <Check className="w-4 h-4 shrink-0" />}
                          </div>
                          <p className="text-sm font-bold">{addr.firstName} {addr.lastName}</p>
                          <p className="text-xs text-neutral-600 truncate">{addr.line1}, {addr.city}</p>
                          <p className="text-[10px] text-neutral-400 mt-1">{addr.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-playfair font-bold">Shipping Address</h3>
                      {isAuthenticated && savedAddresses.length > 0 && (
                        <button onClick={() => setIsAddingNewAddress(false)}
                          className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-black underline">
                          Use Saved
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">First Name</label>
                          <input type="text" value={guestAddress.firstName}
                            onChange={e => setGuestAddress({...guestAddress, firstName: e.target.value})}
                            className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Last Name</label>
                          <input type="text" value={guestAddress.lastName}
                            onChange={e => setGuestAddress({...guestAddress, lastName: e.target.value})}
                            className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Address Label (e.g. Home, Office)</label>
                        <input type="text" value={guestAddress.label}
                          onChange={e => setGuestAddress({...guestAddress, label: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Address</label>
                        <input type="text" value={guestAddress.line1}
                          onChange={e => setGuestAddress({...guestAddress, line1: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Apartment / Suite (Optional)</label>
                        <input type="text" value={guestAddress.line2 || ''}
                          onChange={e => setGuestAddress({...guestAddress, line2: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">City</label>
                          <input type="text" value={guestAddress.city}
                            onChange={e => setGuestAddress({...guestAddress, city: e.target.value})}
                            className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Province / State</label>
                          <input type="text" value={guestAddress.province}
                            onChange={e => setGuestAddress({...guestAddress, province: e.target.value})}
                            className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Postal Code</label>
                          <input type="text" value={guestAddress.postalCode}
                            onChange={e => setGuestAddress({...guestAddress, postalCode: e.target.value})}
                            className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Phone</label>
                          <input type="tel" value={guestAddress.phone}
                            onChange={e => setGuestAddress({...guestAddress, phone: e.target.value})}
                            className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-1">Country</label>
                        <select value={guestAddress.country}
                          onChange={e => setGuestAddress({...guestAddress, country: e.target.value})}
                          className="w-full border border-neutral-200 rounded-[var(--radius)] px-4 py-3 text-sm focus:border-black outline-none bg-white">
                          {SITE_COUNTRY === 'PK' && <option value="Pakistan">Pakistan</option>}
                          {SITE_COUNTRY === 'UK' && <option value="United Kingdom">United Kingdom</option>}
                          {SITE_COUNTRY === 'GLOBAL' && (
                            <>
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                              <option value="Germany">Germany</option>
                              <option value="France">France</option>
                              <option value="Other">Other</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SHIPPING STEP ─────────────────────────────────────────── */}
            {currentStep === 'shipping' && (
              <ShippingStep
                subtotal={subtotal}
                selectedOptionId={selectedShippingOption?.id || ''}
                onSelect={setSelectedShippingOption}
                contactName={contactName}
                contactEmail={contactEmail}
                addressLine={getAddressLine()}
                onChangeAddress={() => setCurrentStep('address')}
              />
            )}

            {/* ── PAYMENT STEP ──────────────────────────────────────────── */}
            {currentStep === 'payment' && createdOrderId && (
              <PaymentStep
                orderId={createdOrderId}
                total={total}
                currency={SITE_COUNTRY === 'UK' ? 'GBP' : SITE_COUNTRY === 'GLOBAL' ? 'USD' : 'PKR'}
                contactName={contactName}
                contactEmail={contactEmail}
                addressLine={getAddressLine()}
                isGift={isGift}
                giftMessage={giftMessage}
                selectedMethod={paymentMethod}
                onSelectMethod={setPaymentMethod}
                onSetGift={setIsGift}
                onSetGiftMessage={setGiftMessage}
                onChangeAddress={() => setCurrentStep('address')}
                onPaymentComplete={handlePaymentComplete}
              />
            )}

            {/* ── CONFIRM STEP ──────────────────────────────────────────── */}
            {currentStep === 'confirm' && confirmedOrder && (
              <div className="space-y-6">
                {/* Success header */}
                <div className="text-center py-6 border-b border-neutral-100">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="font-playfair text-xl sm:text-2xl font-bold mb-1 text-black">
                    Order Confirmed!
                  </h3>
                  <p className="text-sm text-neutral-500">Order #{confirmedOrder.orderNumber}</p>
                  {paymentMethod === 'COD' && (
                    <p className="text-xs text-neutral-400 mt-2">Pay cash when your order arrives.</p>
                  )}
                </div>

                {/* Order items */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-neutral-400" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Items Ordered</p>
                  </div>
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {items.map(item => (
                      <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                        <div className="w-12 h-16 bg-neutral-100 rounded-[var(--radius)] overflow-hidden shrink-0">
                          <img src={item.imageUrl || '/placeholder.png'} alt={item.name} className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate">{item.name}</p>
                          <p className="text-neutral-500 text-[10px] mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-xs shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping + Payment summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-neutral-100 rounded-[var(--radius)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-3.5 h-3.5 text-neutral-400" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Shipping</p>
                    </div>
                    <p className="text-sm font-bold text-black">{selectedShippingOption?.name}</p>
                    {selectedShippingOption?.estimatedDays && (
                      <p className="text-xs text-neutral-500">{selectedShippingOption.estimatedDays}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">
                      {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                    </p>
                  </div>

                  <div className="border border-neutral-100 rounded-[var(--radius)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Payment</p>
                    </div>
                    <p className="text-sm font-bold text-black">
                      {paymentMethod === 'COD' ? 'Cash on Delivery'
                        : paymentMethod === 'CARD' ? 'Credit / Debit Card'
                        : paymentMethod === 'EASYPAISA' ? 'EasyPaisa'
                        : paymentMethod}
                    </p>
                    <p className={`text-xs mt-1 font-bold ${paymentDone || paymentMethod === 'COD' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {paymentMethod === 'COD' ? 'Pay on delivery'
                        : paymentDone ? '✓ Paid'
                        : 'Pending'}
                    </p>
                  </div>
                </div>

                {/* Ship to */}
                <div className="border border-neutral-100 rounded-[var(--radius)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Deliver to</p>
                  </div>
                  <p className="text-sm text-black">{getAddressLine()}</p>
                </div>

                {/* View order button */}
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push(`/account/orders/${confirmedOrder.orderId}`)
                    } else {
                      router.push(`/order-confirmation/${confirmedOrder.orderId}`)
                    }
                  }}
                  className="w-full bg-black text-white rounded-full h-12 text-[11px] uppercase tracking-[0.2em] font-bold
                    hover:bg-neutral-800 transition-colors"
                >
                  View My Order
                </button>
              </div>
            )}

            {/* ── Navigation Buttons ──────────────────────────────────────── */}
            {currentStep !== 'confirm' && currentStep !== 'payment' && (
              <div className="mt-8 space-y-3 border-t border-neutral-200 pt-6">
                <TurnstileWidget 
                  onSuccess={setTurnstileToken} 
                  appearance="interaction-only"
                />
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="w-full border-2 border-black text-black bg-transparent rounded-full h-12 sm:h-14 text-[11px] uppercase tracking-[0.3em] font-bold
                    hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : currentStep === 'address' ? 'Continue to Shipping' : 'Continue to Payment'}
                </button>
                {stepIndex > 0 && (
                  <button
                    onClick={() => setCurrentStep(steps[stepIndex - 1])}
                    className="text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-black transition-colors text-center w-full"
                  >
                    Back
                  </button>
                )}
              </div>
            )}

            {/* Back button for payment step */}
            {currentStep === 'payment' && (
              <div className="mt-6 border-t border-neutral-200 pt-4">
                <button
                  onClick={() => setCurrentStep('shipping')}
                  className="text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-black transition-colors text-center w-full"
                >
                  ← Back to Shipping
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Order Summary ─────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-[var(--radius)] p-4 sm:p-6 space-y-5">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-black">Order Summary</h3>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                    <div className="w-14 h-18 bg-neutral-100 relative shrink-0 rounded-[var(--radius)] overflow-hidden">
                      <img src={item.imageUrl || '/placeholder.png'} alt={item.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="font-bold truncate">{item.name}</p>
                      <p className="text-neutral-500 text-xs mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="border-t border-neutral-200 pt-4">
                {showPromo ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        className="flex-1 border border-neutral-200 rounded-[var(--radius)] px-3 py-2 text-sm outline-none focus:border-black min-w-0"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-black text-white px-4 py-2 rounded-[var(--radius)] text-xs font-bold hover:bg-neutral-800 shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-xs text-emerald-600">
                        Coupon <strong>{appliedCoupon.code}</strong> applied!{' '}
                        <button onClick={() => { dispatch(clearAppliedCoupon()); setPromoCode('') }} className="underline">Remove</button>
                      </p>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setShowPromo(true)} className="text-sm text-neutral-500 hover:text-black underline">
                    Add promo code
                  </button>
                )}
              </div>

              {/* Loyalty points */}
              {isAuthenticated && loyaltyPoints >= 100 && (
                <div className="border-t border-neutral-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-black">Loyalty Points</h4>
                    <span className="text-[10px] text-neutral-500">{loyaltyPoints} available</span>
                  </div>
                  <select
                    value={redeemPoints}
                    onChange={e => setRedeemPoints(Number(e.target.value))}
                    className="w-full border border-neutral-200 rounded-[var(--radius)] px-3 py-2 text-xs outline-none focus:border-black bg-white"
                  >
                    <option value={0}>Don't use points</option>
                    {Array.from({
                      length: Math.min(
                        Math.floor(loyaltyPoints / 100),
                        20,
                        Math.floor((subtotal + shippingCost) / 100)
                      )
                    }, (_, i) => (i + 1) * 100).map(val => (
                      <option key={val} value={val}>Use {val} pts ({formatPrice(val)} off)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>
                    {selectedShippingOption
                      ? shippingCost === 0 ? 'Free' : formatPrice(shippingCost)
                      : '—'}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {redeemPoints > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Loyalty Discount</span>
                    <span>- {formatPrice(redeemPoints)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-neutral-200 pt-3 mt-3">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {pointsToEarn > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-[var(--radius)] p-3 flex items-center gap-3">
                  <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center shrink-0">
                    <Star size={12} className="fill-current" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-neutral-600">
                    Earn <span className="text-black">{pointsToEarn} loyalty points</span> on this order
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
