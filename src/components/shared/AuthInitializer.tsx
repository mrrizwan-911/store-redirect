'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser, setToken, logout } from '@/store/slices/authSlice'

export function AuthInitializer() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, accessToken } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // If we have no accessToken but think we are authenticated (e.g. after page reload),
    // try to restore the session using the refresh token cookie.
    if (!accessToken && isAuthenticated) {
      const initAuth = async () => {
        try {
          const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST' })
          const refreshResult = await refreshResponse.json()

          if (refreshResult.success && refreshResult.data?.access_token) {
            dispatch(setToken(refreshResult.data.access_token))

            const profileResponse = await fetch('/api/account/profile')
            const profileResult = await profileResponse.json()

            if (profileResult.success && profileResult.data) {
              dispatch(setUser(profileResult.data))
            }
          } else if (refreshResponse.status === 401) {
            // Only logout if the server explicitly says the session is invalid
            dispatch(logout())
          }
        } catch (error) {
          // On network error or other issues, we don't logout to avoid
          // kicking the user out prematurely.
        }
      }

      initAuth()
    }
  }, [isAuthenticated, user, accessToken, dispatch])

  return null
}
