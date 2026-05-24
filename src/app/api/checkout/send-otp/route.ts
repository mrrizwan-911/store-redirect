import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { sendOtpEmail } from '@/lib/services/email/otp'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  orderId: z.string().min(1),
})

// Generate a 6-digit numeric OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

    const { email, orderId } = parsed.data

    // Verify order exists and belongs to this email
    const order = await db.order.findFirst({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Allow guest checkout (no user) or verify email matches registered user
    const userEmail = order.user?.email
    if (userEmail && userEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email does not match order' },
        { status: 403 }
      )
    }

    // Find or create a user record for OTP storage
    let userId = order.userId
    if (!userId) {
      // Guest checkout — find or create a guest user by email
      let user = await db.user.findFirst({ where: { email } })
      if (!user) {
        user = await db.user.create({
          data: { email, name: email.split('@')[0], role: 'GUEST', isVerified: false },
        })
      }
      userId = user.id
    }

    // Invalidate any previous unused OTPs for this user
    await db.otpToken.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    // Create new OTP — expires in 10 minutes
    const code = generateOtp()
    await db.otpToken.create({
      data: {
        userId,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    // Send OTP email (uses the existing sendOtpEmail service)
    const userName = order.user?.name || email.split('@')[0]
    await sendOtpEmail(email, userName, code)

    logger.info('Checkout OTP sent', { email, orderId })

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      userId,
    })
  } catch (err: any) {
    logger.error('[CHECKOUT_SEND_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
