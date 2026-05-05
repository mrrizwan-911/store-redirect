import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  stock: number
  imageUrl: string
  variantTitle?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  appliedCoupon: {
    code: string
    discountPct: number | null
    discountFlat: number | null
    discountAmount: number
  } | null
}

const initialState: CartState = { items: [], isOpen: false, appliedCoupon: null }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find(
        i => i.productId === action.payload.productId &&
             i.variantId === action.payload.variantId
      )
      if (existing) {
        const newQty = existing.quantity + action.payload.quantity
        existing.quantity = Math.min(newQty, action.payload.stock)
        existing.stock = action.payload.stock // Update stock in case it changed
      } else {
        state.items.push(action.payload)
      }
      // Reset coupon if items change as subtotal might now be below minOrderValue
      // In a real-world scenario, we'd re-validate, but for now we clear for safety
      state.appliedCoupon = null
    },
    removeItem(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
      state.items = state.items.filter(
        i => !(i.productId === action.payload.productId &&
               i.variantId === action.payload.variantId)
      )
      state.appliedCoupon = null
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>
    ) {
      const item = state.items.find(
        i => i.productId === action.payload.productId &&
             i.variantId === action.payload.variantId
      )
      if (item) {
        item.quantity = Math.min(action.payload.quantity, item.stock)
      }
      state.appliedCoupon = null
    },
    setAppliedCoupon(state, action: PayloadAction<CartState['appliedCoupon']>) {
      state.appliedCoupon = action.payload
    },
    clearAppliedCoupon(state) {
      state.appliedCoupon = null
    },
    clearCart(state) {
      state.items = []
      state.appliedCoupon = null
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen
    },
    openCart(state) {
      state.isOpen = true
    },
    closeCart(state) {
      state.isOpen = false
    },
  },
})

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart, setAppliedCoupon, clearAppliedCoupon } =
  cartSlice.actions
export default cartSlice.reducer
