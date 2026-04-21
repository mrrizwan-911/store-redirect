'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Award, ShoppingBag, Star, Share2, History, TrendingUp, Info } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LoyaltyData {
  points: number
  tier: string
  totalEarned: number
  nextTier: string
  pointsToNextTier: number
  progressPct: number
  history: Array<{ id: string; points: number; reason: string; createdAt: string }>
}

const tierConfig: Record<string, { color: string; bg: string; icon: any }> = {
  BRONZE: { color: 'text-[#8c7355]', bg: 'bg-[#8c7355]/10', icon: Award },
  SILVER: { color: 'text-neutral-400', bg: 'bg-neutral-100', icon: Award },
  GOLD: { color: 'text-[#C5A059]', bg: 'bg-[#C5A059]/10', icon: Award },
  PLATINUM: { color: 'text-neutral-900', bg: 'bg-neutral-200', icon: Award },
}

export function LoyaltyDashboard() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState<number[]>([100])
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/account/loyalty')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
          const maxRedeem = Math.min(json.data.points, 500)
          setRedeemPoints([Math.max(100, Math.floor(maxRedeem / 100) * 100)])
        }
      } catch (err) {
        console.error('Failed to fetch loyalty data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRedeem = async () => {
    setRedeeming(true)
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: redeemPoints[0], orderId: 'manual_redeem' })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Successfully redeemed ${redeemPoints[0]} points!`)
        setData((prev) => prev ? { ...prev, points: prev.points - redeemPoints[0] } : prev)
      } else {
        toast.error(json.error || 'Failed to redeem points')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const currentTier = tierConfig[data.tier] || tierConfig.BRONZE
  const maxRedeem = Math.min(data.points, 500)

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-black">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-8 justify-between">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold">Rewards Program</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight text-black">Your Loyalty Status</h1>
        </div>

        <div className="flex items-center gap-4 bg-neutral-50 px-6 py-4 border border-neutral-200 self-center md:self-auto rounded-[12px]">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", currentTier.bg, currentTier.color)}>
            <currentTier.icon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Current Tier</p>
            <p className={cn("text-lg font-display uppercase tracking-tighter font-bold", currentTier.color)}>
              {data.tier} MEMBER
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-[12px] border-neutral-200 shadow-none overflow-hidden relative bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-2 font-bold">
              <TrendingUp className="w-3 h-3 stroke-[2]" /> Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-5xl font-display text-black">{data.points}</div>
            <p className="text-xs text-neutral-500 font-medium">Equivalent to PKR {data.points} store credit</p>
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-full -mr-16 -mt-16 -z-10" />
        </Card>

        <Card className="rounded-[12px] border-neutral-200 shadow-none overflow-hidden bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-2 font-bold">
              <Star className="w-3 h-3 stroke-[2]" /> Progress to {data.nextTier}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Progress value={data.progressPct} className="h-2 bg-neutral-100 [&_[data-slot=progress-indicator]]:bg-black rounded-full" />
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                <span className="text-black">{data.tier}</span>
                <span className="text-neutral-500">{data.nextTier}</span>
              </div>
            </div>
            <p className="text-xs text-neutral-600 font-medium">
              You need <span className="font-bold text-black border-b border-black">{data.pointsToNextTier}</span> more points to unlock {data.nextTier} status.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Redeem Section */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl border-b border-neutral-200 pb-4 text-black font-medium">Redeem Rewards</h2>
        <Card className="rounded-[12px] border-neutral-200 shadow-none p-8 bg-neutral-50/50">
          <div className="max-w-xl mx-auto space-y-8 py-4">
            {data.points >= 100 ? (
              <>
                <div className="text-center space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Select amount to redeem</p>
                  <p className="text-3xl font-display text-black">PKR {redeemPoints[0]} OFF</p>
                </div>

                <Slider
                  min={100}
                  max={Math.floor(maxRedeem / 100) * 100}
                  step={100}
                  value={redeemPoints}
                  onValueChange={(val) => setRedeemPoints(val as number[])}
                  className="[&_[data-slot=slider-range]]:bg-black [&_[data-slot=slider-thumb]]:border-black"
                />

                <div className="flex flex-col items-center gap-4 pt-4">
                  <Button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="w-full md:w-auto px-12 h-14 rounded-[12px] bg-black text-white hover:bg-neutral-900 uppercase tracking-widest text-[11px] font-bold shadow-xl transition-all active:scale-95"
                  >
                    {redeeming ? 'Processing...' : 'Apply to Next Order'}
                  </Button>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Info className="w-3 h-3 stroke-[2]" /> Maximum 500 points per order
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Star className="w-8 h-8 text-neutral-300 mx-auto stroke-[1.5]" />
                <p className="text-sm text-neutral-600 font-medium">
                  You need a minimum of <span className="font-bold text-black border-b border-black">100 points</span> to start redeeming rewards.
                </p>
                <Link
                  href="/products"
                  className="text-[10px] uppercase tracking-widest font-bold text-black underline underline-offset-4 hover:text-neutral-600 transition-colors inline-block mt-2"
                >
                  Shop to Earn More
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* How to Earn */}
      <div className="space-y-6">
        <h2 className="font-display text-2xl border-b border-neutral-200 pb-4 text-black font-medium">Ways to Earn</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShoppingBag, title: 'Purchase', detail: '1 Point per PKR 100 spent' },
            { icon: Star, title: 'Reviews', detail: '+5 Points for verified reviews' },
            { icon: Share2, title: 'Referrals', detail: '+50 Points per referral' },
          ].map((item, i) => (
            <Card key={i} className="rounded-[12px] border-neutral-200 shadow-none p-6 group hover:border-black transition-all bg-white">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-neutral-50 flex items-center justify-center border border-neutral-200 group-hover:bg-black group-hover:text-white transition-all rounded-[8px]">
                  <item.icon className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[11px] uppercase tracking-widest font-bold text-black">{item.title}</h4>
                  <p className="text-xs text-neutral-600 font-medium">{item.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
          <History className="w-5 h-5 text-black stroke-[2]" />
          <h2 className="font-display text-2xl text-black font-medium">Points History</h2>
        </div>

        {data.history.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
            <Table className="min-w-[400px] md:min-w-0">
              <TableHeader>
                <TableRow className="border-neutral-200 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">Activity</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-widest font-bold text-neutral-500">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((event) => (
                  <TableRow key={event.id} className="border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <TableCell className="py-4 text-xs text-neutral-600 font-medium">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-4 text-[11px] uppercase tracking-widest font-bold text-black">
                      {event.reason}
                    </TableCell>
                    <TableCell className={cn(
                      "py-4 text-right font-mono font-bold text-sm",
                      event.points > 0 ? 'text-green-700' : 'text-red-600'
                    )}>
                      {event.points > 0 ? `+${event.points}` : event.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-neutral-500 font-medium py-10 text-center border-2 border-dashed border-neutral-200 rounded-[12px]">
            No history yet. Start shopping to earn rewards.
          </p>
        )}
      </div>
    </div>
  )
}
