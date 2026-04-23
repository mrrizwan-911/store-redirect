import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { resetPasswordSchema } from '@/lib/validations/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    // 1. Find token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    // 2. Validate token
    if (!resetToken || resetToken.used) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // 3. Check expiry
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // 4. Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // 5. Transaction: Update password, mark token as used, delete all refresh tokens
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      db.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ])

    logger.auth('Password reset successful', { userId: resetToken.userId })

    return NextResponse.json({
      success: true,
      data: { message: 'Password updated successfully' },
    })
  } catch (err) {
    logger.error('[AUTH_RESET_PASSWORD]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
