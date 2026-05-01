'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function BroadcastDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    header: '',
    body: '',
    ctaLabel: 'Shop Now',
    ctaLink: '/products',
    segment: 'all',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Broadcast sent to ${result.count} subscribers`)
        setIsOpen(false)
        setFormData({
          subject: '',
          header: '',
          body: '',
          ctaLabel: 'Shop Now',
          ctaLink: '/products',
          segment: 'all',
        })
      } else {
        toast.error(result.error || 'Failed to send broadcast')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-none bg-black text-white hover:bg-neutral-900 uppercase tracking-widest text-[10px] font-bold h-10 px-6 gap-2">
          <Send className="w-3.5 h-3.5" />
          New Broadcast
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-none border-neutral-200 p-0 overflow-hidden bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="bg-white">
          <DialogHeader className="p-8 bg-neutral-50 border-b border-neutral-100 relative z-20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Marketing Hub</span>
              <Sparkles className="w-3 h-3 text-neutral-400" />
            </div>
            <DialogTitle className="font-display text-2xl font-medium tracking-tight uppercase">Draft Broadcast</DialogTitle>
            <DialogDescription className="text-neutral-500 text-xs tracking-wide">
              Create a luxury email campaign for your subscribers. This will be sent via Resend.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., The Monochrome Collection | New Arrivals"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="rounded-none border-neutral-200 focus-visible:ring-black text-[13px] h-11"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="segment" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Target Segment</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(val) => setFormData({ ...formData, segment: val || 'all' })}
                >
                  <SelectTrigger className="rounded-none border-neutral-200 focus:ring-black text-[13px] h-11">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all" className="text-xs uppercase tracking-wider">All Active Subscribers</SelectItem>
                    <SelectItem value="recent" className="text-xs uppercase tracking-wider">Joined Last 30 Days</SelectItem>
                    <SelectItem value="unsubscribed" className="text-xs uppercase tracking-wider">Unsubscribed (Re-engagement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="header" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Hero Header</Label>
              <Input
                id="header"
                placeholder="e.g., ELEVATED MINIMALISM"
                required
                value={formData.header}
                onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                className="rounded-none border-neutral-200 focus-visible:ring-black text-[13px] uppercase tracking-wider h-11"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="body" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Campaign Body</Label>
              <Textarea
                id="body"
                placeholder="Write your campaign message here..."
                required
                rows={6}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="rounded-none border-neutral-200 focus-visible:ring-black text-[13px] leading-relaxed resize-none p-4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="ctaLabel" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Button Label</Label>
                <Input
                  id="ctaLabel"
                  value={formData.ctaLabel}
                  onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
                  className="rounded-none border-neutral-200 focus-visible:ring-black text-[13px] h-11"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="ctaLink" className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Button Link</Label>
                <Input
                  id="ctaLink"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  className="rounded-none border-neutral-200 focus-visible:ring-black text-[13px] h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-neutral-50 border-t border-neutral-100 flex-row gap-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 sm:flex-none rounded-none border-neutral-200 uppercase tracking-[0.2em] text-[10px] font-bold h-12 px-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none rounded-none bg-black text-white hover:bg-neutral-900 uppercase tracking-[0.2em] text-[10px] font-bold h-12 px-10 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Launch Broadcast"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
