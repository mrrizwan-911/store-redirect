'use client'

import { useEffect, useState } from 'react'
import { SITE_COUNTRY } from '@/lib/constants/site'

const ROTATION_INTERVAL_MS = 4000

export function AnnouncementBar() {
  const [settings, setSettings]     = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [messageIndex, setMessageIndex] = useState(0)
  const [allMessages, setAllMessages]   = useState<string[]>([])

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res  = await fetch('/api/settings')
        const data = await res.json()
        if (data.success) setSettings(data.data)
      } catch (error) {
        console.error('Failed to fetch announcement settings', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // Build the full rotation list once settings are loaded
  useEffect(() => {
    if (!settings) return

    // If global toggle is off, no messages should be shown (collapsing the bar cleanly)
    if (!settings.showAnnouncement) {
      setAllMessages([])
      return
    }

    const msgs: string[] = []
    const bars = settings.announcementBars

    // Fallback to legacy single text if no bars JSON array is present
    if (!Array.isArray(bars) || bars.length === 0) {
      if (settings.announcementText) {
        // Split by '|' to support multiple rotating legacy messages
        const splitText = settings.announcementText.split('|').map((t: string) => t.trim()).filter(Boolean)
        msgs.push(...splitText)
      }
    } else {
      // Process active and target-domain filtered dynamic tickers
      const activeRegion = SITE_COUNTRY // 'PK' | 'UK' | 'GLOBAL'

      bars.forEach((bar: any) => {
        if (!bar.isActive || !bar.text) return

        // Target domain country filtering
        let isTargeted = false
        if (bar.target === 'both') {
          isTargeted = true
        } else if (bar.target === 'pakistan' && activeRegion === 'PK') {
          isTargeted = true
        } else if (bar.target === 'uk' && (activeRegion === 'UK' || activeRegion === 'GLOBAL')) {
          isTargeted = true
        }

        if (isTargeted) {
          // Support inner | splits if admin formats text with pipes inside a ticker block
          if (bar.text.includes('|')) {
            const splitText = bar.text.split('|').map((t: string) => t.trim()).filter(Boolean)
            msgs.push(...splitText)
          } else {
            msgs.push(bar.text.trim())
          }
        }
      })
    }

    setAllMessages(msgs)
    setMessageIndex(0) // Reset rotation index when active list changes
  }, [settings])

  // Rotate messages
  useEffect(() => {
    if (allMessages.length <= 1) return
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % allMessages.length)
    }, ROTATION_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [allMessages])

  if (loading || !settings) return null

  // If globally disabled or filter resolved to no active announcements, hide completely
  if (!settings.showAnnouncement || allMessages.length === 0) return null

  const currentMessage = allMessages[messageIndex]
  if (!currentMessage) return null

  return (
    <div className="bg-black text-white text-center py-2 px-4 text-[10px] md:text-xs tracking-[0.15em] font-sans font-medium uppercase overflow-hidden min-h-[32px] flex items-center justify-center transition-all duration-300">
      <span
        key={`${messageIndex}-${currentMessage}`}
        className="inline-block animate-in fade-in slide-in-from-bottom-2 duration-700"
      >
        {currentMessage}
      </span>
    </div>
  )
}
