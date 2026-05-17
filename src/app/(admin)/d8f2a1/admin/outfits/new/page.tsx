import { OutfitBuilder } from '@/components/admin/outfits/OutfitBuilder'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewOutfitPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-neutral-100 pb-5">
        <Link
          href="/d8f2a1/admin/outfits"
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Create New Look</h1>
          <p className="text-xs text-neutral-400 mt-0.5 uppercase tracking-widest">Add outfit to lookbook</p>
        </div>
      </div>
      <OutfitBuilder />
    </div>
  )
}
