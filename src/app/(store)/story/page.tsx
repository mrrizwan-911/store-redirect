import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Story | CALNZA',
  description: 'Redefining luxury fashion for the modern era through ethical craftsmanship.',
}

export default function StoryPage() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <header className="mb-20 text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight text-black mb-6 uppercase">Our Story</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">The pursuit of surgical precision</p>
        </header>

        <div className="space-y-16">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="aspect-[3/4] bg-neutral-100 border border-neutral-200">
              {/* Image placeholder */}
              <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-neutral-300">Brand Identity</div>
            </div>
            <div className="space-y-6">
              <h2 className="font-serif text-3xl font-light italic">The CALNZA Philosophy</h2>
              <p className="text-sm leading-relaxed text-neutral-600 font-sans">
                Founded with a singular vision to redefine luxury fashion in Pakistan, CALNZA represents the intersection of traditional craftsmanship and modern architectural precision.
              </p>
              <p className="text-sm leading-relaxed text-neutral-600 font-sans">
                Every stitch is a testament to our commitment to quality, every silhouette a reflection of contemporary elegance. We don't just create clothes; we curate a modern wardrobe for those who demand excellence.
              </p>
            </div>
          </section>

          <section className="border-t border-neutral-100 pt-16 space-y-8 text-center">
            <h2 className="font-serif text-3xl font-light uppercase tracking-widest">Ethical Craftsmanship</h2>
            <p className="text-sm leading-relaxed text-neutral-500 max-w-2xl mx-auto font-sans">
              Our studio in Lahore serves as the heartbeat of our brand. Here, master artisans work with the finest materials to bring our designs to life, ensuring that every piece that bears the CALNZA name meets our exacting standards of surgical precision and ethical production.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            {[
              { title: 'Quality', desc: 'Sourcing the finest fabrics globally.' },
              { title: 'Precision', desc: 'Architectural attention to every detail.' },
              { title: 'Legacy', desc: 'Creating pieces that transcend seasons.' }
            ].map((value) => (
              <div key={value.title} className="p-8 border border-neutral-100 text-center space-y-4">
                <h3 className="font-serif text-xl font-light italic">{value.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">{value.desc}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}