import { Metadata } from 'next'
import { NewsletterSection } from '@/components/store/home/NewsletterSection'

export const metadata: Metadata = {
  title: 'Newsletter | Join the Inner Circle',
  description: 'Subscribe to our newsletter for exclusive access to new arrivals, private sales, and seasonal editorials.',
}

export default function NewsletterPage() {
  return (
    <main className="min-h-screen">
      {/* Immersive Editorial Header */}
      <section className="bg-black text-white h-[90vh] min-h-[800px] pt-32 md:pt-40 relative overflow-hidden flex items-center">
        {/* Abstract background architecture */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-neutral-900/40 rounded-full blur-[160px] -mr-96 -mt-96 animate-pulse duration-[10s]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neutral-900/20 rounded-full blur-[140px] -ml-48 -mb-48" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-zebra-3.png')] opacity-[0.05] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 w-full">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="overflow-hidden mb-8">
                <span className="text-[10px] uppercase tracking-[0.8em] text-neutral-500 font-bold block animate-in slide-in-from-bottom-full duration-1000">
                  The Protocol of Style
                </span>
              </div>

              <h1 className="font-display text-8xl md:text-[13rem] font-medium tracking-tighter leading-[0.8] mb-12 animate-in fade-in zoom-in-95 duration-1000 delay-200">
                <span className="block">The</span>
                <span className="block text-neutral-400 italic font-serif -mt-4 md:-mt-8 ml-12">Inner</span>
                <span className="block -mt-4 md:-mt-8">Circle<span className="text-white/20">.</span></span>
              </h1>

              <div className="w-px h-24 bg-gradient-to-b from-white/0 via-white/50 to-white/0 mb-12 animate-in fade-in duration-1000 delay-500" />

              <p className="text-neutral-400 text-lg md:text-2xl font-sans leading-relaxed max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
                A surgical dispatch for the discerning. Weekly archives, private pricing, and seasonal logic delivered to your digital doorstep.
              </p>

              <div className="animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-1000">
                <a
                  href="#subscribe"
                  className="group relative inline-flex items-center justify-center px-12 py-5 border border-white/20 hover:border-white transition-colors duration-500 overflow-hidden"
                >
                  <span className="relative z-10 text-[11px] uppercase tracking-[0.4em] font-bold">Entry Protocol</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <span className="absolute inset-0 flex items-center justify-center z-20 text-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-[11px] uppercase tracking-[0.4em] font-bold">
                    Join Now
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <div id="subscribe" className="bg-white scroll-mt-0">
        <NewsletterSection />
      </div>

      {/* Editorial Benefit Grid */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            <div className="space-y-4">
              <h3 className="font-display text-xl font-medium uppercase tracking-tight">Private Sales</h3>
              <p className="text-neutral-600 text-sm leading-relaxed font-sans">
                Access members-only pricing and seasonal archives before the general public.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-xl font-medium uppercase tracking-tight">New Arrivals</h3>
              <p className="text-neutral-600 text-sm leading-relaxed font-sans">
                Be the first to see our weekly drops and limited edition collaborative pieces.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-display text-xl font-medium uppercase tracking-tight">Style Logic</h3>
              <p className="text-neutral-600 text-sm leading-relaxed font-sans">
                Deep dives into craftsmanship, ethical sourcing, and the architecture of the modern wardrobe.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
