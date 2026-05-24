import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'

const settingsSchema = z.object({
  announcementText: z.string().optional(),
  showAnnouncement: z.boolean().optional(),
  announcementBars: z.array(z.object({
    id: z.string(),
    text: z.string(),
    target: z.enum(['pakistan', 'uk', 'both']),
    isActive: z.boolean()
  })).optional(),
  footerLogo: z.string().optional().nullable(),
  footerTitle: z.string().optional(),
  footerDescription: z.string().optional(),
  footerLinks: z.any().optional(),
  socialLinks: z.any().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  whatsappNumber: z.string().optional(),
  showPaymentMethods: z.boolean().optional(),
  paymentMethods: z.array(z.string()).optional()
})

export async function GET(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const url = new URL(req.url)
    const country = url.searchParams.get('country')?.toLowerCase() || 'pk'

    let settings = await db.siteSettings.findUnique({
      where: { id: country }
    })

    if (!settings) {
      const globalSettings = await db.siteSettings.findUnique({
        where: { id: 'global' }
      })

      settings = await db.siteSettings.create({
        data: {
          id: country,
          announcementText: globalSettings?.announcementText || "Free delivery on orders over PKR 3,000 | New arrivals every Friday",
          showAnnouncement: globalSettings?.showAnnouncement !== undefined ? globalSettings.showAnnouncement : true,
          announcementBars: globalSettings?.announcementBars || [
            {
              id: 'default-legacy',
              text: 'Free delivery on orders over PKR 3,000 | New arrivals every Friday',
              target: 'both',
              isActive: true
            }
          ],
          footerLogo: globalSettings?.footerLogo || null,
          footerTitle: globalSettings?.footerTitle || "CALNZA",
          footerDescription: globalSettings?.footerDescription || "Redefining luxury fashion for the modern era. Curated with surgical precision and ethical craftsmanship in Pakistan.",
          footerLinks: globalSettings?.footerLinks || { about: [], categories: [], help: [] },
          socialLinks: globalSettings?.socialLinks || { instagram: "", facebook: "", whatsapp: "" },
          contactEmail: globalSettings?.contactEmail || "concierge@calnza.pk",
          contactPhone: globalSettings?.contactPhone || "",
          contactAddress: globalSettings?.contactAddress || "DHA Phase 6, Lahore, Pakistan",
          whatsappNumber: globalSettings?.whatsappNumber || "",
          showPaymentMethods: globalSettings?.showPaymentMethods !== undefined ? globalSettings.showPaymentMethods : true,
          paymentMethods: globalSettings?.paymentMethods || ["COD", "EASYPAISA", "VISA", "MASTERCARD"]
        }
      })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    logger.error('Failed to fetch admin settings', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const url = new URL(req.url)
    const country = url.searchParams.get('country')?.toLowerCase() || 'pk'

    const body = await req.json()
    const validated = settingsSchema.parse(body)

    const settings = await db.siteSettings.upsert({
      where: { id: country },
      update: validated,
      create: {
        id: country,
        ...validated
      }
    })

    logger.info('Site settings updated', { country, adminId: (authResponse as any).userId })

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    logger.error('Failed to update site settings', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
