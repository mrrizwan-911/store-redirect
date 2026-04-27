import { NextResponse } from 'next/server'
import { aiConfig } from '@/lib/services/ai/config'
import { logger } from '@/lib/utils/logger'
import { requireAdmin } from '@/lib/utils/adminAuth'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const userId = await requireAdmin(req as any)
    if (typeof userId !== 'string') {
      return userId
    }

    const { images, currentData } = await req.json()

    if (!images || images.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one image is required for auto-fill' }, { status: 400 })
    }

    // Fetch the first image and convert to base64 for GPT-4o Vision
    const imageUrl = images[0].url
    let base64Image = ''
    let mediaType = 'image/jpeg'

    try {
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.statusText}`)
      const arrayBuffer = await imgRes.arrayBuffer()
      base64Image = Buffer.from(arrayBuffer).toString('base64')
      mediaType = imgRes.headers.get('content-type') || 'image/jpeg'
    } catch (imgErr) {
      logger.error('Failed to process image for AI', { error: imgErr })
      return NextResponse.json({ success: false, error: 'Could not process image for AI vision' }, { status: 400 })
    }

    // Use OpenAI GPT-4o
    const openai = aiConfig.getOpenAI()

    const prompt = `You are an expert e-commerce merchandiser. I am providing an image of a product.
Here is the data the admin has already provided (use this as context to guide your generation):
${JSON.stringify(currentData, null, 2)}

Please analyze the image and the existing data. Your task is to generate a complete product profile.
If the admin has already provided a specific field (like the name or tags), incorporate it into your thinking.

Respond ONLY with a valid, raw JSON object matching this exact structure (no markdown tags, no explanations):
{
  "name": "Catchy, brand-aligned product name (enhance existing if provided)",
  "shortDescription": "One sentence summary highlighting the main appeal",
  "description": "2-3 sentence compelling description focused on benefits and style. No bullet points.",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "A category name like 'Clothes', 'Shoes', 'Accessories', 'Apparel', etc."
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    })

    const responseText = response.choices[0]?.message?.content || ''
    
    // Attempt to parse the JSON (handle potential markdown formatting from AI)
    let parsedJson
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
      parsedJson = JSON.parse(cleanJson)
    } catch (parseErr) {
      logger.error('Failed to parse AI JSON response', { responseText })
      return NextResponse.json({ success: false, error: 'AI returned invalid format' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: parsedJson })

  } catch (error: any) {
    logger.error('AI Auto-Fill Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to auto-fill product data' },
      { status: 500 }
    )
  }
}
