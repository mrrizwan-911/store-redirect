'use client'

import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { registerServiceWorker } from '@/lib/utils/registerSW'

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}

