"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LoaderCircle, Plus, Trash2, Save, Pencil, X, Check,
  Truck, Globe, ChevronRight, ArrowLeft, Megaphone, Link, PhoneCall,
  UserPlus, Mail, Clock, ShieldCheck
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface ShippingOption {
  id: string
  name: string
  description: string | null
  price: number | string
  estimatedDays: string | null
  countries: string[]
  freeShippingThreshold: number | string | null
  isActive: boolean
  sortOrder: number
}

const EMPTY_OPTION: Omit<ShippingOption, 'id'> = {
  name: '',
  description: '',
  price: 0,
  estimatedDays: '',
  countries: ['PK'],
  freeShippingThreshold: null,
  isActive: true,
  sortOrder: 0,
}

const COUNTRY_OPTIONS = [
  { value: 'PK', label: '🇵🇰 Pakistan', desc: 'calnza.pk' },
  { value: 'UK', label: '🇬🇧 United Kingdom', desc: 'calnza.co.uk' },
  { value: 'GLOBAL', label: '🌍 Global', desc: 'calnza.com' },
]

// ── Shipping Manager Sub-component ────────────────────────────────────────────
function ShippingOptionsManager({ activeCountry }: { activeCountry: 'pk' | 'uk' }) {
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<ShippingOption>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOption, setNewOption] = useState<Omit<ShippingOption, 'id'>>(EMPTY_OPTION)
  const [saving, setSaving] = useState(false)

  const fetchOptions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shipping-options')
      const data = await res.json()
      if (data.success) setOptions(data.data)
    } catch {
      toast.error('Failed to load shipping options')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOptions() }, [])

  const handleCreate = async () => {
    if (!newOption.name || newOption.countries.length === 0) {
      toast.error('Name and at least one country are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/shipping-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOption,
          price: Number(newOption.price),
          countries: [activeCountry.toUpperCase()],
          sortOrder: 0,
          freeShippingThreshold: newOption.freeShippingThreshold
            ? Number(newOption.freeShippingThreshold)
            : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Shipping option created')
        setNewOption(EMPTY_OPTION)
        setShowAddForm(false)
        fetchOptions()
      } else {
        toast.error(data.error || 'Failed to create')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/shipping-options/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          price: editData.price !== undefined ? Number(editData.price) : undefined,
          freeShippingThreshold: editData.freeShippingThreshold !== undefined
            ? (editData.freeShippingThreshold === '' || editData.freeShippingThreshold === null
              ? null
              : Number(editData.freeShippingThreshold))
            : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Updated successfully')
        setEditingId(null)
        setEditData({})
        fetchOptions()
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shipping option? Orders using it will retain their data.')) return
    try {
      const res = await fetch(`/api/admin/shipping-options/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Deleted')
        fetchOptions()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const startEdit = (opt: ShippingOption) => {
    setEditingId(opt.id)
    setEditData({
      name: opt.name,
      description: opt.description || '',
      price: opt.price,
      estimatedDays: opt.estimatedDays || '',
      countries: [...opt.countries],
      freeShippingThreshold: opt.freeShippingThreshold ?? '',
      isActive: opt.isActive,
      sortOrder: opt.sortOrder,
    })
  }

  const toggleCountry = (
    countries: string[],
    value: string,
    setter: (v: string[]) => void
  ) => {
    if (countries.includes(value)) {
      setter(countries.filter(c => c !== value))
    } else {
      setter([...countries, value])
    }
  }

  const CountryPicker = ({
    selected,
    onChange,
  }: {
    selected: string[]
    onChange: (v: string[]) => void
  }) => (
    <div className="flex flex-wrap gap-2">
      {COUNTRY_OPTIONS.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => toggleCountry(selected, c.value, onChange)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
            ${selected.includes(c.value)
              ? 'bg-black text-white border-black'
              : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
            }`}
        >
          {c.label}
          <span className={`text-[9px] ${selected.includes(c.value) ? 'text-neutral-300' : 'text-neutral-400'}`}>
            {c.desc}
          </span>
        </button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoaderCircle className="w-6 h-6 animate-spin text-neutral-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
            {options.length} option{options.length !== 1 ? 's' : ''} configured
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Options shown at checkout based on the site's country setting
          </p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-5 h-auto shadow-none"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Add Option
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="rounded-none border-black border-2 shadow-none">
          <CardHeader className="border-b border-neutral-100 pb-4">
            <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] flex items-center justify-between">
              <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> New Shipping Option</span>
              <button onClick={() => setShowAddForm(false)} className="text-neutral-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Name *</Label>
                <Input value={newOption.name}
                  onChange={e => setNewOption({ ...newOption, name: e.target.value })}
                  placeholder="e.g. Standard Delivery"
                  className="rounded-none border-neutral-200 text-xs" />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Price *</Label>
                <Input type="number" min={0} step={0.01}
                  value={newOption.price}
                  onChange={e => setNewOption({ ...newOption, price: e.target.value })}
                  placeholder="e.g. 200"
                  className="rounded-none border-neutral-200 text-xs" />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Description</Label>
                <Input value={newOption.description || ''}
                  onChange={e => setNewOption({ ...newOption, description: e.target.value })}
                  placeholder="e.g. 3-5 Business Days"
                  className="rounded-none border-neutral-200 text-xs" />
              </div>

              {/* Estimated Days */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estimated Days</Label>
                <Input value={newOption.estimatedDays || ''}
                  onChange={e => setNewOption({ ...newOption, estimatedDays: e.target.value })}
                  placeholder="e.g. 3-5 days"
                  className="rounded-none border-neutral-200 text-xs" />
              </div>

              {/* Free Shipping Threshold */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Free Shipping Threshold
                  <span className="normal-case text-neutral-300 ml-1">(leave blank to disable)</span>
                </Label>
                <Input type="number" min={0} step={1}
                  value={newOption.freeShippingThreshold ?? ''}
                  onChange={e => setNewOption({
                    ...newOption,
                    freeShippingThreshold: e.target.value === '' ? null : e.target.value
                  })}
                  placeholder="e.g. 3000 (order over this = free)"
                  className="rounded-none border-neutral-200 text-xs" />
              </div>

              {/* Active toggle */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={newOption.isActive}
                    onCheckedChange={v => setNewOption({ ...newOption, isActive: v })}
                    className="data-[state=checked]:bg-black"
                  />
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Active</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-100">
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] px-6 h-10 shadow-none"
              >
                {saving ? <LoaderCircle className="w-3.5 h-3.5 animate-spin mr-2" /> : <Check className="w-3.5 h-3.5 mr-2" />}
                Create Option
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}
                className="rounded-none text-[10px] font-bold uppercase tracking-[0.2em] h-10">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options List */}
      {options.length === 0 ? (
        <div className="border border-dashed border-neutral-200 rounded-none py-16 text-center">
          <Truck className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
          <p className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold">No shipping options yet</p>
          <p className="text-xs text-neutral-300 mt-1">Add your first option to enable checkout</p>
        </div>
      ) : (
        <div className="space-y-3">
          {options.map(opt => (
            <Card key={opt.id} className={`rounded-none shadow-none transition-all ${editingId === opt.id ? 'border-black border-2' : 'border-neutral-100'}`}>
              <CardContent className="p-0">
                {editingId === opt.id ? (
                  /* Edit mode */
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Name *</Label>
                        <Input value={editData.name || ''}
                          onChange={e => setEditData({ ...editData, name: e.target.value })}
                          className="rounded-none border-neutral-200 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Price *</Label>
                        <Input type="number" min={0} step={0.01}
                          value={editData.price ?? ''}
                          onChange={e => setEditData({ ...editData, price: e.target.value })}
                          className="rounded-none border-neutral-200 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Description</Label>
                        <Input value={editData.description || ''}
                          onChange={e => setEditData({ ...editData, description: e.target.value })}
                          className="rounded-none border-neutral-200 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Estimated Days</Label>
                        <Input value={editData.estimatedDays || ''}
                          onChange={e => setEditData({ ...editData, estimatedDays: e.target.value })}
                          className="rounded-none border-neutral-200 text-xs" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Free Shipping Threshold
                        </Label>
                        <Input type="number" min={0}
                          value={editData.freeShippingThreshold ?? ''}
                          onChange={e => setEditData({
                            ...editData,
                            freeShippingThreshold: e.target.value === '' ? null : e.target.value
                          })}
                          placeholder="blank = disabled"
                          className="rounded-none border-neutral-200 text-xs" />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex items-center gap-3 mt-2">
                          <Switch
                            checked={editData.isActive ?? opt.isActive}
                            onCheckedChange={v => setEditData({ ...editData, isActive: v })}
                            className="data-[state=checked]:bg-black"
                          />
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Active</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-neutral-100">
                      <Button onClick={() => handleUpdate(opt.id)} disabled={saving}
                        className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] px-5 h-9 shadow-none">
                        {saving ? <LoaderCircle className="w-3 h-3 animate-spin mr-2" /> : <Check className="w-3 h-3 mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingId(null); setEditData({}) }}
                        className="rounded-none text-[10px] font-bold uppercase tracking-[0.2em] h-9">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-900">{opt.name}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full
                          ${opt.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-neutral-100 text-neutral-400'}`}>
                          {opt.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {opt.description && (
                        <p className="text-xs text-neutral-500">{opt.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-bold text-black">
                          {Number(opt.price) === 0 ? 'Free' : `${Number(opt.price).toLocaleString()}`}
                        </span>
                        {opt.freeShippingThreshold !== null && opt.freeShippingThreshold !== undefined && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                            Free over {Number(opt.freeShippingThreshold).toLocaleString()}
                          </span>
                        )}
                        {opt.estimatedDays && (
                          <span className="text-[10px] text-neutral-400">{opt.estimatedDays}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {opt.countries.map(c => {
                          const co = COUNTRY_OPTIONS.find(o => o.value === c)
                          return (
                            <span key={c} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                              {co?.label || c}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => startEdit(opt)}
                        className="rounded-none h-8 px-3 text-[10px] font-bold uppercase tracking-widest shadow-none">
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(opt.id)}
                        className="rounded-none h-8 px-3 text-[10px] text-neutral-300 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeCountry, setActiveCountry] = useState<'pk' | 'uk'>('pk')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState<string | null>(null)

  const fetchSettings = async (countryCode = activeCountry) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/settings?country=${countryCode}`)
      const data = await res.json()
      if (data.success) {
        let payload = data.data || {}
        // Safe migration fallback: if announcementBars list is empty/null in database settings,
        // import the old hardcoded announcementText into it as the first dynamic row.
        if (!payload.announcementBars || !Array.isArray(payload.announcementBars) || payload.announcementBars.length === 0) {
          payload = {
            ...payload,
            announcementBars: [
              {
                id: 'default-legacy',
                text: payload.announcementText || 'Free delivery on orders over PKR 3,000 | New arrivals every Friday',
                target: 'both',
                isActive: true
              }
            ]
          }
        }
        setSettings(payload)
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings(activeCountry)
  }, [activeCountry])

  const handleAddAnnouncement = () => {
    const currentBars = settings.announcementBars || []
    const newBar = {
      id: `bar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      target: 'both' as const,
      isActive: true
    }
    setSettings({
      ...settings,
      announcementBars: [...currentBars, newBar]
    })
  }

  const handleRemoveAnnouncement = (id: string) => {
    const currentBars = settings.announcementBars || []
    if (currentBars.length <= 1) {
      toast.error('At least one ticker message is required.')
      return
    }
    setSettings({
      ...settings,
      announcementBars: currentBars.filter((bar: any) => bar.id !== id)
    })
  }

  const handleUpdateAnnouncementText = (id: string, text: string) => {
    const currentBars = settings.announcementBars || []
    const updated = currentBars.map((bar: any) =>
      bar.id === id ? { ...bar, text } : bar
    )
    setSettings({ ...settings, announcementBars: updated })
  }

  const handleUpdateAnnouncementTarget = (id: string, target: 'pakistan' | 'uk' | 'both') => {
    const currentBars = settings.announcementBars || []
    const updated = currentBars.map((bar: any) =>
      bar.id === id ? { ...bar, target } : bar
    )
    setSettings({ ...settings, announcementBars: updated })
  }

  const handleUpdateAnnouncementActive = (id: string, isActive: boolean) => {
    const currentBars = settings.announcementBars || []
    const updated = currentBars.map((bar: any) =>
      bar.id === id ? { ...bar, isActive } : bar
    )
    setSettings({ ...settings, announcementBars: updated })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/settings?country=${activeCountry}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (data.success) toast.success('Settings saved successfully')
      else toast.error(data.error || 'Failed to update settings')
    } catch {
      toast.error('An error occurred while saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLink = (section: string) => {
    const updatedLinks = { ...settings.footerLinks }
    if (!updatedLinks[section]) updatedLinks[section] = []
    updatedLinks[section].push({ label: '', href: '' })
    setSettings({ ...settings, footerLinks: updatedLinks })
  }

  const handleRemoveLink = (section: string, index: number) => {
    const updatedLinks = { ...settings.footerLinks }
    updatedLinks[section].splice(index, 1)
    setSettings({ ...settings, footerLinks: updatedLinks })
  }

  const handleLinkChange = (section: string, index: number, field: string, value: string) => {
    const updatedLinks = { ...settings.footerLinks }
    updatedLinks[section][index][field] = value
    setSettings({ ...settings, footerLinks: updatedLinks })
  }

  const SECTIONS = [
    {
      id: 'announcement',
      title: 'Announcement Bar Settings',
      description: 'Manage notification banners, social proof tickers, rotation delays, and country targeting.',
      icon: Megaphone,
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    },
    {
      id: 'footer',
      title: 'Footer Content & Navigation',
      description: 'Update footer brand headers, stories, sustainability descriptions, and customizable footer columns.',
      icon: Link,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
    },
    {
      id: 'contact',
      title: 'Contact Info & Address',
      description: 'Manage customer service email addresses, WhatsApp helpdesk numbers, and regional studio locations.',
      icon: PhoneCall,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      id: 'shipping',
      title: 'Shipping Options & Tiers',
      description: 'Configure standard or express carrier options, pricing tiers, and checkout options.',
      icon: Truck,
      color: 'text-blue-600 bg-blue-50 border-blue-100'
    },
    {
      id: 'admin-invites',
      title: 'Admin Invites',
      description: 'Invite team members to access the admin dashboard. Each invite link expires in 48 hours.',
      icon: UserPlus,
      color: 'text-violet-600 bg-violet-50 border-violet-100'
    }
  ]

  const activeSectionObj = SECTIONS.find(s => s.id === currentSection)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderCircle className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-200 pb-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 font-serif flex items-center gap-2">
            <span>Store Settings</span>
            {activeSectionObj && (
              <>
                <span className="text-neutral-300 font-sans font-light text-xl">/</span>
                <span className="text-neutral-500 text-xl font-sans uppercase font-bold tracking-widest mt-1">
                  {activeSectionObj.title.split(' ')[0]}
                </span>
              </>
            )}
          </h1>
          <p className="text-sm text-neutral-500">
            {activeSectionObj 
              ? `Configure and fine-tune ${activeCountry === 'pk' ? '🇵🇰 Pakistan' : '🇬🇧 United Kingdom'} storefront ${activeSectionObj.title.toLowerCase()}.`
              : 'Manage storefront configurations per country domain. Changes only apply to the selected country tab.'}
          </p>
          {/* Country Tab Switcher */}
          <div className="flex items-center border border-neutral-200 rounded-none p-0.5 w-fit bg-neutral-50">
            <button
              onClick={() => { setActiveCountry('pk'); setCurrentSection(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeCountry === 'pk'
                  ? 'bg-white text-black shadow-sm border border-neutral-200'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span>🇵🇰</span> Pakistan (.pk)
            </button>
            <button
              onClick={() => { setActiveCountry('uk'); setCurrentSection(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeCountry === 'uk'
                  ? 'bg-white text-black shadow-sm border border-neutral-200'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <span>🇬🇧</span> United Kingdom (.co.uk)
            </button>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-6 h-auto self-start shadow-none"
        >
          {saving ? <LoaderCircle className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save {activeCountry.toUpperCase()} Settings
        </Button>
      </div>

      {currentSection === null ? (
        /* Settings Overview Dashboard List of Headings */
        <div className="max-w-3xl mx-auto py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="group/list flex flex-col gap-3.5">
            {SECTIONS.map(sec => {
              const Icon = sec.icon
              return (
                <button
                  key={sec.id}
                  onClick={() => setCurrentSection(sec.id)}
                  className="w-full flex items-center justify-between p-5 border border-neutral-200/80 bg-white shadow-none transition-all duration-300 hover:border-black hover:shadow-[0_6px_24px_rgba(0,0,0,0.02)] hover:translate-x-1 hover:opacity-100 group-hover/list:opacity-40 text-left group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 border rounded-none flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-black group-hover:text-white group-hover:border-black ${sec.color}`}>
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110 duration-300" />
                    </div>
                    <div>
                      <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-900 group-hover:text-black transition-colors font-sans">
                        {sec.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-sans italic font-light mt-1.5 max-w-xl leading-relaxed transition-colors group-hover:text-neutral-500">
                        {sec.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* Sub Settings Page Form Container */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => setCurrentSection(null)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to settings list
          </button>

          {currentSection === 'announcement' && (
            <Card className="rounded-none border-neutral-200 bg-white shadow-none animate-in fade-in duration-300">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em]">Announcement Bar Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Show Announcement Bar Switch */}
                <div className="flex items-center justify-between p-4 border border-neutral-200 bg-neutral-50">
                  <div>
                    <Label htmlFor="showAnnouncement" className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 block mb-0.5">
                      Show Announcement Bar
                    </Label>
                    <span className="text-[10px] text-neutral-400 font-sans">
                      Enable or disable globally.
                    </span>
                  </div>
                  <Switch
                    id="showAnnouncement"
                    checked={settings.showAnnouncement}
                    onCheckedChange={v => setSettings({ ...settings, showAnnouncement: v })}
                    className="data-[state=checked]:bg-black"
                  />
                </div>

                {/* Dynamic Ticker Messages CRUD Container */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-900">
                      Announcement Messages Loop
                    </h3>
                    <span className="text-[9px] font-bold text-neutral-400 tracking-wider">
                      {(settings.announcementBars || []).length} MESSAGE(S)
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(settings.announcementBars || []).map((bar: any, idx: number) => (
                      <div key={bar.id} className="p-4 border border-neutral-200 bg-white relative transition-all hover:border-neutral-300">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Ticker Message #{idx + 1}
                          </span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${bar.id}`} className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                                Active
                              </Label>
                              <Switch
                                id={`active-${bar.id}`}
                                checked={bar.isActive}
                                onCheckedChange={v => handleUpdateAnnouncementActive(bar.id, v)}
                                className="scale-75 data-[state=checked]:bg-black"
                              />
                            </div>
                            {(settings.announcementBars || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAnnouncement(bar.id)}
                                className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                                title="Delete announcement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Message Content</Label>
                            <Input
                              value={bar.text}
                              onChange={e => handleUpdateAnnouncementText(bar.id, e.target.value)}
                              placeholder="Enter promotional banner message..."
                              className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Target Region / Domain</Label>
                            <select
                              value={bar.target}
                              onChange={e => handleUpdateAnnouncementTarget(bar.id, e.target.value as any)}
                              className="w-full bg-white border border-neutral-200 text-xs px-3 py-2 rounded-none focus:outline-none focus:border-black font-sans uppercase font-bold tracking-wider"
                            >
                              <option value="both">🌍 Both / All Frontends</option>
                              <option value="pakistan">🇵🇰 Pakistan (.pk)</option>
                              <option value="uk">🇬🇧 UK & Global (.co.uk / .com)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddAnnouncement}
                    className="w-full rounded-none border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 text-neutral-600 shadow-none text-xs flex items-center justify-center gap-2 py-6 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ticker Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentSection === 'footer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-none border-neutral-200 bg-white shadow-none">
                <CardHeader className="border-b border-neutral-100 pb-4">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em]">Footer Branding</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Brand Title</Label>
                    <Input value={settings.footerTitle}
                      onChange={e => setSettings({ ...settings, footerTitle: e.target.value })}
                      className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Brand Description</Label>
                    <Textarea value={settings.footerDescription}
                      onChange={e => setSettings({ ...settings, footerDescription: e.target.value })}
                      className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black min-h-[120px] resize-none" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-neutral-200 bg-white shadow-none">
                <CardHeader className="border-b border-neutral-100 pb-4">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em]">Footer Navigation</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-8 max-h-[600px] overflow-y-auto">
                  {['about', 'categories', 'help'].map(section => (
                    <div key={section} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">{section}</h4>
                        <Button variant="outline" size="sm" onClick={() => handleAddLink(section)}
                          className="rounded-none h-7 px-3 text-[9px] font-bold uppercase tracking-widest shadow-none">
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {settings.footerLinks[section]?.map((link: any, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <Input placeholder="Label" value={link.label}
                              onChange={e => handleLinkChange(section, idx, 'label', e.target.value)}
                              className="rounded-none border-neutral-200 text-[10px] h-8 flex-[2]" />
                            <Input placeholder="Href" value={link.href}
                              onChange={e => handleLinkChange(section, idx, 'href', e.target.value)}
                              className="rounded-none border-neutral-200 text-[10px] h-8 flex-[3]" />
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveLink(section, idx)}
                              className="h-8 w-8 text-neutral-300 hover:text-red-500 animate-in fade-in">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        {(!settings.footerLinks[section] || settings.footerLinks[section].length === 0) && (
                          <p className="text-[10px] text-neutral-300 italic text-center py-4">No links.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-none border-neutral-200 bg-white shadow-none animate-in fade-in duration-300">
                <CardHeader className="border-b border-neutral-100 pb-4">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em]">Contact Information</CardTitle>
                  <p className="text-[10px] text-neutral-400 italic">
                    {activeCountry === 'pk' ? '🇵🇰 Pakistan (.pk) settings' : '🇬🇧 United Kingdom (.co.uk) settings'}
                  </p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Support Email</Label>
                    <Input type="email" value={settings.contactEmail || ''}
                      onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder="concierge@calnza.pk"
                      className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">WhatsApp Number</Label>
                    <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                      Used on all WhatsApp buttons: PDP &ldquo;Order via WhatsApp&rdquo;, Cart, Order history enquiries, transactional emails. Format: international digits only (e.g. <code className="bg-neutral-100 px-1">923001234567</code>)
                    </p>
                    <Input type="tel" value={settings.whatsappNumber || ''}
                      onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      placeholder="923001234567"
                      className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Contact Page Phone Display</Label>
                    <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                      Displayed on the Contact page and footer only. Can include spaces, +, dashes (e.g. <code className="bg-neutral-100 px-1">+92 300 123 4567</code>)
                    </p>
                    <Input type="tel" value={settings.contactPhone || ''}
                      onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                      placeholder="+92 300 123 4567"
                      className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Studio / Office Address</Label>
                    <Textarea value={settings.contactAddress || ''}
                      onChange={e => setSettings({ ...settings, contactAddress: e.target.value })}
                      placeholder={activeCountry === 'uk' ? 'London, United Kingdom' : 'DHA Phase 6, Lahore, Pakistan'}
                      className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black min-h-[80px] resize-none" />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-neutral-200 bg-white shadow-none animate-in fade-in duration-300">
                <CardHeader className="border-b border-neutral-100 pb-4">
                  <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em]">Social Media</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {[
                    { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/calnza' },
                    { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/calnza' },
                  ].map(s => (
                    <div key={s.key} className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{s.label}</Label>
                      <Input value={(settings.socialLinks || {})[s.key] || ''}
                        onChange={e => setSettings({
                          ...settings,
                          socialLinks: { ...(settings.socialLinks || {}), [s.key]: e.target.value },
                        })}
                        placeholder={s.placeholder}
                        className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black" />
                    </div>
                  ))}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 text-[10px] text-neutral-500">
                    <p className="font-bold uppercase tracking-widest mb-1">WhatsApp Social Link</p>
                    <p className="italic">The WhatsApp social icon in the footer uses the <strong>WhatsApp Number</strong> field above. Set it in Contact Information.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentSection === 'shipping' && (
            <Card className="rounded-none border-neutral-200 bg-white shadow-none animate-in fade-in duration-300">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Shipping Options
                </CardTitle>
                <CardDescription className="text-xs">
                  These options appear at checkout. Use country tags to control which site shows each option.
                  Free shipping threshold: if order subtotal exceeds this value, that option becomes free.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ShippingOptionsManager activeCountry={activeCountry} />
              </CardContent>
            </Card>
          )}

          {currentSection === 'admin-invites' && (
            <AdminInvitesPanel />
          )}
        </div>
      )}
    </div>
  )
}

// ── Admin Invites Panel ───────────────────────────────────────────────────────
function AdminInvitesPanel() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [invites, setInvites] = useState<any[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)

  const fetchInvites = async () => {
    setLoadingInvites(true)
    try {
      const res = await fetch('/api/admin/invites')
      const data = await res.json()
      if (data.invites) setInvites(data.invites)
    } catch {
      // silently fail
    } finally {
      setLoadingInvites(false)
    }
  }

  useEffect(() => { fetchInvites() }, [])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Invite sent to ${email}`)
        setEmail('')
        fetchInvites()
      } else {
        toast.error(data.error || 'Failed to send invite')
      }
    } catch {
      toast.error('Network error — try again')
    } finally {
      setSending(false)
    }
  }

  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    const hours = Math.floor(diff / 3600000)
    const mins  = Math.floor((diff % 3600000) / 60000)
    if (hours > 0) return `Expires in ${hours}h ${mins}m`
    if (mins > 0)  return `Expires in ${mins}m`
    return 'Expiring soon'
  }

  return (
    <Card className="rounded-none border-neutral-200 bg-white shadow-none animate-in fade-in duration-300">
      <CardHeader className="border-b border-neutral-100 pb-4">
        <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Admin Invites
        </CardTitle>
        <CardDescription className="text-xs">
          Send an invite link to a team member's email. They will receive a direct message box
          with a link to set their password and activate their admin account. Invites expire in 48 hours.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-8">
        {/* Send Invite Form */}
        <form onSubmit={handleSendInvite} className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">
            Invite by Email
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <Input
                type="email"
                required
                placeholder="team@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-none border-neutral-200 text-xs pl-10 h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={sending || !email.trim()}
              className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] px-6 h-11 shadow-none shrink-0"
            >
              {sending
                ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                : <><UserPlus className="w-3.5 h-3.5 mr-2" /> Send Invite</>
              }
            </Button>
          </div>
          <p className="text-[10px] text-neutral-400">
            An email will be sent with a secure link. The invite expires in 48 hours.
            If the person doesn't have an account, one will be created for them as an Admin.
          </p>
        </form>

        {/* Pending Invites List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
              Pending Invites
            </h3>
            <button
              onClick={fetchInvites}
              className="text-[9px] text-neutral-400 hover:text-black uppercase tracking-widest font-bold transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingInvites ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="w-5 h-5 animate-spin text-neutral-300" />
            </div>
          ) : invites.length === 0 ? (
            <div className="border border-dashed border-neutral-200 py-10 text-center">
              <ShieldCheck className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold">No pending invites</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invites.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-4 border border-neutral-100 bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-neutral-900">{inv.email}</p>
                      <p className="text-[10px] text-neutral-400">
                        Invited by <span className="font-medium">{inv.invitedBy}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                      <Clock className="w-3 h-3" />
                      {formatExpiry(inv.expiresAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

