// Single source of truth for auth-related constants.
// Change here — changes everywhere. Never hardcode these strings elsewhere.

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const

export const ADMIN_PATH = '/d8f2a1/admin'
export const ADMIN_PREFIX = '/d8f2a1'
