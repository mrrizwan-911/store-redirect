import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 pt-10 pb-20">
      <div className="bg-black text-white -mx-6 md:-mx-8 px-6 md:px-8 py-12 mb-12">
        <Skeleton className="h-4 w-32 bg-white/10 mb-4 rounded-[var(--radius)]" />
        <Skeleton className="h-16 w-1/2 bg-white/10 rounded-[var(--radius)]" />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-4 w-24 bg-neutral-100 rounded-[var(--radius)]" />
        <div className="flex-1 h-[2px] bg-neutral-100" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full bg-neutral-50 rounded-[var(--radius)]" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-3/4 bg-neutral-50 rounded-[var(--radius)]" />
              <Skeleton className="h-4 w-1/4 bg-neutral-50 rounded-[var(--radius)]" />
            </div>
            <Skeleton className="h-4 w-1/2 bg-neutral-50 rounded-[var(--radius)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
