import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ success: true, message: 'Wishlist sharing is currently disabled' })
}
