'use client'

import { useState, useEffect } from 'react'
import { Mail, MapPin, Phone, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  useEffect(() => {
    // Fetch contact info from settings
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (data.success) {
          setSettings(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch settings", error)
      }
    }
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setIsSuccess(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
        toast.success('Your message has been sent successfully.')
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <header className="mb-20">
          <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight text-black mb-6 uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">Contact</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">The Concierge Service</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Information */}
          <div className="space-y-16 animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            <div className="space-y-8">
              <h2 className="font-serif text-3xl font-light italic text-black">Get in Touch</h2>
              <p className="text-sm leading-relaxed text-neutral-500 max-w-md font-sans">
                Our concierge team is available to assist you with sizing, styling advice, or any inquiries regarding your order.
              </p>
            </div>

            <div className="space-y-10">
              <div className="flex gap-6 items-start group">
                <div className="w-12 h-12 border border-neutral-100 flex items-center justify-center shrink-0 group-hover:border-black transition-colors duration-500">
                  <Phone className="w-4 h-4 text-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 font-sans">WhatsApp</h3>
                  <p className="text-sm text-black font-sans">{settings?.contactPhone || '+92 300 1234567'}</p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="w-12 h-12 border border-neutral-100 flex items-center justify-center shrink-0 group-hover:border-black transition-colors duration-500">
                  <Mail className="w-4 h-4 text-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 font-sans">Email</h3>
                  <p className="text-sm text-black font-sans">{settings?.contactEmail || 'concierge@calnza.pk'}</p>
                </div>
              </div>

              <div className="flex gap-6 items-start group">
                <div className="w-12 h-12 border border-neutral-100 flex items-center justify-center shrink-0 group-hover:border-black transition-colors duration-500">
                  <MapPin className="w-4 h-4 text-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 font-sans">Studio</h3>
                  <p className="text-sm text-black font-sans leading-relaxed">
                    {settings?.contactAddress || 'DHA Phase 6, Lahore, Pakistan'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-10 border border-neutral-100 space-y-8 bg-neutral-50/30 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 relative overflow-hidden">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-black flex items-center justify-center rounded-full mb-2">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[12px] uppercase tracking-[0.3em] font-bold text-black">Message Received</h3>
                  <p className="text-sm text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                    Thank you for reaching out. A CALNZA representative will contact you within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-[9px] uppercase tracking-[0.2em] font-bold border-b border-black pb-1 hover:text-neutral-400 hover:border-neutral-400 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-[11px] uppercase tracking-[0.3em] font-bold text-black border-b border-neutral-100 pb-4">Send a Message</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black transition-colors rounded-[var(--radius)] placeholder:text-neutral-200"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Email Address</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black transition-colors rounded-[var(--radius)] placeholder:text-neutral-200"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Subject (Optional)</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black transition-colors rounded-[var(--radius)] placeholder:text-neutral-200"
                      placeholder="What is this about?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full border border-neutral-200 bg-white p-3 text-sm focus:outline-none focus:border-black transition-colors resize-none rounded-[var(--radius)] placeholder:text-neutral-200"
                      placeholder="How can we assist you?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-900 transition-all rounded-[var(--radius)] flex items-center justify-center",
                      isSubmitting && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
