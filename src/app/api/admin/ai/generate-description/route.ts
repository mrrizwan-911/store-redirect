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

    const { name, category, tags } = await req.json()

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 })
    }

    // Using OpenAI GPT-4o as requested
    const openai = aiConfig.getOpenAI()

    const prompt = `Write a compelling 2-3 sentence product description for: ${name}
Category: ${category || 'None'}
Tags: ${Array.isArray(tags) ? tags.join(', ') : (tags || 'None')}
Keep it customer-facing, concise, and focused on benefits. No bullet points.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 300,
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
