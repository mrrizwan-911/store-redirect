import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

const AcceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ── POST /api/admin/invites/accept ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = AcceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { token, password } = parsed.data

    const invite = await db.adminInvite.findUnique({ where: { token } })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 400 })
    }
    if (invite.used) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 400 })
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite has expired. Ask an admin to send a new one.' }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)

    const existingUser = await db.user.findUnique({ where: { email: invite.email } })

    if (existingUser) {
      await db.user.update({
        where: { email: invite.email },
        data: { role: 'ADMIN', passwordHash, isVerified: true },
      })
    } else {
      await db.user.create({
        data: {
          email: invite.email,
          name: invite.email.split('@')[0],
          passwordHash,
          role: 'ADMIN',
          isVerified: true,
        },
      })
    }

    await db.adminInvite.update({
      where: { token },
      data: { used: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Account created. You can now sign in.',
    })
  } catch (err) {
    logger.error('[AdminInvite] Accept error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// ── GET /api/admin/invites/accept?token=xxx — Validate token ──────────────────
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 })
  }

  const invite = await db.adminInvite.findUnique({
    where: { token },
    select: { email: true, used: true, expiresAt: true },
  })

  if (!invite)            return NextResponse.json({ valid: false, error: 'Invalid link' }, { status: 400 })
  if (invite.used)        return NextResponse.json({ valid: false, error: 'Already used' }, { status: 400 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ valid: false, error: 'Expired' }, { status: 400 })

  return NextResponse.json({ valid: true, email: invite.email })
}
