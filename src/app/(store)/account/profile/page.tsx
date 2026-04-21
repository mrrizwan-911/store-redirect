'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Eye, EyeOff, User, Phone, Lock, Save } from 'lucide-react'
import { profileSchema } from '@/lib/validations/profile'
import { ZodError } from 'zod'

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/account/profile')
        const result = await res.json()
        if (result.success) {
          setFormData((prev) => ({
            ...prev,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone || '',
          }))
        }
      } catch (error) {
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }

    setIsSaving(true)
    try {
      // Validate with Zod
      profileSchema.parse({
        name: formData.name,
        phone: formData.phone || null,
        password: formData.password || undefined,
        newPassword: formData.newPassword || undefined,
      })

      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          password: formData.password || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to update profile')

      toast.success('Profile updated successfully')

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message)
      } else if (error instanceof Error) {
        toast.error(error.message)
      }
    } finally {
      setIsSaving(true)
      // Small timeout to show success state before enabling button again
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-12 animate-in fade-in duration-700">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Account Settings</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Personal Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Personal Details */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
                Full Name
              </label>
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="input-underline w-full h-10 text-[15px] outline-none pr-8 border-neutral-300 focus:border-black"
                />
                <User className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 stroke-[1.8]" />
              </div>
            </div>

            <div className="space-y-1.5 opacity-80">
              <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="input-underline w-full h-10 text-[15px] outline-none cursor-not-allowed border-neutral-300"
              />
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1 font-bold">Email cannot be changed</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
              Phone Number
            </label>
            <div className="relative">
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03XXXXXXXXX"
                className="input-underline w-full h-10 text-[15px] outline-none pr-8 border-neutral-300 focus:border-black"
              />
              <Phone className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 stroke-[1.8]" />
            </div>
          </div>
        </div>

        {/* Password Security */}
        <div className="pt-8 border-t border-neutral-200 space-y-8">
          <div className="space-y-2">
            <h3 className="font-display text-2xl text-black">Security</h3>
            <p className="text-xs text-neutral-600 font-light">Leave blank if you don't want to change your password.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
              Current Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-underline w-full h-10 text-[15px] outline-none pr-10 border-neutral-300 focus:border-black"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
              >
                {showCurrentPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
                New Password
              </label>
              <div className="relative">
                <input
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-underline w-full h-10 text-[15px] outline-none pr-10 border-neutral-300 focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition-colors"
                >
                  {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
                Confirm New Password
              </label>
              <input
                name="confirmNewPassword"
                type="password"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-underline w-full h-10 text-[15px] outline-none border-neutral-300 focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="rounded-[12px] h-[56px] px-10 bg-black text-white hover:bg-neutral-900 uppercase tracking-[0.2em] text-[11px] font-bold transition-all flex items-center gap-3 w-full md:w-auto shadow-xl"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
