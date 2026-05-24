import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

const schema = z.object({
  userId: z.string().min(1),
  code: z.string().length(6),
  orderId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { userId, code, orderId } = parsed.data

    // Find the latest valid OTP for this user
    const otp = await db.otpToken.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp || otp.code !== code) {
      logger.warn('Checkout OTP: Invalid or expired code', { userId, orderId })
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await db.otpToken.update({
      where: { id: otp.id },
      data: { used: true },
    })

    // Mark the order as email-verified
    await db.order.update({
      where: { id: orderId },
      data: { notes: 'email_verified' },
    })

    logger.info('Checkout OTP verified', { userId, orderId })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true,
    })
  } catch (err: any) {
    logger.error('[CHECKOUT_VERIFY_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
