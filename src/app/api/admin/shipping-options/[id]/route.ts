import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { shippingOptionUpdateSchema } from '@/lib/validations/shipping-option'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await context.params
    const body = await req.json()
    const parsed = shippingOptionUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }
    const option = await db.shippingOption.update({
      where: { id },
      data: parsed.data
    })
    return NextResponse.json({ success: true, data: option })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await context.params
    await db.shippingOption.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
