'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import {
  Search,
  LoaderCircle,
  X,
  Camera,
  MessageSquare,
  Bot,
  Send,
} from 'lucide-react'
import { ProductCard } from '../shared/ProductCard'
import { ChatProductCard } from './ChatProductCard'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedProduct {
  id: string
  name: string
  slug: string
  basePrice: number
  salePrice: number | null
  avgRating: number
  reviewCount: number
  images: { url: string }[]
  category: { name: string; slug: string }
  variants: { title: string; optionValues: any; stock: number }[]
  sku?: string
  description?: string
}

interface SearchPageClientProps {
  initialQuery: string
  initialFeatured: EnrichedProduct[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string
}

interface AttachedImage {
  file: File
  preview: string
  base64: string
}

// ─── Product tag parser ───────────────────────────────────────────────────────
// Backend sends: [PRODUCT:id:slug:encodedName:price:encodedImageUrl]
// This splits the AI text and replaces tags with ChatProductCard components.
// Partial tags (mid-stream) fall through as plain text — no crash.

function parseMessageContent(content: string): ReactNode[] {
  if (!content) return []

  const parts = content.split(/(\[PRODUCT:[^\]]+\])/g)

  return parts.map((part, i) => {
    const m = part.match(/\[PRODUCT:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]*)\]/)

    if (m) {
      const [, id, slug, encodedName, priceStr, encodedImage] = m
      return (
        <ChatProductCard
          key={`prod-${i}-${id}`}
          id={id}
          slug={slug}
          name={decodeURIComponent(encodedName)}
          price={Number(priceStr) || 0}
          imageUrl={encodedImage ? decodeURIComponent(encodedImage) : ''}
        />
      )
    }

    return (
      <span key={`txt-${i}`} className="whitespace-pre-wrap break-words">
        {part}
      </span>
    )
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchPageClient({
  initialQuery,
  initialFeatured,
}: SearchPageClientProps) {

  // ── Shared state
  const [mode, setMode] = useState<'search' | 'chat'>('search')
  const [query, setQuery] = useState(initialQuery)
  const [image, setImage] = useState<AttachedImage | null>(null)

  // ── Search mode
  const [hasSearched, setHasSearched] = useState(!!initialQuery)
  const [results, setResults] = useState<{
    products: any[]
    mode: string
    intentFeedback?: string | null
  } | null>(null)
  const [searching, setSearching] = useState(false)

  // ── Chat mode
  // hasChatted: false = prompt centred (empty state)
  //             true  = messages above, prompt pinned bottom
  const [hasChatted, setHasChatted] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)

  // ── Shared layout tracking (avoids hardcoded viewport height issues when announcement bar is toggled)
  const [headerHeight, setHeaderHeight] = useState(56)

  // ── Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  // ── Measure and track combined header (Navbar + AnnouncementBar) height dynamically
  useEffect(() => {
    const updateHeight = () => {
      const header = document.querySelector('header')
      if (header) {
        const rect = header.getBoundingClientRect()
        const totalHeight = rect.bottom + window.scrollY
        if (totalHeight > 0) {
          setHeaderHeight(totalHeight)
        }
      }
    }

    updateHeight()

    let observer: ResizeObserver | null = null
    const headerElement = document.querySelector('header')
    const layoutContainer = headerElement?.parentElement

    if (layoutContainer && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateHeight()
      })
      observer.observe(layoutContainer)
    }

    window.addEventListener('resize', updateHeight)
    window.addEventListener('scroll', updateHeight)

    // Run layout adjustments at intervals to guarantee it catches asynchronous Announcement Bar load
    const timers = [50, 150, 300, 600, 1200, 2500].map(delay =>
      setTimeout(updateHeight, delay)
    )

    return () => {
      if (observer) observer.disconnect()
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('scroll', updateHeight)
      timers.forEach(clearTimeout)
    }
  }, [])

  // ── Scroll to bottom when new message arrives
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat])

  // ── Initial query from URL
  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery, null)
    searchInputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Focus correct input on mode switch
  useEffect(() => {
    const ref = mode === 'search' ? searchInputRef : chatInputRef
    const id = setTimeout(() => ref.current?.focus(), 60)
    return () => clearTimeout(id)
  }, [mode])

  // ────────────────────────────────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────────────────────────────────

  async function handleSearch(q: string, img: AttachedImage | null) {
    if (!q.trim() && !img) { setResults(null); setHasSearched(false); return }

    setHasSearched(true)
    setSearching(true)

    try {
      let data: any

      if (img) {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q || undefined, image: img.base64 }),
        })
        data = await res.json()
      } else {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        data = await res.json()
        if (data.success) {
          data.data = {
            products: data.data.products,
            mode: data.data.aiParsed ? 'ai_intent' : 'keyword',
            intentFeedback: data.data.intentFeedback,
          }
        }
      }

      if (data.success) setResults(data.data)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }

  async function handleChat(message: string, img: AttachedImage | null) {
    if (!message.trim() && !img) return

    // Flip to chatted state — triggers layout animation
    setHasChatted(true)
    setChat((prev) => [
      ...prev,
      { role: 'user', content: message, image: img?.base64 },
      { role: 'assistant', content: '' },
    ])
    setQuery('')
    setImage(null)
    setStreaming(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          image: img?.base64,
          history: chat.slice(-6),
        }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        for (; ;) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value, { stream: true })
          setChat((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'assistant') last.content = full
            return next
          })
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setChat((prev) => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant')
          last.content = 'Sorry, something went wrong. Please try again.'
        return next
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      const obj: AttachedImage = { file, preview, base64 }
      setImage(obj)
      if (mode === 'search') { setHasSearched(true); handleSearch(query, obj) }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function removeImage() {
    if (image) URL.revokeObjectURL(image.preview)
    setImage(null)
  }

  function clearSearch() {
    setQuery(''); removeImage(); setResults(null); setHasSearched(false)
  }

  function clearChat() {
    setQuery(''); removeImage(); setChat([]); setHasChatted(false)
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Shared UI pieces
  // ────────────────────────────────────────────────────────────────────────────

  function ModeToggle() {
    return (
      <div className="flex justify-center mb-4">
        <div className="flex bg-neutral-100 p-0.5 rounded-full border border-neutral-200">
          {(['search', 'chat'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all',
                'text-[9px] md:text-[10px] uppercase tracking-widest font-black',
                mode === m
                  ? 'bg-black text-white shadow-sm'
                  : 'text-neutral-400 hover:text-black'
              )}
            >
              {m === 'search'
                ? <><Search className="w-3 h-3" /> Search</>
                : <><MessageSquare className="w-3 h-3" /> AI Chat</>
              }
            </button>
          ))}
        </div>
      </div>
    )
  }

  function ImageChip() {
    if (!image) return null
    return (
      <div className="flex items-center pr-1 flex-shrink-0">
        <div className="relative w-8 h-8 border border-neutral-300 rounded-lg overflow-hidden">
          <img src={image.preview} className="w-full h-full object-cover" alt="Attached" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center"
            aria-label="Remove image"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  //
  //  SEARCH MODE
  //
  //  The store layout is:
  //    <div class="flex flex-col min-h-screen">
  //      <AnnouncementBar />
  //      <Navbar />          ← sticky top-0 in its own component
  //      <main class="flex-1">   ← SearchPageClient renders here
  //        <SearchPageClient />
  //      </main>
  //      <Footer />
  //    </div>
  //
  //  For search mode we use min-h-screen on the root so the page fills
  //  naturally. The sticky search bar uses sticky inside this container.
  //  No fixed heights — no outer scroll conflict.
  //
  // ────────────────────────────────────────────────────────────────────────────

  if (mode === 'search') {
    return (
      <div 
        className="w-full max-w-full overflow-x-hidden bg-white"
        style={{ minHeight: `calc(100dvh - ${headerHeight}px)` }}
      >

        {/* Search bar — centred OR sticky-top after first search */}
        <div
          className={cn(
            'w-full z-30 transition-all duration-500',
            hasSearched
              ? 'sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-100 px-4 md:px-8 py-3'
              : 'flex flex-col items-center justify-center px-4 md:px-8'
          )}
          style={!hasSearched ? { minHeight: `calc(100dvh - ${headerHeight + 16}px)` } : undefined}
        >
          <motion.div
            layout
            className="w-full mx-auto"
            style={{ maxWidth: hasSearched ? 600 : 520 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
          >
            {!hasSearched && (
              <div className="text-center mb-8 select-none">
                <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight mb-2">
                  Discover
                </h1>
                <p className="text-sm text-neutral-400">
                  Search by name, style, or category
                </p>
              </div>
            )}

            <ModeToggle />

            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query, image) }}>
              <div
                className={cn(
                  'flex items-center w-full bg-white rounded-full border transition-all',
                  hasSearched
                    ? 'border-neutral-200 px-3 py-1'
                    : 'border-neutral-400 px-4 py-2'
                )}
              >
                <ImageChip />

                <div className={cn('flex-1 min-w-0', !image && 'pl-1')}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by name, category, or style…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={cn(
                      'w-full bg-transparent border-none outline-none ring-0',
                      'placeholder:text-neutral-400 text-black font-medium',
                      'text-sm md:text-base',
                      hasSearched ? 'py-1.5' : 'py-2'
                    )}
                    autoComplete="off"
                  />
                </div>

                {(query || image) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-1.5 text-neutral-400 hover:text-black transition-colors flex-shrink-0"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={searching}
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center rounded-full',
                    'bg-black text-white hover:bg-neutral-800 active:scale-95',
                    'transition-all duration-150 disabled:opacity-50 ml-1',
                    hasSearched ? 'w-8 h-8' : 'w-10 h-10 md:w-11 md:h-11'
                  )}
                  aria-label="Search"
                >
                  {searching
                    ? <LoaderCircle className="w-4 h-4 animate-spin" />
                    : <Search
                      className={hasSearched ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-5 md:h-5'}
                      strokeWidth={2.5}
                    />
                  }
                </button>
              </div>
            </form>

            {hasSearched && results && (
              <div className="flex justify-center mt-2">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-300">
                  {(results.mode ?? 'keyword').replace(/_/g, ' ')} search
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12">

            {searching && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="aspect-[4/5] bg-neutral-100 rounded-2xl" />
                    <div className="h-3 bg-neutral-100 w-3/4 rounded-full" />
                    <div className="h-3 bg-neutral-100 w-1/2 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {!searching && results && results.products.length > 0 && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-8">
                  <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400">
                    {results.products.length}&nbsp;
                    {results.products.length === 1 ? 'Result' : 'Results'} Found
                  </h2>
                  <button
                    onClick={clearSearch}
                    className="text-[9px] uppercase tracking-widest font-black text-neutral-400 hover:text-black transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-12">
                  {results.products.map((p) => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      price={p.basePrice}
                      salePrice={p.salePrice ?? undefined}
                      category={p.category?.name ?? ''}
                      imageUrl={p.images?.[0]?.url ?? ''}
                      sku={p.sku ?? ''}
                      description={p.description}
                      avgRating={p.avgRating}
                      reviewCount={p.reviewCount}
                    />
                  ))}
                </div>
              </div>
            )}

            {!searching && results && results.products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-28 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="opacity-10">
                  <Search className="w-16 h-16 stroke-[1]" />
                </div>
                <p className="font-display text-2xl md:text-3xl italic text-neutral-300 text-center px-4">
                  No results found
                </p>
                <button
                  onClick={clearSearch}
                  className="text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-black pb-1 hover:text-neutral-400 hover:border-neutral-200 transition-all"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  //
  //  CHAT MODE
  //
  //  The layout problem and fix:
  //
  //  Problem: The store layout uses <div class="flex flex-col min-h-screen">
  //  and <main class="flex-1">. If we put height:100svh on the chat wrapper,
  //  the outer div ALSO has min-h-screen, creating TWO height sources → double
  //  scrollbar.
  //
  //  Fix: Chat wrapper fills <main> using height:100% on a flex column.
  //  <main> itself already has flex-1 which makes it grow to fill the viewport
  //  minus the Navbar + AnnouncementBar. We set the chat wrapper to fill
  //  <main> fully using the CSS approach below.
  //
  //  Scroll behaviour:
  //  - The OUTER page scroll (from <body> / layout div) is suppressed on
  //    this route by not exceeding the viewport.
  //  - The INNER messages scroll is handled by the messages div with
  //    overflow-y-auto. On desktop this shows a thin system scrollbar.
  //    On mobile it is hidden via [&::-webkit-scrollbar]:hidden.
  //
  //  Prompt position:
  //  - hasChatted=false: prompt sits in centre via flex justify-center
  //    on the outer column (empty state centred).
  //  - hasChatted=true: messages fill flex-1, prompt is flex-shrink-0
  //    at the bottom — naturally pinned.
  //  - Transition: AnimatePresence moves the prompt down with a spring
  //    animation on first message.
  //
  // ────────────────────────────────────────────────────────────────────────────

  return (
    // Fill <main flex-1> fully without creating extra scroll.
    // We use a combination: absolute inset-0 relative to <main>.
    // <main> in the store layout has position:static and flex-1.
    // We set the chat page to use a flex column that exactly fills it.
    <div
      className="w-full max-w-full overflow-x-hidden bg-white flex flex-col"
      // This makes the chat area exactly fill <main> without overflowing.
      // The store layout outer div is min-h-screen flex-col.
      // <main> is flex-1, meaning it grows to fill remaining viewport space.
      // By making this component also flex-col with a matching grow, we fill it.
      style={{ minHeight: `calc(100dvh - ${headerHeight}px)`, maxHeight: `calc(100dvh - ${headerHeight}px)` }}
    >

      {/* ── Messages area ─────────────────────────────────────────────────────
          When hasChatted=false: flex-1 shows the centred empty state.
          When hasChatted=true:  flex-1 is the scrollable messages column.
          Inner scrollbar:
            - Desktop: thin system scrollbar (acceptable UX)
            - Mobile:  hidden via webkit/scrollbar-none CSS
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        ref={messagesRef}
        className={cn(
          'flex-1 overflow-x-hidden',
          // When not chatted, don't allow scroll (content fits)
          hasChatted ? 'overflow-y-auto' : 'overflow-y-hidden',
          // Hide scrollbar on mobile, show on desktop
          '[&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block',
          '[&::-webkit-scrollbar]:w-1',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          '[&::-webkit-scrollbar-thumb]:bg-neutral-200',
          '[&::-webkit-scrollbar-thumb]:rounded-full',
        )}
      >
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 h-full">

          {/* Empty state — centred vertically */}
          {!hasChatted && (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="w-14 h-14 bg-neutral-50 border border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-neutral-400" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight mb-2">
                  Style Assistant
                </h1>
                <p className="text-sm text-neutral-400 max-w-xs leading-relaxed">
                  Ask me to find products, recommend outfits, or help with sizing
                </p>
              </motion.div>
            </div>
          )}

          {/* Chat thread */}
          {hasChatted && (
            <div className="space-y-5 pb-4 pt-2">
              <AnimatePresence initial={false}>
                {chat.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {/* Bot avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 mt-1 bg-neutral-50 border border-neutral-200 flex items-center justify-center flex-shrink-0 rounded-full">
                        <Bot className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={cn(
                        'min-w-0 text-sm leading-relaxed rounded-2xl px-4 py-3',
                        'max-w-[min(85vw,520px)]',
                        msg.role === 'user'
                          ? 'bg-black text-white rounded-tr-none'
                          : 'bg-neutral-50 text-black border border-neutral-100 rounded-tl-none'
                      )}
                    >
                      {msg.image && (
                        <div className="mb-3 w-28 h-28 rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
                          <img
                            src={`data:image/jpeg;base64,${msg.image}`}
                            className="w-full h-full object-cover"
                            alt="Attached"
                          />
                        </div>
                      )}

                      {msg.role === 'assistant' ? (
                        <div className="break-words">
                          {msg.content
                            ? parseMessageContent(msg.content)
                            : (
                              <div className="flex gap-1 py-1">
                                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.3s]" />
                              </div>
                            )
                          }
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                    </div>

                    {/* User avatar */}
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 mt-1 bg-black text-white flex items-center justify-center flex-shrink-0 font-black text-[7px] tracking-tighter rounded-full">
                        YOU
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>
          )}

          {hasChatted && chat.length > 0 && (
            <div className="flex justify-center mt-4 pb-2">
              <button
                onClick={clearChat}
                className="text-[9px] uppercase tracking-widest font-black text-neutral-300 hover:text-black transition-colors"
              >
                Reset Thread
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Prompt bar ────────────────────────────────────────────────────────
          Before first message: sits at the natural bottom of the flex column
          (empty state above it fills flex-1, pushing it down).
          After first message: still at the bottom — messages scroll above it.
          
          padding-bottom: safe-area-inset handles iPhone home indicator.
          pb-4 md:pb-6 gives breathing room from the bottom edge on all devices.
      ──────────────────────────────────────────────────────────────────────── */}
      <motion.div
        layout
        className="flex-shrink-0 bg-white border-t border-neutral-100 px-4 md:px-6 pt-3 pb-4 md:pb-6"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-3xl mx-auto w-full">

          <ModeToggle />

          <form onSubmit={(e) => { e.preventDefault(); handleChat(query, image) }}>
            <div
              className={cn(
                'flex items-end w-full bg-white rounded-2xl border transition-all',
                hasChatted
                  ? 'border-neutral-200 px-3 py-1.5'
                  : 'border-neutral-400 px-4 py-2'
              )}
            >
              <ImageChip />

              <div className="flex-1 min-w-0 pl-1">
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Ask about products, sizing, or styles…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={cn(
                    'w-full bg-transparent border-none outline-none ring-0',
                    'placeholder:text-neutral-400 text-black font-medium',
                    'text-sm md:text-base',
                    hasChatted ? 'py-1.5' : 'py-2'
                  )}
                  autoComplete="off"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-1.5 text-neutral-400 hover:text-black transition-colors rounded-full"
                aria-label="Attach image"
              >
                <Camera className="w-4 h-4 stroke-[1.5]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />

              <button
                type="submit"
                disabled={streaming || (!query.trim() && !image)}
                className={cn(
                  'flex-shrink-0 flex items-center justify-center ml-1',
                  'w-8 h-8 rounded-full bg-black text-white',
                  'hover:bg-neutral-800 active:scale-95',
                  'transition-all duration-150 disabled:opacity-40'
                )}
                aria-label="Send"
              >
                {streaming
                  ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </form>

          <p className="text-center text-[8px] text-neutral-300 mt-2 uppercase tracking-widest select-none">
            AI may make mistakes — verify details on the product page
          </p>
        </div>
      </motion.div>
    </div>
  )
}
