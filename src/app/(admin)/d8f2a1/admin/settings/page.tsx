"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoaderCircle, Plus, Trash2, Save } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
      } else {
        toast.error(data.error || "Failed to fetch settings")
      }
    } catch (error) {
      toast.error("An error occurred while fetching settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Settings updated successfully")
      } else {
        toast.error(data.error || "Failed to update settings")
      }
    } catch (error) {
      toast.error("An error occurred while saving settings")
    } finally {
      setSaving(false)
    }
  }

  const handleAddLink = (section: string) => {
    const updatedLinks = { ...settings.footerLinks }
    if (!updatedLinks[section]) updatedLinks[section] = []
    updatedLinks[section].push({ label: "", href: "" })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderCircle className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 font-serif">Store Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage global storefront configurations and brand identity.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-none bg-black text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-6 h-auto"
        >
          {saving ? <LoaderCircle className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="announcement" className="w-full">
        <TabsList className="bg-transparent border-b border-neutral-200 w-full justify-start rounded-none h-auto p-0 gap-8">
          <TabsTrigger value="announcement" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all">Announcement Bar</TabsTrigger>
          <TabsTrigger value="footer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all">Footer Content</TabsTrigger>
          <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all">Contact & Social</TabsTrigger>
        </TabsList>

        <TabsContent value="announcement" className="mt-8 space-y-6">
          <Card className="rounded-none border-neutral-200 bg-white shadow-none">
            <CardHeader className="border-b border-neutral-100 pb-4">
              <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Announcement Bar Visibility</CardTitle>
              <CardDescription className="text-xs">Control the visibility and content of the top-most header bar.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between p-4 border border-neutral-100 bg-neutral-50/30">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-neutral-800">Display Announcement Bar</Label>
                  <p className="text-[10px] text-neutral-400">Enable or disable the news line globally across the store.</p>
                </div>
                <Switch
                  checked={settings.showAnnouncement}
                  onCheckedChange={(checked) => setSettings({ ...settings, showAnnouncement: checked })}
                  className="data-[state=checked]:bg-black"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="announcement-text" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Announcement Text</Label>
                <Textarea
                  id="announcement-text"
                  value={settings.announcementText}
                  onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                  className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black min-h-[100px] resize-none"
                  placeholder="Enter news text (e.g. Free delivery on orders over PKR 3,000)"
                />
                <p className="text-[10px] text-neutral-400">Use '|' to separate multiple announcements.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Footer Branding */}
            <Card className="rounded-none border-neutral-200 bg-white shadow-none">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Footer Branding</CardTitle>
                <CardDescription className="text-xs">Manage your brand presence in the footer.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="footer-title" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Brand Title</Label>
                  <Input
                    id="footer-title"
                    value={settings.footerTitle}
                    onChange={(e) => setSettings({ ...settings, footerTitle: e.target.value })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="footer-desc" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Brand Description</Label>
                  <Textarea
                    id="footer-desc"
                    value={settings.footerDescription}
                    onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black min-h-[120px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Footer Links Builder */}
            <Card className="rounded-none border-neutral-200 bg-white shadow-none h-full">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Footer Navigation</CardTitle>
                <CardDescription className="text-xs">Manage About, Categories, and Help links.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-8 max-h-[600px] overflow-y-auto">
                {['about', 'categories', 'help'].map((section) => (
                  <div key={section} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">{section} Section</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddLink(section)}
                        className="rounded-none h-7 px-3 text-[9px] font-bold uppercase tracking-widest"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Link
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {settings.footerLinks[section]?.map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            placeholder="Label"
                            value={link.label}
                            onChange={(e) => handleLinkChange(section, idx, 'label', e.target.value)}
                            className="rounded-none border-neutral-200 text-[10px] h-8 flex-[2]"
                          />
                          <Input
                            placeholder="Href"
                            value={link.href}
                            onChange={(e) => handleLinkChange(section, idx, 'href', e.target.value)}
                            className="rounded-none border-neutral-200 text-[10px] h-8 flex-[3]"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLink(section, idx)}
                            className="h-8 w-8 text-neutral-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {(!settings.footerLinks[section] || settings.footerLinks[section].length === 0) && (
                        <p className="text-[10px] text-neutral-300 italic text-center py-4">No links added to this section.</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-none border-neutral-200 bg-white shadow-none">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Contact Information</CardTitle>
                <CardDescription className="text-xs">Public contact details shown on the storefront.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="contact-email" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Support Email</Label>
                  <Input
                    id="contact-email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="contact-phone" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">WhatsApp / Phone</Label>
                  <Input
                    id="contact-phone"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="contact-addr" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Studio Address</Label>
                  <Textarea
                    id="contact-addr"
                    value={settings.contactAddress}
                    onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-neutral-200 bg-white shadow-none">
              <CardHeader className="border-b border-neutral-100 pb-4">
                <CardTitle className="text-[12px] font-bold uppercase tracking-[0.2em] text-neutral-900">Social Media Links</CardTitle>
                <CardDescription className="text-xs">Connect your social accounts.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="social-ig" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Instagram URL</Label>
                  <Input
                    id="social-ig"
                    value={settings.socialLinks.instagram}
                    onChange={(e) => setSettings({
                      ...settings,
                      socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                    })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="social-fb" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Facebook URL</Label>
                  <Input
                    id="social-fb"
                    value={settings.socialLinks.facebook}
                    onChange={(e) => setSettings({
                      ...settings,
                      socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                    })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="social-wa" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">WhatsApp Link</Label>
                  <Input
                    id="social-wa"
                    value={settings.socialLinks.whatsapp}
                    onChange={(e) => setSettings({
                      ...settings,
                      socialLinks: { ...settings.socialLinks, whatsapp: e.target.value }
                    })}
                    className="rounded-none border-neutral-200 bg-white text-xs focus-visible:ring-black"
                    placeholder="https://wa.me/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
