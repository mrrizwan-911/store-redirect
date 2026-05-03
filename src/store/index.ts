import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import createWebStorage from 'redux-persist/lib/storage/createWebStorage'
import cartReducer from './slices/cartSlice'
import authReducer from './slices/authSlice'
import wishlistReducer from './slices/wishlistSlice'
import compareReducer from './slices/compareSlice'

// Create a fallback storage for SSR
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null)
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value)
    },
    removeItem(_key: string) {
      return Promise.resolve()
    },
  }
}

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage()

const authPersistConfig = {
  key: 'auth',
  storage,
  blacklist: ['accessToken'],
}

const rootReducer = combineReducers({
  cart: cartReducer,
  auth: persistReducer(authPersistConfig, authReducer),
  wishlist: wishlistReducer,
  compare: compareReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['cart', 'compare', 'wishlist'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
