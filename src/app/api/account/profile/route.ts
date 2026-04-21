import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { profileSchema } from '@/lib/validations/profile'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        loyalty: {
          select: {
            points: true,
            tier: true,
            totalEarned: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    logger.error('[API_PROFILE_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, phone, password, newPassword } = parsed.data

    const updateData: any = {}
    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    if (newPassword) {
      if (!password) {
        return NextResponse.json({ success: false, error: 'Current password is required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { id: session.userId } })
      if (!user || !user.passwordHash) {
        return NextResponse.json({ success: false, error: 'User not found or using OAuth' }, { status: 400 })
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid current password' }, { status: 401 })
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    })

    logger.info('User profile updated', { userId: updatedUser.id })

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    logger.error('[API_PROFILE_PATCH]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
