import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface CompareProduct {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  imageUrl: string
  category: string
  sku: string
  description?: string
  avgRating?: number | null
  reviewCount?: number
  variantOptions?: any
}

interface CompareState {
  items: CompareProduct[]
}

const initialState: CompareState = {
  items: [],
}

const compareSlice = createSlice({
  name: 'compare',
  initialState,
  reducers: {
    addToCompare(state, action: PayloadAction<CompareProduct>) {
      // Limit to 3 items
      if (state.items.length >= 3) {
        return
      }
      // Avoid duplicates
      const exists = state.items.find((item) => item.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
    removeFromCompare(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    clearCompare(state) {
      state.items = []
    },
  },
})

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions
export default compareSlice.reducer
