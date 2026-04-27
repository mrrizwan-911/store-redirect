'use client'

import React, { useEffect, useState } from 'react'
import { Plus, MapPin, MoreVertical, Edit2, Trash2, Check, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { addressSchema, type AddressInput } from '@/lib/validations/address'
import { ZodError } from 'zod'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store/hooks'

interface Address extends AddressInput {
  id: string
}

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  const [formData, setFormData] = useState<AddressInput>({
    label: '',
    line1: '',
    line2: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false
  })

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    fetchAddresses()
  }, [isAuthenticated])

  async function fetchAddresses() {
    try {
      const res = await fetch('/api/account/addresses')
      const result = await res.json()
      if (result.success) setAddresses(result.data)
    } catch (error) {
      toast.error('Failed to load addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    setFormData({
      label: '',
      line1: '',
      line2: '',
      city: '',
      province: '',
      postalCode: '',
      isDefault: false
    })
    setEditingAddress(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      addressSchema.parse(formData)

      const url = editingAddress
        ? `/api/account/addresses/${editingAddress.id}`
        : '/api/account/addresses'

      const method = editingAddress ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save address')

      toast.success(editingAddress ? 'Address updated' : 'Address added')
      setIsDialogOpen(false)
      resetForm()
      fetchAddresses()
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message)
      } else if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete address')
      toast.success('Address deleted')
      fetchAddresses()
    } catch (error) {
      toast.error('Could not delete address')
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      isDefault: address.isDefault
    })
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-black">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Address Management</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Saved Addresses</h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <div role="button" tabIndex={0} className="rounded-[12px] h-14 px-8 bg-black text-white hover:bg-neutral-900 uppercase tracking-widest text-[10px] font-bold transition-all flex items-center gap-3 shadow-xl cursor-pointer">
              <Plus className="w-4 h-4 stroke-[2]" /> Add New Address
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[12px] border-none p-8 bg-white shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-display text-3xl tracking-tight text-black">
                {editingAddress ? 'Edit Address' : 'New Address'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-black">Address Label</label>
                <input
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g. Home, Office"
                  className="input-underline w-full h-10 text-sm outline-none border-neutral-300 focus:border-black"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-black">Street Address</label>
                <input
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  placeholder="House number, street name"
                  className="input-underline w-full h-10 text-sm outline-none border-neutral-300 focus:border-black"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-black">Apartment / Suite (Optional)</label>
                <input
                  name="line2"
                  value={formData.line2 || ''}
                  onChange={handleInputChange}
                  className="input-underline w-full h-10 text-sm outline-none border-neutral-300 focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black">City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-underline w-full h-10 text-sm outline-none border-neutral-300 focus:border-black"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-black">Province</label>
                  <input
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="input-underline w-full h-10 text-sm outline-none border-neutral-300 focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-black">Postal Code</label>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="input-underline w-full h-10 text-sm outline-none border-neutral-300 focus:border-black"
                  required
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-black border-neutral-400"
                />
                <label htmlFor="isDefault" className="text-[10px] uppercase tracking-widest font-bold text-neutral-700 cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <DialogFooter className="mt-8">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-[12px] h-14 bg-black text-white hover:bg-neutral-900 uppercase tracking-widest text-[11px] font-bold shadow-xl"
                >
                  {isSaving ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className={cn(
              "rounded-[12px] border-neutral-200 shadow-none transition-all group relative overflow-hidden bg-white",
              address.isDefault && "border-black/30 bg-neutral-50/50"
            )}>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs uppercase tracking-widest font-bold text-black">{address.label}</h3>
                      {address.isDefault && (
                        <Badge className="bg-black text-white text-[8px] uppercase tracking-widest rounded-[4px] px-1.5 py-0">Default</Badge>
                      )}
                    </div>
                    <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold">Shipping Address</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-all rounded-full"
                    >
                      <Edit2 className="w-4 h-4 stroke-[1.8]" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-full"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.8]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-neutral-700 font-medium leading-relaxed">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>{address.city}, {address.province}</p>
                  <p>{address.postalCode}</p>
                </div>

                <div className="mt-8 flex items-center gap-2 text-neutral-500">
                  <MapPin className="w-3 h-3 stroke-[2]" />
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Verified Address</span>
                </div>

                {/* Decorative background icon */}
                <MapPin className="absolute -bottom-4 -right-4 w-24 h-24 text-neutral-200 opacity-[0.05] pointer-events-none" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center border-2 border-dashed border-neutral-200 rounded-[12px] bg-neutral-50/30">
          <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-6 stroke-[1.5]" />
          <h2 className="font-display text-2xl mb-2 text-black">No addresses found</h2>
          <p className="text-neutral-500 text-sm font-medium max-w-xs mx-auto mb-8">
            Add a shipping address to speed up your checkout process.
          </p>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(true)}
            className="rounded-[12px] border-black text-black uppercase tracking-widest text-[10px] font-bold h-12 px-10 hover:bg-black hover:text-white transition-all"
          >
            Add Your First Address
          </Button>
        </div>
      )}
    </div>
  )
}
