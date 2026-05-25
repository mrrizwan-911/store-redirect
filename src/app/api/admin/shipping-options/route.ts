import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const options = await db.shippingOption.findMany({
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json({ success: true, data: options })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, price, estimatedDays, countries, freeShippingThreshold, isActive, sortOrder } = body

    const option = await db.shippingOption.create({
      data: {
        name,
        description,
        price,
        estimatedDays,
        countries,
        freeShippingThreshold,
        isActive,
        sortOrder
      }
    })
    return NextResponse.json({ success: true, data: option })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
