export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-background pt-4">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image gallery skeleton */}
          <div className="space-y-3">
            <div className="aspect-[3/4] rounded-2xl bg-neutral-100 animate-pulse w-full" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-16 h-20 rounded-lg bg-neutral-100 animate-pulse" />
              ))}
            </div>
          </div>
          {/* Product info skeleton */}
          <div className="space-y-4 pt-4">
            <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-neutral-100 rounded animate-pulse" />
            <div className="h-6 w-32 bg-neutral-100 rounded animate-pulse" />
            <div className="h-px bg-neutral-100 my-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-neutral-100 rounded animate-pulse" style={{ width: `${[90,75,60][i]}%` }} />
              ))}
            </div>
            <div className="h-px bg-neutral-100 my-4" />
            {/* Variant selector skeleton */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-16 rounded-full bg-neutral-100 animate-pulse" />
              ))}
            </div>
            {/* Add to cart button skeleton */}
            <div className="h-12 w-full rounded-full bg-neutral-100 animate-pulse mt-6" />
          </div>
        </div>
      </div>
    </main>
  )
}
