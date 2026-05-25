import { logger } from '@/lib/utils/logger'

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        logger.error('Service worker registration failed:', error)
      })
    })
  }
}
