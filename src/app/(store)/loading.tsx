export default function HomeLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <div className="w-full h-[60vh] bg-neutral-100 animate-pulse" />
      {/* Category tiles skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-neutral-100 animate-pulse" />
        ))}
      </div>
      {/* Product grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 pb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[3/4] rounded-lg bg-neutral-100 animate-pulse" />
            <div className="h-4 bg-neutral-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-neutral-100 rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </main>
  )
}
