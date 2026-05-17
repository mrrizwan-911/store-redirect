import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters, checkRateLimit, getClientIp } from '@/lib/utils/rateLimit'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { aiConfig } from '@/lib/services/ai/config'
import { analyzeImage } from '@/lib/services/ai/visual-search'
import { parseSearchIntent } from '@/lib/services/ai/intent-parser'
import { getUserSession } from '@/lib/auth/session'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// ── Keywords that trigger a product catalog search ────────────────────────────
// Much broader than the original — covers "best shoes", "top selling", etc.
const PRODUCT_TRIGGERS = [
  'show', 'find', 'best', 'top', 'recommend', 'suggest', 'looking for',
  'need', 'want', 'buy', 'get me', 'outfit', 'wear', 'style', 'collection',
  'latest', 'new', 'popular', 'trending', 'selling', 'display', 'list',
  'pants', 'shirt', 'shirts', 'dress', 'dresses', 'shoes', 'jacket', 'jackets',
  'kurta', 'kurtas', 'kameez', 'shalwar', 'abaya', 'trousers', 'jeans',
  'shorts', 'skirt', 'coat', 'sweater', 'hoodie', 'sneakers', 'boots',
  'sandals', 'bag', 'bags', 'wallet', 'belt', 'accessory', 'accessories',
  'formal', 'casual', 'sportswear', 'summer', 'winter', 'eid', 'wedding',
]

function shouldSearchProducts(message: string): boolean {
  const lower = message.toLowerCase()
  return PRODUCT_TRIGGERS.some((t) => lower.includes(t))
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting (preserved from original) ───────────────────────────────
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.ai, clientIp)
    if (rateLimitErr) return rateLimitErr

    const { message, history, categorySlug, productId, image } = await req.json()

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    // ── Analytics identity (Option A: both logged-in and guests) ─────────────
    let userId: string | null = null
    let sessionId: string | null = null
    try {
      const session = await getUserSession()
      const cookieStore = await cookies()
      userId = session?.userId ?? null
      sessionId = cookieStore.get('anon_session')?.value ?? null
    } catch { /* non-fatal */ }

    const sessionTs = new Date().toISOString().substring(0, 16)

    logger.info('POST /api/ai/chat', {
      messageLength: message.length,
      hasHistory: !!history?.length,
      hasImage: !!image,
      categorySlug,
      productId,
    })

    // ── 1. Image analysis ─────────────────────────────────────────────────────
    let visualContext = ''
    if (image) {
      try {
        const analysis = await analyzeImage(image)
        visualContext = `USER HAS ATTACHED AN IMAGE. Image analysis: ${analysis.description || 'Unknown item'}. Detected Category: ${analysis.category || 'N/A'}, Colors: ${analysis.colors?.join(', ') || 'N/A'}.`
      } catch (err) {
        logger.error('Failed to analyze image in chat', err)
      }
    }

    // ── 2. Size guide context ─────────────────────────────────────────────────
    const sizeGuides = await db.sizeGuide.findMany({
      include: { category: { select: { name: true, slug: true } } },
    })

    const sortedGuides = [...sizeGuides].sort((a, b) => {
      if (categorySlug && a.category?.slug === categorySlug) return -1
      if (categorySlug && b.category?.slug === categorySlug) return 1
      return 0
    })

    const sizeGuideBlock = sortedGuides.length > 0
      ? sortedGuides.map(
        (g) => `${g.title}${g.category ? ` (Category: ${g.category.name})` : ''}:\n${g.content}`
      ).join('\n---\n')
      : 'No size guides currently available.'

    // ── 3. Specific product page context (PDP assistant) ─────────────────────
    let productContext = ''
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        include: {
          category: { select: { name: true } },
          variants: { select: { title: true, optionValues: true, stock: true } },
        },
      })
      if (product) {
        const sizes = [...new Set(product.variants.map((v) => v.title).filter(Boolean))]
        productContext = `PRODUCT CONTEXT: ${product.name}, Category: ${product.category?.name ?? 'N/A'}, Options available: [${sizes.join(', ')}], Price: PKR ${Number(product.salePrice || product.basePrice).toLocaleString()}`
      }
    }

    // ── 4. Dynamic product search (broad triggers) ────────────────────────────
    let searchContext = ''

    if (shouldSearchProducts(message) || !!image) {
      try {
        let intent: Record<string, any> = {}
        try {
          intent = await parseSearchIntent(message)
        } catch { /* non-fatal */ }

        const where: any = { isActive: true }

        if (intent.category) {
          where.category = { name: { contains: intent.category, mode: 'insensitive' } }
        } else if (intent.subCategory) {
          where.category = { name: { contains: intent.subCategory, mode: 'insensitive' } }
        }

        if (intent.minPrice !== undefined || intent.maxPrice !== undefined) {
          where.basePrice = {
            ...(intent.minPrice !== undefined && { gte: intent.minPrice }),
            ...(intent.maxPrice !== undefined && { lte: intent.maxPrice }),
          }
        }

        // Keyword fallback when no category detected from intent
        if (!where.category) {
          const keywordTerms = PRODUCT_TRIGGERS.filter(
            (t) => message.toLowerCase().includes(t) && t.length > 4
          )
          where.OR = [
            { name: { contains: message, mode: 'insensitive' } },
            ...keywordTerms.map((t) => ({
              category: { name: { contains: t, mode: 'insensitive' } },
            })),
          ]
        }

        // Most reviewed first = most popular / best-selling proxy
        const found = await db.product.findMany({
          where,
          take: 5,
          orderBy: [
            { reviews: { _count: 'desc' } },
            { isFeatured: 'desc' },
            { createdAt: 'desc' },
          ],
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            salePrice: true,
            category: { select: { name: true } },
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            _count: { select: { reviews: true } },
          },
        })

        if (found.length > 0) {
          // ── CRITICAL: Tag format must be exactly 5 fields ─────────────────
          // Format: [PRODUCT:id:slug:encodedName:price:encodedImageUrl]
          // The frontend parser in SearchPageClient.tsx splits on exactly
          // this 5-field pattern. Any other format shows as raw text.
          const lines = found.map((p) => {
            const price = Number(p.salePrice ?? p.basePrice)
            const imageUrl = p.images[0]?.url ?? ''
            return (
              `- ${p.name} | PKR ${price.toLocaleString()} | ${p.category.name} | ` +
              `[PRODUCT:${p.id}:${p.slug}:${encodeURIComponent(p.name)}:${price}:${encodeURIComponent(imageUrl)}]`
            )
          })

          searchContext = [
            'REAL PRODUCTS FROM OUR CATALOG:',
            ...lines,
            '',
            'HOW TO EMBED A PRODUCT IN YOUR RESPONSE:',
            '- Copy the [PRODUCT:...] tag exactly as shown above (all 5 parts after PRODUCT:).',
            '- Embed it naturally in your sentence, e.g.:',
            '  "You might like [PRODUCT:abc123:blue-sneakers:Blue%20Sneakers:4000:https%3A%2F%2F...]"',
            '- Do NOT use markdown links like [name](url). Only the [PRODUCT:...] tag format.',
            '- Recommend 1–3 products maximum per response.',
            '- You CAN and MUST recommend products when the user asks. Never say you cannot access products.',
          ].join('\n')
        } else {
          searchContext = 'No products found matching this query. Help with sizing and general style advice instead.'
        }
      } catch (err) {
        logger.error('Failed to search products for chat', err)
      }
    }

    // ── 5. System prompt ──────────────────────────────────────────────────────
    const systemPrompt = `
You are a helpful, warm shopping assistant for Calnza, a fashion store in Pakistan.
You help customers find products, choose sizes, and make confident purchase decisions.
You have access to real product data and MUST recommend products when asked.
NEVER say "I can only help with size guide information."

SIZE GUIDES:
${sizeGuideBlock}

${productContext ? `\n${productContext}\n` : ''}
${searchContext ? `\n${searchContext}\n` : ''}
${visualContext ? `\n${visualContext}\n` : ''}

RULES:
1. Under 200 words unless detail is genuinely needed.
2. When recommending products, ALWAYS embed the [PRODUCT:id:slug:name:price:imageUrl] tag exactly as shown in the catalog above. All 5 fields are required.
3. Never fabricate product names or prices not in the context above.
4. Respond in the same language the user writes in (Urdu or English).
5. Be friendly and conversational.
    `.trim()

    // ── 6. Save user message analytics (fire-and-forget) ─────────────────────
    if (userId || sessionId) {
      db.userChatHistory
        .create({ data: { userId, sessionId, message, role: 'user', sessionTs } })
        .catch(() => { })
    }

    // ── 7. Stream AI response ─────────────────────────────────────────────────
    const provider = aiConfig.provider
    const messages = [
      ...(history?.slice(-6) ?? []).map((h: any) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content as string,
      })),
      { role: 'user' as const, content: message },
    ]

    const encoder = new TextEncoder()

    const saveAssistantMessage = (text: string) => {
      if ((userId || sessionId) && text.trim()) {
        db.userChatHistory
          .create({ data: { userId, sessionId, message: text, role: 'assistant', sessionTs } })
          .catch(() => { })
      }
    }

    if (provider === 'openai') {
      const openai = aiConfig.getOpenAI()
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true,
      })

      let full = ''
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              full += text
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
          saveAssistantMessage(full)
        },
      })

      return new Response(readable, {
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
        messages,
      })

      let full = ''
      const readable = new ReadableStream({
        async start(controller) {
          stream.on('text', (text) => {
            full += text
            controller.enqueue(encoder.encode(text))
          })
          stream.on('end', () => {
            controller.close()
            saveAssistantMessage(full)
          })
          stream.on('error', (err) => controller.error(err))
        },
      })

      return new Response(readable, {
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
