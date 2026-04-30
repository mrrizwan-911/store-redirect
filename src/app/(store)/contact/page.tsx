import { Metadata } from 'next'
import { Mail, MapPin, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | CALNZA',
  description: 'Connect with the CALNZA concierge for inquiries, appointments, and support.',
}

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <header className="mb-20">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight text-black mb-6 uppercase">Contact</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">The Concierge Service</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Information */}
          <div className="space-y-16">
            <div className="space-y-8">
              <h2 className="font-serif text-3xl font-light italic">Get in Touch</h2>
              <p className="text-sm leading-relaxed text-neutral-500 max-w-md font-sans">
                Our concierge team is available to assist you with sizing, styling advice, or any inquiries regarding your order.
              </p>
            </div>

            <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 border border-neutral-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 font-sans">WhatsApp</h3>
                  <p className="text-sm text-black font-sans">+92 300 1234567</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 border border-neutral-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 font-sans">Email</h3>
                  <p className="text-sm text-black font-sans">concierge@calnza.pk</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 border border-neutral-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 font-sans">Studio</h3>
                  <p className="text-sm text-black font-sans leading-relaxed">
                    DHA Phase 6, Lahore,<br />
                    Pakistan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-10 border border-neutral-100 space-y-8">
            <h3 className="text-[11px] uppercase tracking-[0.3em] font-bold text-black border-b border-neutral-100 pb-4">Send a Message</h3>

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Full Name</label>
                <input
                  type="text"
                  className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black transition-colors rounded-none"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Email Address</label>
                <input
                  type="email"
                  className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black transition-colors rounded-none"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Message</label>
                <textarea
                  rows={4}
                  className="w-full border border-neutral-200 p-3 text-sm focus:outline-none focus:border-black transition-colors resize-none rounded-none"
                  placeholder="How can we assist you?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-900 transition-colors rounded-none"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}