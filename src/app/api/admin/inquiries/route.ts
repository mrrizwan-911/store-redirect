import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'READ', 'REPLIED', 'ARCHIVED'])
})

export async function GET(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  try {
    const where = status ? { status: status as any } : {}

    const [inquiries, total] = await Promise.all([
      db.inquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.inquiry.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    })
  } catch (error) {
    logger.error('Failed to fetch admin inquiries', error)
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
    const body = await req.json()
    const { id, status } = body

    if (!id) return NextResponse.json({ success: false, error: 'Inquiry ID is required' }, { status: 400 })

    const validated = updateSchema.parse({ status })

    const inquiry = await db.inquiry.update({
      where: { id },
      data: { status: validated.status }
    })

    return NextResponse.json({ success: true, data: inquiry })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    logger.error('Failed to update inquiry status', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const authResponse = await requireAdmin(req)
  if (authResponse instanceof NextResponse) return authResponse

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ success: false, error: 'Inquiry ID is required' }, { status: 400 })

    await db.inquiry.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Inquiry deleted successfully' })
  } catch (error) {
    logger.error('Failed to delete inquiry', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
