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

    const { name, category, tags, shortDescription } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 })
    }

    // Using OpenAI GPT-4o as requested
    const openai = aiConfig.getOpenAI()

    const prompt = `You are a world-class fashion e-commerce copywriter. Your descriptions are known for being rich, evocative, and persuasive — they make customers feel the product and picture themselves wearing it.

Write a comprehensive, detailed product description for the following fashion item:

Product Name: ${name}
Category: ${category || 'Fashion / Apparel'}
Tags: ${Array.isArray(tags) ? tags.join(', ') : (tags || 'None')}
Short Description (for context): ${shortDescription || 'None'}

Write a FULL product description of 150-200 words in flowing prose (no bullet points, no headers). The description must cover:

1. **Opening hook** — A compelling opening sentence that captures the essence of the piece and draws the reader in
2. **Design & style details** — Describe the silhouette, cut, fabric feel, colors, and any key design details (stitching, buttons, prints, embellishments, etc.)
3. **Fit & comfort** — How it fits the body, the feel when worn, whether it's relaxed/fitted/structured
4. **Versatility & occasion** — What occasions this is perfect for, how to style it, what to pair it with
5. **Who it's for** — The lifestyle and personality of the ideal customer
6. **Closing value statement** — Why this piece deserves a place in their wardrobe

Write in second person ("you", "your") to be personal and engaging. Be specific and vivid. Avoid generic phrases like "perfect addition to your wardrobe" or "high quality". Make it feel premium, real, and desirable.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 600,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
        } catch (err) {
          logger.error('Error in stream:', err)
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: any) {
    logger.error('AI Generation Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate description' },
      { status: 500 }
    )
  }
}
