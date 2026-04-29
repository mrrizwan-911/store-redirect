'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser } from '@/store/slices/authSlice'

export function AuthInitializer() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // If not authenticated in Redux, try to fetch profile from session cookies
    if (!isAuthenticated || !user) {
      const initAuth = async () => {
        try {
          const response = await fetch('/api/account/profile')
          const result = await response.json()

          if (result.success && result.data) {
            dispatch(setUser(result.data))
          }
        } catch (error) {
          // Silent fail - user just isn't logged in or session expired
        }
      }

      initAuth()
    }
  }, [isAuthenticated, user, dispatch])

  return null
}
