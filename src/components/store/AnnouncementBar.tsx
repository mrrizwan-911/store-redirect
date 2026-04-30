'use client'

import { useEffect, useState } from 'react'

export function AnnouncementBar() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.success) {
          setSettings(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch announcement settings', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  if (loading || !settings || !settings.showAnnouncement || !settings.announcementText) {
    return null
  }

  return (
    <div className="bg-black text-white text-center py-2 px-4 text-xs md:text-sm tracking-[0.1em] font-sans font-medium uppercase">
      {settings.announcementText}
    </div>
  )
}
