'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SizeGuide {
  id: string
  title: string
  content: string
  categoryId: string | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  updatedAt: string
}

export default function SizeGuidesPage() {
  const router = useRouter()
  const [guides, setGuides] = useState<SizeGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const fetchGuides = async () => {
    try {
      const res = await fetch('/api/admin/size-guides')
      const data = await res.json()
      if (data.success) {
        setGuides(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch size guides')
      }
    } catch (error) {
      toast.error('An error occurred while fetching size guides')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuides()
  }, [])

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      const res = await fetch('/api/admin/size-guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Guide', content: '' }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/d8f2a1/admin/size-guides/${data.data.id}`)
      } else {
        toast.error(data.error || 'Failed to create size guide')
      }
    } catch (error) {
      toast.error('An error occurred while creating size guide')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      const res = await fetch(`/api/admin/size-guides/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Size guide deleted')
        fetchGuides()
      } else {
        toast.error(data.error || 'Failed to delete size guide')
      }
    } catch (error) {
      toast.error('An error occurred while deleting')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          <h1 className="font-playfair text-3xl font-bold text-[#000000]">Size Guides</h1>
        </div>
        <Button
          onClick={handleAdd}
          disabled={isAdding}
          className="bg-black text-white hover:bg-neutral-800 rounded-none h-10 px-6 flex items-center gap-2 transition-all"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Size Guide
        </Button>
      </div>

      <div className="space-y-4">
        {guides.map((guide) => (
          <Card key={guide.id} className="rounded-none border-[#E5E5E5] hover:border-black transition-all bg-white group">
            <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-bold text-black">{guide.title}</CardTitle>
                  {guide.category && (
                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-600 rounded-none text-[10px] uppercase font-bold tracking-widest border-none">
                      {guide.category.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-500 line-clamp-1 max-w-2xl">
                  {guide.content || 'No content yet. Click edit to add measurement charts.'}
                  {guide.content.length > 120 ? '...' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-neutral-400 hover:text-black transition-colors"
                  onClick={() => router.push(`/d8f2a1/admin/size-guides/${guide.id}`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-neutral-400 hover:text-red-600 transition-colors"
                  onClick={() => handleDelete(guide.id, guide.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}

        {guides.length === 0 && (
          <div className="text-center py-20 bg-neutral-50 border border-dashed border-neutral-200">
            <BookOpen className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">No size guides yet.</p>
            <Button
              variant="link"
              onClick={handleAdd}
              className="mt-2 text-black font-bold uppercase text-xs tracking-widest"
            >
              Create your first guide
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
