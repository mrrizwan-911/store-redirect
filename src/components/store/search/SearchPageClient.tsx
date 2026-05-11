'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, LoaderCircle, X, Camera, MessageSquare, Bot, Send, ArrowRight } from 'lucide-react'
import { ProductCard } from '../shared/ProductCard'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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

export function SearchPageClient({ initialQuery, initialFeatured }: SearchPageClientProps) {
  // --- State ---
  const [searchMode, setSearchMode] = useState<'search' | 'chat'>('search')
  const [isInitialView, setIsInitialView] = useState(!initialQuery)
  const [isHeaderSticky, setIsHeaderSticky] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [results, setResults] = useState<{
    products: any[]
    mode: 'keyword' | 'ai_intent' | 'visual' | 'multimodal'
    intentFeedback?: string
    visualAnalysis?: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Handlers ---

  const handleSearch = async (searchQuery: string, imageObj: AttachedImage | null) => {
    if (!searchQuery.trim() && !imageObj) {
      setResults(null)
      setIsInitialView(true)
      return
    }

    setIsInitialView(false)
    setIsLoading(true)
    try {
      let data
      if (imageObj) {
        const response = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery || undefined, image: imageObj.base64 })
        })
        data = await response.json()
      } else {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        data = await response.json()
        if (data.success) {
          data.data = {
            products: data.data.products,
            mode: data.data.aiParsed ? 'ai_intent' : 'keyword',
            intentFeedback: data.data.intentFeedback
          }
        }
      }

      if (data.success) {
        setResults(data.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChat = async (message: string, imageObj: AttachedImage | null) => {
    if (!message.trim() && !imageObj) return

    setIsInitialView(false)
    const userMsg: ChatMessage = {
      role: 'user',
      content: message,
      image: imageObj?.base64
    }

    setChatHistory(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setQuery('')
    setAttachedImage(null)
    setIsStreaming(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          image: imageObj?.base64,
          history: chatHistory.slice(-6)
        })
      })

      if (!response.ok) throw new Error('Chat failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          setChatHistory(prev => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              last.content = fullResponse
            }
            return next
          })
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatHistory(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last && last.role === 'assistant') {
          last.content = 'Sorry, I encountered an error. Please try again.'
        }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setAttachedImage({ file, preview, base64 })
      if (searchMode === 'search') {
        setIsInitialView(false)
        handleSearch(query, { file, preview, base64 })
      }
    }
    reader.readAsDataURL(file)
  }

  const removeAttachedImage = () => {
    if (attachedImage) URL.revokeObjectURL(attachedImage.preview)
    setAttachedImage(null)
  }

  const clearAll = () => {
    setQuery('')
    removeAttachedImage()
    setResults(null)
    setChatHistory([])
    setIsInitialView(true)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, null)
    }
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatHistory])

  // --- Render Helpers ---

  const renderSearchBar = () => {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (searchMode === 'search') handleSearch(query, attachedImage)
          else handleChat(query, attachedImage)
        }}
        className="relative group w-full"
      >
        <div className={cn("flex justify-center transition-all duration-500", (!isInitialView || isHeaderSticky) ? "mb-3 md:mb-4" : "mb-5 md:mb-6")}>
          <div className="flex bg-neutral-100 p-0.5 rounded-full border border-neutral-200 shadow-none">
            <button
              type="button"
              onClick={() => {
                setSearchMode('search');
                setIsInitialView(!results || results.products.length === 0);
              }}
              className={cn(
                "px-5 py-1.5 text-[8px] md:text-[10px] uppercase tracking-widest font-black rounded-full transition-all flex items-center gap-2",
                searchMode === 'search' ? "bg-black text-white" : "text-neutral-400 hover:text-black"
              )}
            >
              <Search className="w-2.5 h-2.5 md:w-3 md:h-3" /> Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('chat');
                setIsInitialView(chatHistory.length === 0);
              }}
              className={cn(
                "px-5 py-1.5 text-[8px] md:text-[10px] uppercase tracking-widest font-black rounded-full transition-all flex items-center gap-2",
                searchMode === 'chat' ? "bg-black text-white" : "text-neutral-400 hover:text-black"
              )}
            >
              <MessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3" /> AI Chat
            </button>
          </div>
        </div>

        {/* Removed all shadows and blurs - completely flat sharp border */}
        <div className={cn(
          "relative flex items-center bg-white border rounded-full p-1 md:p-1.5",
          isInitialView ? "border-neutral-400 md:p-2" : "border-neutral-200"
        )}>
          {attachedImage && (
            <div className="flex items-center pl-3 pr-1">
              <div className="relative w-8 h-8 border border-black p-0.5 bg-white rounded-lg overflow-hidden shrink-0">
                <img src={attachedImage.preview} className="w-full h-full object-cover" alt="Thumb" />
                <button
                  type="button"
                  onClick={removeAttachedImage}
                  className="absolute -top-1 -right-1 bg-black text-white p-0.5 rounded-full hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <X className="w-2 h-2" />
                </button>
              </div>
            </div>
          )}

          <div className={cn("flex-1 relative", !attachedImage && "pl-5 md:pl-8")}>
            <input
              ref={inputRef}
              type="text"
              placeholder={searchMode === 'search' ? "Type to search..." : "Ask your style assistant..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent border-none border-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none placeholder:text-neutral-600 text-black transition-all font-medium text-sm md:text-base py-2.5 md:py-3.5"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-1 pr-1.5">
            {searchMode === 'chat' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-neutral-400 hover:text-black transition-colors rounded-full hover:bg-neutral-50"
                title="Attach Image"
              >
                <Camera className="w-5 h-5 stroke-[1.5]" />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </button>
            )}
            <button
              type="submit"
              className={cn(
                "flex items-center justify-center transition-all rounded-full bg-black text-white hover:bg-neutral-800 disabled:opacity-50",
                isInitialView ? "w-10 h-10 md:w-12 md:h-12" : "w-8 h-8 md:w-10 md:h-10"
              )}
              disabled={isLoading || isStreaming}
            >
              {isLoading || isStreaming ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                searchMode === 'search' ? <Search className={cn(isInitialView ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5 md:w-4 md:h-4")} strokeWidth={2.5} /> : <Send className={cn(isInitialView ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5 md:w-4 md:h-4")} />
              )}
            </button>
          </div>
        </div>

        {searchMode === 'search' && results && (
           <div className="mt-4 flex justify-center animate-in fade-in slide-in-from-top-1">
             <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 bg-neutral-50 px-3 py-1 border border-neutral-100 rounded-full">
               {results.mode.replace('_', ' ')} SEARCH
             </span>
           </div>
        )}
      </form>
    )
  }

  const showStickyStyles = !isInitialView || isHeaderSticky

  return (
    <div className={cn(
      "w-full max-w-full overflow-x-hidden flex flex-col bg-white transition-all duration-700",
      isInitialView ? "h-[calc(100dvh-120px)] overflow-hidden" : "min-h-screen"
    )}>
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex flex-col">
        {/* Search Header Container - Centered or Sticky Top */}
        <div className={cn(
          "w-full transition-all duration-700 ease-in-out z-40 pt-4 shrink-0 px-4 md:px-8 sticky top-[56px] md:top-[64px]",
          showStickyStyles ? "bg-white/95 backdrop-blur-md pb-6 border-b border-neutral-100 -mx-4 md:-mx-8 pt-4" : "pt-[15vh]"
        )}>
          <motion.div
            layout
            className={cn(
              "w-full transition-all duration-500 mx-auto",
              showStickyStyles ? "max-w-2xl" : "max-w-5xl"
            )}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {renderSearchBar()}
          </motion.div>
        </div>

        {/* Main Content Area - Natural Scrollable Section */}
        <div className={cn(
          "transition-all duration-500",
          isInitialView ? "hidden" : "mt-12 md:mt-16 block"
        )}>
          {searchMode === 'chat' ? (
            <div className="flex flex-col max-w-4xl mx-auto relative h-full">
              {chatHistory.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center opacity-30 grayscale select-none">
                   <Bot className="w-16 h-16 md:w-20 md:h-20 mb-6 stroke-[1]" />
                   <p className="font-display text-2xl md:text-3xl italic text-center text-black px-6">How can I assist you with your discovery today?</p>
                </div>
              )}

              {/* Chat Thread */}
              <div className="space-y-10 pb-20">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex gap-4 md:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    {msg.role === 'assistant' && (
                      <div className="w-10 h-10 bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 rounded-full shadow-sm">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-neutral-600" />
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[85%] md:max-w-2xl p-4 md:p-6 text-sm md:text-base leading-relaxed relative",
                      msg.role === 'user'
                        ? "bg-black text-white rounded-2xl rounded-tr-none shadow-md"
                        : "bg-white text-black border border-neutral-100 rounded-2xl rounded-tl-none shadow-sm"
                    )}>
                      {msg.image && (
                        <div className="mb-4 w-32 h-32 md:w-40 md:h-40 border border-white/20 rounded-lg overflow-hidden shadow-inner text-black">
                          <img src={`data:image/jpeg;base64,${msg.image}`} className="w-full h-full object-cover" alt="Visual context" />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">
                        {msg.content || (msg.role === 'assistant' && <div className="flex gap-1 py-2"><div className="w-1.5 h-1.5 bg-neutral-300 animate-bounce" /><div className="w-1.5 h-1.5 bg-neutral-300 animate-bounce [animation-delay:0.2s]" /><div className="w-1.5 h-1.5 bg-neutral-300 animate-bounce [animation-delay:0.4s]" /></div>)}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0 font-black text-[8px] md:text-[10px] tracking-tighter rounded-full border-2 border-white shadow-sm">
                        YOU
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Reset link at bottom */}
              {chatHistory.length > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setChatHistory([])}
                    className="text-[9px] uppercase tracking-widest font-black text-neutral-400 hover:text-black transition-colors"
                  >
                    Reset Thread
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-12">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-4 animate-pulse">
                      <div className="aspect-[4/5] bg-neutral-100 rounded-2xl border border-neutral-100" />
                      <div className="h-4 bg-neutral-100 w-2/3 rounded-full" />
                      <div className="h-3 bg-neutral-100 w-1/3 rounded-full" />
                    </div>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {!isLoading && results && results.products.length > 0 && (
                <div className="space-y-10 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                    <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-neutral-400">
                      {results.products.length} {results.products.length === 1 ? 'Look' : 'Looks'} Discovered
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-10 md:gap-y-12">
                    {results.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        slug={product.slug}
                        price={product.basePrice}
                        salePrice={product.salePrice}
                        category={product.category.name}
                        imageUrl={product.images[0]?.url || ''}
                        sku={product.sku}
                        description={product.description}
                        avgRating={product.avgRating}
                        reviewCount={product.reviewCount}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!isLoading && results && results.products.length === 0 && (
                <div className="text-center py-40 space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="opacity-10 grayscale flex justify-center mb-6">
                    <Search className="w-20 h-20 md:w-24 md:h-24 stroke-[1]" />
                  </div>
                  <p className="font-display text-3xl md:text-4xl italic text-neutral-300 px-6">
                    We couldn&apos;t find an exact match for your discovery
                  </p>
                  <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] border-b-2 border-black pb-2 hover:text-neutral-500 hover:border-neutral-200 transition-all"
                  >
                    Clear Discovery
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
