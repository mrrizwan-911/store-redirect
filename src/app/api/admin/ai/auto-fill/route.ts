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

    const prompt = `You are a world-class e-commerce copywriter and product merchandiser specializing in fashion and apparel. You write compelling, SEO-optimized product content that converts browsers into buyers.

I am providing an image of a clothing/fashion product. Here is the data the admin has already provided (use this as context):
${JSON.stringify(currentData, null, 2)}

Analyze the image carefully — note the style, fabric appearance, color, cut, silhouette, details (stitching, buttons, embellishments), occasion suitability, and target demographic.

Generate a COMPLETE, RICH product profile. The description fields must be detailed and compelling:

- **name**: A catchy, brand-aligned product name (enhance existing if provided, otherwise create a memorable one)
- **shortDescription**: One punchy sentence (max 20 words) that captures the essence and main appeal — think of it as a tagline
- **description**: A RICH, DETAILED description of at least 150-200 words. This is the main product page description. Structure it as flowing paragraphs (no bullet points) covering:
  1. Opening hook — what makes this piece special or desirable
  2. Style & design details — silhouette, cut, fabric feel/texture (as you can observe), color description, key design elements
  3. Versatility & styling — how to wear it, what occasions it suits, what to pair it with
  4. Who it's for — the target customer / lifestyle this piece represents
  5. Closing value statement — why it belongs in their wardrobe
- **tags**: 8-12 highly relevant SEO tags as an array (include style type, occasion, fabric type if identifiable, color, gender, season)
- **suggestedCategory**: Best matching category from: "Men's Clothing", "Women's Clothing", "Kids' Clothing", "Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories", "Activewear", "Formal Wear", "Casual Wear", "Ethnic Wear"

Respond ONLY with a valid, raw JSON object — no markdown, no backticks, no explanations:
{
  "name": "...",
  "shortDescription": "...",
  "description": "...",
  "tags": ["tag1", "tag2", ...],
  "suggestedCategory": "..."
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1200,
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
                detail: 'high',
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
