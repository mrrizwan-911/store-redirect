import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { sendAdminInviteEmail } from '@/lib/services/email/adminInvite'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// ── POST /api/admin/invites — Send invite ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data

    // Check if user already exists as admin
    const existing = await db.user.findUnique({ where: { email } })
    if (existing?.role === 'ADMIN') {
      return NextResponse.json({ error: 'This email is already an admin' }, { status: 409 })
    }

    // Check for pending un-expired invite
    const pendingInvite = await db.adminInvite.findFirst({
      where: { email, used: false, expiresAt: { gt: new Date() } },
    })
    if (pendingInvite) {
      return NextResponse.json({ error: 'An active invite already exists for this email' }, { status: 409 })
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const invite = await db.adminInvite.upsert({
      where: { email },
      create: { email, invitedBy: session.email, expiresAt },
      update: { invitedBy: session.email, expiresAt, used: false },
    })

    await sendAdminInviteEmail(email, session.email, invite.token)

    return NextResponse.json({ success: true, message: `Invite sent to ${email}` })
  } catch (err) {
    console.error('[AdminInvite] POST error:', err)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}

// ── GET /api/admin/invites — List pending invites ─────────────────────────────
export async function GET() {
  try {
    const session = await getUserSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invites = await db.adminInvite.findMany({
      where: { used: false, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, invitedBy: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ invites })
  } catch (err) {
    console.error('[AdminInvite] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}
