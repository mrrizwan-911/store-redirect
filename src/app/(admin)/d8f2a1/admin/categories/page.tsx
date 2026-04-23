"use client"

import { useState, useEffect, useMemo } from "react"
import {
  LockKeyhole,
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  FolderTree,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  isProtected: boolean
  children?: Category[]
  _count?: {
    products: number
  }
}

export default function AdminCategoriesPage() {
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add-root' | 'add-sub' | 'edit'>('add-root')
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  })

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      if (data.success) {
        setAllCategories(data.data)
      } else {
        toast.error(data.error || "Failed to fetch categories")
      }
    } catch (error) {
      toast.error("An error occurred while fetching categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const roots = useMemo(() => allCategories.filter(c => !c.parentId), [allCategories])

  const subcategories = useMemo(() => {
    if (!selectedRootId) return []
    const root = allCategories.find(c => c.id === selectedRootId)
    return root?.children || []
  }, [allCategories, selectedRootId])

  const selectedRoot = useMemo(() =>
    roots.find(r => r.id === selectedRootId),
    [roots, selectedRootId]
  )

  const computedSlug = useMemo(() => {
    return formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }, [formData.name])

  const handleToggleActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`)
        fetchCategories()
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Category deleted")
        if (selectedRootId === category.id) setSelectedRootId(null)
        fetchCategories()
      } else {
        toast.error(data.error || "Failed to delete category")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const openModal = (mode: 'add-root' | 'add-sub' | 'edit', target: Category | null = null) => {
    setModalMode(mode)
    setEditTarget(target)
    if (mode === 'edit' && target) {
      setFormData({
        name: target.name,
        description: target.description || "",
        sortOrder: target.sortOrder,
        isActive: target.isActive,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        sortOrder: 0,
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = modalMode === 'edit'
        ? `/api/admin/categories/${editTarget?.id}`
        : "/api/admin/categories"

      const method = modalMode === 'edit' ? "PATCH" : "POST"

      const payload: any = {
        name: formData.name,
        description: formData.description,
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive,
      }

      if (modalMode === 'add-sub' && selectedRootId) {
        payload.parentId = selectedRootId
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(modalMode === 'edit' ? "Category updated" : "Category created")
        setIsModalOpen(false)
        fetchCategories()
      } else {
        toast.error(data.error || "Failed to save category")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-playfair text-3xl font-bold text-[#000000]">Category Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Panel - Roots */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-playfair">Root Categories</h2>
            <Button
              size="sm"
              variant="outline"
              className="border-black hover:bg-black hover:text-white"
              onClick={() => openModal('add-root')}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Root
            </Button>
          </div>

          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-none">
            {roots.map((root) => (
              <div
                key={root.id}
                onClick={() => setSelectedRootId(root.id)}
                className={`flex items-center justify-between p-4 cursor-pointer transition-all border-b border-[#E5E5E5] last:border-0 hover:bg-white ${
                  selectedRootId === root.id
                    ? 'bg-white border-l-2 border-l-black font-medium'
                    : 'border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {root.isProtected ? (
                    <LockKeyhole className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  ) : (
                    <div className="w-3.5" />
                  )}
                  <span className="truncate">{root.name}</span>
                  <Badge variant="secondary" className="bg-neutral-100 text-[10px] py-0 px-1.5 h-4">
                    {root._count?.products || 0}
                  </Badge>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={root.isActive}
                    onCheckedChange={() => handleToggleActive(root)}
                    className="scale-75"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-black"
                    onClick={() => openModal('edit', root)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!root.isProtected && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-400 hover:text-red-600"
                      onClick={() => handleDelete(root)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {roots.length === 0 && (
              <div className="p-8 text-center text-neutral-500 text-sm">
                No root categories found.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Subcategories */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {selectedRootId ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-playfair flex items-center gap-2">
                  <span className="text-neutral-400">{selectedRoot?.name}</span>
                  <ChevronRight className="h-4 w-4 text-neutral-300" />
                  Subcategories
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-black hover:bg-black hover:text-white"
                  onClick={() => openModal('add-sub')}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Subcategory
                </Button>
              </div>

              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider font-bold text-neutral-500">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-bold text-neutral-500">Slug</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-bold text-neutral-500 text-center">Products</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-bold text-neutral-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcategories.map((sub) => (
                      <TableRow key={sub.id} className="bg-white hover:bg-neutral-50 border-b border-[#E5E5E5] last:border-0">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#000000]">{sub.name}</span>
                            {!sub.isActive && (
                              <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-neutral-300 text-neutral-400">Inactive</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-xs text-neutral-500 font-mono">{sub.slug}</TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-sm">{sub._count?.products || 0}</span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Switch
                              checked={sub.isActive}
                              onCheckedChange={() => handleToggleActive(sub)}
                              className="scale-75 mr-2"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neutral-400 hover:text-black"
                              onClick={() => openModal('edit', sub)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neutral-400 hover:text-red-600"
                              onClick={() => handleDelete(sub)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {subcategories.length === 0 && (
                  <div className="p-12 text-center text-neutral-500 flex flex-col items-center gap-3">
                    <FolderTree className="h-10 w-10 text-neutral-200" />
                    <p className="text-sm">No subcategories yet. Add the first one.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 p-8 text-center bg-neutral-50/50">
              <ChevronRight className="h-8 w-8 rotate-180 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a root category to view and manage subcategories</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-none border-black">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl font-bold">
              {modalMode === 'edit' ? 'Edit Category' : modalMode === 'add-root' ? 'Add Root Category' : 'Add Subcategory'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tops, Sneakers, Accessories"
                className="rounded-none border-neutral-300 focus:border-black transition-all"
                disabled={editTarget?.isProtected && modalMode === 'edit'}
                required
              />
              {editTarget?.isProtected && modalMode === 'edit' ? (
                <p className="text-[10px] text-neutral-500 font-medium italic">Protected — cannot rename</p>
              ) : (
                <p className="text-[10px] text-neutral-500 font-medium">
                  Slug preview: <span className="font-mono text-black">{computedSlug || "..."}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs uppercase tracking-widest font-bold">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="rounded-none border-neutral-300 focus:border-black min-h-[100px] resize-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-xs uppercase tracking-widest font-bold">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  className="rounded-none border-neutral-300 focus:border-black transition-all"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="text-xs uppercase tracking-widest font-bold cursor-pointer">Active</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-none border-neutral-300 hover:bg-neutral-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-none bg-black text-white hover:bg-[#262626] transition-all min-w-[100px]"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  modalMode === 'edit' ? 'Update' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
