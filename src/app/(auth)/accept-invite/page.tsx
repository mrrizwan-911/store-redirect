'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Eye, EyeOff, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/store/auth/AuthLayout'

function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [invalidReason, setInvalidReason] = useState('')

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setInvalidReason('No invitation token found in this link.')
      return
    }

    fetch(`/api/admin/invites/accept?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setEmail(data.email)
          setStatus('valid')
        } else {
          setStatus('invalid')
          setInvalidReason(data.error || 'Invalid invite link.')
        }
      })
      .catch(() => {
        setStatus('invalid')
        setInvalidReason('Could not verify invite. Please try again.')
      })
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password, confirmPassword: formData.confirmPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong')
        return
      }

      toast.success('Admin account created! Signing you in...')
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <AuthLayout title="Verifying" subtitle="INVITE LINK">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          <p className="text-[13px] text-neutral-400 uppercase tracking-widest">Verifying your invite...</p>
        </div>
      </AuthLayout>
    )
  }

  // ── Invalid / expired ──────────────────────────────────────────────────────
  if (status === 'invalid') {
    return (
      <AuthLayout title="Invalid" subtitle="INVITE LINK">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-10 h-10 text-neutral-300" />
          </div>
          <p className="text-[14px] text-neutral-500 leading-relaxed">{invalidReason}</p>
          <p className="text-[12px] text-neutral-400">
            Ask your administrator to send a new invite.
          </p>
          <Button
            asChild
            variant="outline"
            className="w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-500 uppercase tracking-[0.3em] text-[13px] font-bold rounded-[var(--radius)] h-[60px]"
          >
            <Link href="/login">Go to Sign In</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // ── Valid — show password form ─────────────────────────────────────────────
  return (
    <AuthLayout title="Accept" subtitle="ADMIN INVITE">
      {/* Email display */}
      <div className="mb-6 p-4 bg-neutral-50 rounded-lg flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-neutral-400 flex-shrink-0" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">Invite for</p>
          <p className="text-[14px] font-medium text-black">{email}</p>
        </div>
      </div>

      <p className="text-[13px] text-neutral-500 uppercase tracking-widest text-center mb-6 leading-relaxed">
        Set a secure password to <br /> activate your admin account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password */}
        <div className="space-y-0.5">
          <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="input-underline w-full h-10 text-[16px] outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">Minimum 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div className="space-y-0.5">
          <label htmlFor="confirmPassword" className="text-[11px] uppercase tracking-[0.2em] font-bold text-black block">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-underline w-full h-10 text-[16px] outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-500 uppercase tracking-[0.3em] text-[13px] font-bold rounded-[var(--radius)] h-[60px] shadow-sm"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
            </span>
          ) : (
            'Activate Admin Account'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-[12px] text-neutral-400">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-bold underline-offset-2 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AcceptInviteForm />
    </Suspense>
  )
}
