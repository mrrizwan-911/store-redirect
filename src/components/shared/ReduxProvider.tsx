'use client'

import { useEffect, useState } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from '@/store'
import { registerServiceWorker } from '@/lib/utils/registerSW'
import { AuthInitializer } from './AuthInitializer'

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <Provider store={store}>
      <PersistGate loading={<div className="min-h-screen" />} persistor={persistor}>
        <AuthInitializer />
        {children}
      </PersistGate>
    </Provider>
  )
}

