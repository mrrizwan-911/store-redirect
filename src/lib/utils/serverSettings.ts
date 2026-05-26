/**
 * Server-side helper to retrieve site settings for the current country.
 * Used in API routes & email templates — NOT safe to import in client components.
 */
import { db } from '@/lib/db/client'

let _cache: { data: any; expiresAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getServerSiteSettings(): Promise<any> {
  const now = Date.now()
  if (_cache && _cache.expiresAt > now) return _cache.data

  const country = (process.env.NEXT_PUBLIC_SITE_COUNTRY ?? 'pk').toLowerCase()

  let settings = null
  try {
    settings = await db.siteSettings.findUnique({ where: { id: country } })
    if (!settings) {
      settings = await db.siteSettings.findUnique({ where: { id: 'global' } })
    }
    if (!settings) {
      settings = await db.siteSettings.findFirst()
    }
  } catch (err) {
    console.warn('[getServerSiteSettings] DB unavailable:', err)
    return null
  }

  _cache = { data: settings, expiresAt: now + CACHE_TTL_MS }
  return settings
}

/** Returns a clean digits-only WhatsApp number for use in wa.me links */
export async function getServerWhatsappNumber(): Promise<string> {
  const settings = await getServerSiteSettings()
  const raw = settings?.whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  return raw.replace(/[^0-9]/g, '')
}
