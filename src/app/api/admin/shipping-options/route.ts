import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { shippingOptionSchema } from '@/lib/validations/shipping-option'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const options = await db.shippingOption.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json({ success: true, data: options })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const parsed = shippingOptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const option = await db.shippingOption.create({
      data: parsed.data
    })
    return NextResponse.json({ success: true, data: option }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
