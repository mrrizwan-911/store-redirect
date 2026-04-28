import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

/**
 * Bank Transfer Details Route.
 * Returns the merchant's bank account details from environment variables.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const bankDetails = {
      bankName: process.env.BANK_NAME || 'Sample Bank Limited',
      accountName: process.env.BANK_ACCOUNT_NAME || 'Calnza Pvt Ltd',
      accountNumber: process.env.BANK_ACCOUNT_NUMBER || '0000 0000 0000 0000',
      iban: process.env.BANK_ACCOUNT_IBAN || 'PK00 BANK 0000 0000 0000 0000',
      instructions: 'Please include your Order Number in the transfer description and send a screenshot of the receipt to our WhatsApp support.'
    }

    // Verify critical env vars are set in production
    if (process.env.APP_ENV === 'production' && !process.env.BANK_ACCOUNT_IBAN) {
      logger.warn('[BANK DETAILS] BANK_ACCOUNT_IBAN is missing in production environment')
    }

    return NextResponse.json({ success: true, data: bankDetails })
  } catch (error) {
    logger.error('[BANK DETAILS ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
