import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdmin(req as any)
    if (authError instanceof NextResponse) return authError

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'products',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    })

    return NextResponse.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 })
  }
}
