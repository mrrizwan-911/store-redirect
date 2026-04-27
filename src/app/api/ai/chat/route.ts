import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { aiConfig } from '@/lib/services/ai/config'
import { analyzeImage } from '@/lib/services/ai/visual-search'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { message, history, categorySlug, productId, image } = await req.json()

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    logger.info('POST /api/ai/chat', {
      messageLength: message.length,
      hasHistory: !!history?.length,
      hasImage: !!image,
      categorySlug,
      productId
    })

    // 1. Analyze image if present
    let visualContext = ''
    if (image) {
      try {
        const analysis = await analyzeImage(image)
        visualContext = `USER HAS ATTACHED AN IMAGE. Image analysis: ${analysis.description || 'Unknown item'}. Detected Category: ${analysis.category || 'N/A'}, Colors: ${analysis.colors?.join(', ') || 'N/A'}.`
      } catch (err) {
        logger.error('Failed to analyze image in chat', err)
      }
    }

    // 2. Load Size Guide Context
    const sizeGuides = await db.sizeGuide.findMany({
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    })

    // Sort to put matching category first
    const sortedGuides = [...sizeGuides].sort((a, b) => {
      if (categorySlug && a.category?.slug === categorySlug) return -1
      if (categorySlug && b.category?.slug === categorySlug) return 1
      return 0
    })

    const sizeGuideBlock = sortedGuides.map(guide => (
      `${guide.title}${guide.category ? ` (Category: ${guide.category.name})` : ''}:\n${guide.content}`
    )).join('\n---\n')

    // 2. Load Product Context (if any)
    let productContext = ''
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          category: { select: { name: true } },
          variants: { select: { title: true, optionValues: true,  stock: true } }
        }
      })

      if (product) {
        const sizes = Array.from(new Set(product.variants.map(v => v.title).filter(Boolean)))
        productContext = `PRODUCT CONTEXT: ${product.name}, Category: ${product.categoryId}, Options available: [${sizes.join(', ')}], Price: PKR ${Number(product.salePrice || product.basePrice).toLocaleString()}`
      }
    }

    // 3. Build System Prompt
    const systemPrompt = `
You are a helpful shopping assistant for Calnza, a fashion store in Pakistan.
You help customers find products, understand sizing, and make purchase decisions.

You have access to the following size guides from the store:
${sizeGuideBlock}

${productContext}

${visualContext}

When answering size questions: refer to the specific measurements in the size guides.
When recommending products: keep responses concise and helpful.
Do not make up product names or prices not in the context.
Respond in the same language the user writes in (Urdu or English).
Keep responses under 200 words unless detail is genuinely needed.
    `.trim()

    // 4. Call AI with Streaming
    const provider = aiConfig.provider
    const messages = [
      ...(history?.slice(-6) || []).map((h: any) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]

    const encoder = new TextEncoder()

    if (provider === 'openai') {
      const openai = aiConfig.getOpenAI()
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      })

      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    } else {
      const anthropic = aiConfig.getAnthropic()
      const stream = anthropic.messages.stream({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages,
      })

      const readableStream = new ReadableStream({
        async start(controller) {
          stream.on('text', (text) => {
            controller.enqueue(encoder.encode(text))
          })
          stream.on('end', () => {
            controller.close()
          })
          stream.on('error', (err) => {
            controller.error(err)
          })
        },
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      })
    }
  } catch (error) {
    logger.error('[AI_CHAT_ERROR]', error)
    return NextResponse.json({ success: false, error: 'Failed to process chat' }, { status: 500 })
  }
}
