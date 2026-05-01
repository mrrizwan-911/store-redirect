"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Archive, CheckCircle2, Clock, Copy, Eye, Filter, Inbox, LoaderCircle, Mail, MoreVertical, Search, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Inquiry {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: 'PENDING' | 'READ' | 'REPLIED' | 'ARCHIVED'
  createdAt: string
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchInquiries()
  }, [filter])

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' ? '/api/admin/inquiries' : `/api/admin/inquiries?status=${filter}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setInquiries(data.data)
      } else {
        toast.error(data.error || "Failed to fetch inquiries")
      }
    } catch (error) {
      toast.error("An error occurred while fetching inquiries")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Inquiry marked as ${status.toLowerCase()}`)
        setInquiries(prev => prev.map(item => item.id === id ? { ...item, status: status as any } : item))
        if (selectedInquiry?.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status: status as any })
        }
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return
    try {
      const res = await fetch(`/api/admin/inquiries?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Inquiry deleted")
        setInquiries(prev => prev.filter(item => item.id !== id))
        setIsDetailOpen(false)
      } else {
        toast.error(data.error || "Failed to delete")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleCopyEmail = () => {
    if (selectedInquiry) {
      navigator.clipboard.writeText(selectedInquiry.email)
      toast.success("Email copied to clipboard")
    }
  }

  const openDetail = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setIsDetailOpen(true)
    if (inquiry.status === 'PENDING') {
      handleUpdateStatus(inquiry.id, 'READ')
    }
  }

  const filteredInquiries = inquiries.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-100 uppercase text-[9px] font-bold tracking-widest">New</Badge>
      case 'READ': return <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 border-neutral-200 uppercase text-[9px] font-bold tracking-widest">Read</Badge>
      case 'REPLIED': return <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 uppercase text-[9px] font-bold tracking-widest">Replied</Badge>
      case 'ARCHIVED': return <Badge variant="secondary" className="bg-neutral-100 text-neutral-400 border-neutral-200 uppercase text-[9px] font-bold tracking-widest">Archived</Badge>
      default: return null
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 font-serif">Inquiry Inbox</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage customer messages and support inquiries.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant={filter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn("rounded-none text-[10px] font-bold uppercase tracking-widest h-9 px-4", filter === 'all' ? "bg-black text-white" : "text-neutral-500")}
          >
            All
          </Button>
          <Button
            variant={filter === 'PENDING' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('PENDING')}
            className={cn("rounded-none text-[10px] font-bold uppercase tracking-widest h-9 px-4", filter === 'PENDING' ? "bg-black text-white" : "text-neutral-500")}
          >
            Unread
          </Button>
          <Button
            variant={filter === 'READ' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('READ')}
            className={cn("rounded-none text-[10px] font-bold uppercase tracking-widest h-9 px-4", filter === 'READ' ? "bg-black text-white" : "text-neutral-500")}
          >
            Read
          </Button>
          <Button
            variant={filter === 'REPLIED' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('REPLIED')}
            className={cn("rounded-none text-[10px] font-bold uppercase tracking-widest h-9 px-4", filter === 'REPLIED' ? "bg-black text-white" : "text-neutral-500")}
          >
            Replied
          </Button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <Input
            placeholder="Search inquiries..."
            className="pl-9 rounded-none border-neutral-200 text-xs h-9 focus-visible:ring-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle className="w-8 h-8 animate-spin text-neutral-200" />
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-400 space-y-4">
            <Inbox className="w-12 h-12 stroke-[1] opacity-20" />
            <p className="text-sm italic font-serif">No inquiries found in this folder.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {filteredInquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                onClick={() => openDetail(inquiry)}
                className={cn(
                  "group flex items-center gap-4 p-4 cursor-pointer hover:bg-neutral-50/50 transition-all",
                  inquiry.status === 'PENDING' && "bg-neutral-50/30 border-l-2 border-l-black"
                )}
              >
                <div className="hidden md:flex flex-col items-center justify-center w-12 text-center shrink-0 border-r border-neutral-100 pr-4">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                    {new Date(inquiry.createdAt).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-serif font-light text-neutral-900">
                    {new Date(inquiry.createdAt).getDate()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-bold truncate", inquiry.status === 'PENDING' ? "text-black" : "text-neutral-600")}>
                      {inquiry.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium truncate hidden sm:inline">
                      &lt;{inquiry.email}&gt;
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {getStatusBadge(inquiry.status)}
                    </div>
                  </div>
                  <h3 className={cn("text-xs truncate", inquiry.status === 'PENDING' ? "font-bold text-neutral-900" : "font-medium text-neutral-500")}>
                    {inquiry.subject || 'No Subject'}
                  </h3>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-sans">
                    {inquiry.message}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-black" onClick={(e) => { e.stopPropagation(); openDetail(inquiry); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); handleDelete(inquiry.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inquiry Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-none border-neutral-200 p-0 overflow-hidden bg-white shadow-2xl">
          {selectedInquiry && (
            <div className="flex flex-col h-full">
              {/* Header Section */}
              <div className="p-8 border-b border-neutral-100 bg-neutral-50/30 relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1.5 max-w-[80%]">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-serif font-light text-black uppercase tracking-tight leading-tight">
                        {selectedInquiry.subject || 'No Subject'}
                      </h2>
                      {getStatusBadge(selectedInquiry.status)}
                    </div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em]">
                      Received {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-none border-neutral-200 bg-white hover:bg-neutral-50 shadow-sm transition-all">
                          <MoreVertical className="w-5 h-5 text-neutral-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-neutral-200 text-xs min-w-[200px] z-[9999] bg-white shadow-2xl">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-neutral-400 px-3 py-2">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-neutral-100" />
                          <DropdownMenuItem onClick={() => handleUpdateStatus(selectedInquiry.id, 'REPLIED')} className="py-2.5 px-3 cursor-pointer">
                            <CheckCircle2 className="w-4 h-4 mr-3 text-green-500" /> Mark as Replied
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(selectedInquiry.id, 'ARCHIVED')} className="py-2.5 px-3 cursor-pointer">
                            <Archive className="w-4 h-4 mr-3 text-neutral-400" /> Archive Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCopyEmail} className="py-2.5 px-3 cursor-pointer">
                            <Copy className="w-4 h-4 mr-3 text-neutral-400" /> Copy Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-neutral-100" />
                          <DropdownMenuItem onClick={() => handleDelete(selectedInquiry.id)} variant="destructive" className="py-2.5 px-3 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-3 text-rose-500" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Sender Info Block - Clearly separated with white background and border */}
                <div className="bg-white border border-neutral-100 p-6 mt-4 shadow-sm relative z-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400">Customer Name</p>
                      <p className="text-sm font-bold text-black">{selectedInquiry.name}</p>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400">Email Address</p>
                      <p className="text-sm font-medium text-neutral-600 break-all select-all font-sans">{selectedInquiry.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content Section */}
              <div className="p-8 bg-white overflow-y-auto max-h-[400px]">
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400 mb-4">Message Content</p>
                <div className="bg-neutral-50 p-8 border border-neutral-100 rounded-none italic font-serif text-neutral-700 leading-relaxed text-base whitespace-pre-wrap shadow-inner selection:bg-black selection:text-white">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Footer Actions Section */}
              <DialogFooter className="p-6 border-t border-neutral-100 bg-neutral-50/20">
                <div className="flex w-full gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-none border-neutral-200 text-[10px] font-bold uppercase tracking-[0.2em] h-12"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-[2] bg-black text-white hover:bg-neutral-800 rounded-none text-[10px] font-bold uppercase tracking-[0.2em] h-12 px-8 shadow-lg active:scale-95 transition-all"
                    onClick={() => {
                      const mailtoUrl = `mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Re: ${selectedInquiry.subject || 'Inquiry'}`)}`
                      window.open(mailtoUrl, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    Reply via Email
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

