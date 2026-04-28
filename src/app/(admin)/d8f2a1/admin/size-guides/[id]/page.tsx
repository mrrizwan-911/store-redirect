'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Loader2, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { debounce } from 'lodash'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Category {
  id: string
  name: string
  slug: string
}

interface SizeGuide {
  id: string
  title: string
  content: string
  categoryId: string | null
}

export default function SizeGuideEditorPage() {
  const router = useRouter()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const initialLoadRef = useRef(true)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guideRes, catRes] = await Promise.all([
          fetch(`/api/admin/size-guides/${id}`),
          fetch('/api/admin/categories')
        ])

        const guideData = await guideRes.json()
        const catData = await catRes.json()

        if (guideData.success) {
          setTitle(guideData.data.title)
          setContent(guideData.data.content)
          setCategoryId(guideData.data.categoryId)
        } else {
          toast.error('Failed to load size guide')
          router.push('/d8f2a1/admin/size-guides')
        }

        if (catRes.ok) {
          // Flatten categories if they are nested
          const flatCategories: Category[] = []
          const flatten = (cats: any[]) => {
            cats.forEach(c => {
              flatCategories.push({ id: c.id, name: c.name, slug: c.slug })
              if (c.children && c.children.length > 0) flatten(c.children)
            })
          }
          flatten(catData.data || [])
          setCategories(flatCategories)
        }
      } catch (error) {
        toast.error('Error loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  // Save function
  const save = async (data: { title?: string, content?: string, categoryId?: string | null }) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/size-guides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } else {
        toast.error(result.error || 'Failed to save. Try again.')
      }
    } catch (error) {
      toast.error('Connection error while saving')
    } finally {
      setIsSaving(false)
    }
  }

  // Debounced save for title/category
  const debouncedSaveTitleCat = useCallback(
    debounce((data: { title?: string, categoryId?: string | null }) => save(data), 1500),
    [id]
  )

  // Debounced save for content
  const debouncedSaveContent = useCallback(
    debounce((data: { content: string }) => save(data), 2000),
    [id]
  )

  // Track changes and trigger auto-save
  useEffect(() => {
    if (loading || initialLoadRef.current) {
      if (!loading) initialLoadRef.current = false
      return
    }

    setHasUnsavedChanges(true)
    debouncedSaveTitleCat({ title, categoryId })
  }, [title, categoryId, loading, debouncedSaveTitleCat])

  useEffect(() => {
    if (loading || initialLoadRef.current) return

    setHasUnsavedChanges(true)
    debouncedSaveContent({ content })
  }, [content, loading, debouncedSaveContent])

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const timeSinceLastSave = () => {
    if (!lastSaved) return null
    const diff = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff} seconds ago`
    return `${Math.floor(diff / 60)} minutes ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Header / Breadcrumbs */}
      <div className="px-8 py-4 border-b border-neutral-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/d8f2a1/admin/size-guides"
            className="p-2 hover:bg-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <nav className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
            <Link href="/d8f2a1/admin/size-guides" className="text-neutral-400 hover:text-black">Size Guides</Link>
            <span className="text-neutral-200">/</span>
            <span className="text-black">{title || 'New Guide'}</span>
          </nav>
        </div>
      </div>

      {/* Editor Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Guide title..."
            className="w-full text-4xl font-serif font-bold text-black placeholder:text-neutral-200 border-none focus:ring-0 p-0"
          />

          <div className="flex items-center gap-4 pt-2">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Linked Category</Label>
            <Select
              value={categoryId || 'none'}
              onValueChange={(val) => setCategoryId(val === 'none' ? null : val)}
            >
              <SelectTrigger className="w-[240px] h-9 rounded-lg border-neutral-100 bg-neutral-50/50 focus:ring-0 focus:border-neutral-200 text-xs">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-100 shadow-lg">
                <SelectItem value="none" className="text-xs">No category linked</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-px bg-neutral-50" />

        <div className="relative flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or type your size guide content here. Include measurements, conversion charts, fit notes, or any information users might ask about sizing..."
            className="w-full min-h-[50vh] h-full font-sans text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-200 border-none focus:ring-0 p-0 resize-none bg-transparent"
          />
        </div>
      </div>

      {/* Footer Bar */}
      <div className="px-8 py-4 border-t border-neutral-100 bg-white flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          {hasUnsavedChanges ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600">Unsaved changes</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Saved {timeSinceLastSave()}</span>
            </div>
          ) : (
            <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-300">Not saved yet</span>
          )}

          {isSaving && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">Saving...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/d8f2a1/admin/size-guides')}
            className="text-[10px] uppercase tracking-widest font-bold rounded-lg h-9 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={() => save({ title, content, categoryId })}
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg h-9 px-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Save Now
          </Button>
        </div>
      </div>
    </div>
  )
}
