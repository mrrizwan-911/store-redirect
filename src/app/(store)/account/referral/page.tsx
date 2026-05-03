'use client'

import React, { useState, useEffect } from 'react'
import { Users, Copy, Share2, Award, Gift, Check, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ReferralPage() {
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalReferred: 0, pointsFromReferrals: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/account/loyalty')
        const result = await res.json()
        if (result.success) {
          setReferralCode(result.data.referralCode)
          setStats(result.data.stats || { totalReferred: 0, pointsFromReferrals: 0 })
        }
      } catch (error) {
        console.error('Failed to load referral data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const referralLink = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/ref/${referralCode}`
    : "..."

  const handleCopy = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-black">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Community</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Referral Program</h1>
      </div>

      {/* Hero Section */}
      <Card className="rounded-[var(--radius)] border-neutral-200 shadow-none bg-neutral-950 text-white overflow-hidden relative">
        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="max-w-2xl space-y-6">
            <h2 className="font-display text-3xl md:text-4xl tracking-tight text-white">
              Share the Luxury, <br className="hidden md:block" /> Earn Exclusive Rewards.
            </h2>
            <p className="text-neutral-300 text-sm font-light leading-relaxed">
              Invite your friends to experience our premium collection. They get <span className="text-white font-bold">PKR 100 off</span> their first order, and you earn <span className="text-white font-bold">100 loyalty points</span> for every successful referral.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 bg-white/5 border border-white/20 h-14 flex items-center px-6 text-[12px] sm:text-sm font-mono text-neutral-200 rounded-[var(--radius)] overflow-hidden truncate">
                {isLoading ? 'Generating your unique link...' : referralLink}
              </div>
              <Button
                onClick={handleCopy}
                disabled={isLoading || !referralCode}
                className="rounded-[var(--radius)] h-14 px-8 bg-white text-black hover:bg-neutral-200 uppercase tracking-widest text-[10px] font-bold transition-all flex items-center justify-center gap-3 shadow-2xl shrink-0"
              >
                {isLoading ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" /> Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </Card>

      {/* Stats & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Total Referred', value: stats.totalReferred.toString(), icon: Users },
          { label: 'Points Earned', value: stats.pointsFromReferrals.toString(), icon: Award },
          { label: 'Pending Credits', value: `PKR ${(stats.totalReferred * 100).toLocaleString()}`, icon: Gift },
        ].map((stat, i) => (
          <div key={i} className="p-8 border border-neutral-200 space-y-4 rounded-[var(--radius)] bg-white shadow-sm hover:border-black transition-all group">
            <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center border border-neutral-100 text-neutral-500 rounded-[8px] group-hover:bg-black group-hover:text-white transition-all">
              <stat.icon className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="space-y-1 text-black">
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 group-hover:text-black transition-colors">{stat.label}</p>
              <p className="text-3xl font-display font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Social Share */}
      <div className="space-y-6 pt-8 border-t border-neutral-200">
        <h3 className="font-display text-2xl text-black font-medium">Quick Share</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="rounded-[var(--radius)] h-12 px-6 border-neutral-300 text-black hover:bg-black hover:text-white text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-sm">
            WhatsApp
          </Button>
          <Button variant="outline" className="rounded-[var(--radius)] h-12 px-6 border-neutral-300 text-black hover:bg-black hover:text-white text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-sm">
            Instagram
          </Button>
          <Button variant="outline" className="rounded-[var(--radius)] h-12 px-6 border-neutral-300 text-black hover:bg-black hover:text-white text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-sm">
            Facebook
          </Button>
        </div>
      </div>
    </div>
  )
}
