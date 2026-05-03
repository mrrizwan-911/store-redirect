'use client'

import { useEffect, useState } from 'react'
import { Star, CircleCheck, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useSearchParams, useParams } from 'next/navigation'
import ReviewForm from './ReviewForm'

interface Review {
  id: string
  rating: number
  title?: string | null
  body: string
  isVerified: boolean
  sentiment?: string | null
  createdAt: Date | string
  user: {
    name: string
  }
}

interface ReviewsSectionProps {
  reviews: Review[]
  avgRating: number | null
  reviewCount: number
}

export default function ReviewsSection({
  reviews: initialReviews,
  avgRating,
  reviewCount,
}: ReviewsSectionProps) {
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [reviews, setReviews] = useState(initialReviews)
  const [eligibility, setEligibility] = useState<{ eligible: boolean; alreadyReviewed: boolean } | null>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(true)

  const { slug } = useParams() as { slug: string }

  useEffect(() => {
    async function checkEligibility() {
      try {
        const res = await fetch(`/api/products/${slug}/review-eligibility`)
        const data = await res.json()
        setEligibility(data)

        // Auto-open form if review=true is in URL and user is eligible
        if (searchParams.get('review') === 'true' && data.eligible && !data.alreadyReviewed) {
          setShowForm(true)
        }
      } catch (err) {
        console.error('Failed to check review eligibility', err)
      } finally {
        setCheckingEligibility(false)
      }
    }
    checkEligibility()
  }, [slug, searchParams])

  const ratingCounts = [0, 0, 0, 0, 0]
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[5 - review.rating]++
    }
  })

  const handleReviewSuccess = (newReview: Review) => {
    setReviews([newReview, ...reviews])
    setShowForm(false)
  }

  return (
    <div className="space-y-12">
      {showForm && (
        <div className="max-w-2xl mx-auto mb-16">
          <ReviewForm
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-12 items-start">
        {/* Rating Summary */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-display uppercase tracking-tight">Customer Reviews</h3>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-light">{avgRating?.toFixed(1) || '0.0'}</div>
              <div className="space-y-1">
                <div className="flex text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4 fill-current",
                        i < Math.round(avgRating || 0) ? "text-primary" : "text-neutral-200 fill-neutral-200"
                      )}
                    />
                  ))}
                </div>
                <div className="text-xs text-text-secondary uppercase tracking-widest">
                  Based on {reviewCount} reviews
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating, idx) => {
              const count = ratingCounts[idx]
              const totalForCount = reviews.length
              const percentage = totalForCount > 0 ? (count / totalForCount) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-4 text-sm">
                  <span className="w-3 text-text-secondary">{rating}</span>
                  <div className="flex-1 h-1.5 bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-text-secondary">{count}</span>
                </div>
              )
            })}
          </div>

          {!checkingEligibility && (
            <>
              {eligibility?.eligible && !eligibility?.alreadyReviewed ? (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-4 border border-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Write a Review
                </button>
              ) : eligibility?.alreadyReviewed ? (
                <div className="w-full py-4 bg-neutral-50 border border-neutral-200 text-[10px] uppercase tracking-widest font-bold text-neutral-400 text-center rounded-[4px] flex items-center justify-center gap-2">
                  <CircleCheck className="w-3 h-3" /> Review Submitted
                </div>
              ) : (
                <div className="w-full py-4 bg-neutral-50 border border-neutral-200 text-[9px] uppercase tracking-widest font-bold text-neutral-400 text-center rounded-[4px] flex flex-col items-center gap-1 px-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3" /> Only purchasers can review
                  </div>
                  <p className="text-[8px] normal-case font-medium tracking-normal">Purchase this item and have it delivered to unlock reviews.</p>
                </div>
              )}
            </>
          )}

          {checkingEligibility && (
            <div className="w-full py-4 bg-neutral-50 border border-neutral-100 animate-pulse rounded-[4px]" />
          )}
        </div>

        {/* Reviews List */}
        <div className="md:col-span-2 space-y-8">
          {reviews.length === 0 ? (
            <div className="py-12 text-center border-t border-neutral-100">
              <p className="text-text-secondary italic">No reviews yet. Be the first to share your experience.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="py-8 border-t border-neutral-100 first:border-t-0 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5 fill-current",
                            i < review.rating ? "text-primary" : "text-neutral-200 fill-neutral-200"
                          )}
                        />
                      ))}
                    </div>
                    <h4 className="font-medium text-sm">{review.title}</h4>
                  </div>
                  <div className="text-[10px] text-text-secondary uppercase tracking-widest">
                    {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                  </div>
                </div>

                <p className="text-sm text-text-primary leading-relaxed">
                  {review.body}
                </p>

                <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
                  <span className="font-bold">{review.user.name}</span>
                  {review.isVerified && (
                    <div className="flex items-center gap-1 text-success">
                      <CircleCheck className="w-3 h-3" />
                      <span>Verified Purchase</span>
                    </div>
                  )}
                  {review.sentiment && (
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black tracking-tighter",
                      review.sentiment === 'POSITIVE' ? "bg-green-50 text-green-700" :
                      review.sentiment === 'NEGATIVE' ? "bg-red-50 text-red-700" :
                      "bg-neutral-100 text-neutral-600"
                    )}>
                      {review.sentiment}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
