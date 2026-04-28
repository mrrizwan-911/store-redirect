import { Metadata } from 'next'
import { QuotationForm } from '@/components/store/QuotationForm'

export const metadata: Metadata = {
  title: 'B2B Quotation Portal | Calnza',
  description: 'Request bulk quotations for premium luxury apparel and corporate solutions.',
}

export default function QuotationPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-black text-white py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight uppercase">B2B & Bulk Orders</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto text-xs md:text-sm uppercase tracking-[0.3em] font-bold">
            Elevating Corporate Gifting & Wholesale Partnerships
          </p>
          <div className="w-16 h-px bg-[#E8D5B0] mx-auto" />
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-white border border-neutral-100 p-8 md:p-12">
          <QuotationForm />
        </div>
      </div>

      {/* Trust Bar */}
      <div className="border-t border-neutral-100 py-16 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center text-black">
            <div className="space-y-2">
              <p className="text-3xl font-serif font-bold italic tracking-tighter">50+</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">Corporate Clients</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-serif font-bold italic tracking-tighter">24h</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">Quote Turnaround</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-serif font-bold italic tracking-tighter">100%</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">Quality Assured</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-serif font-bold italic tracking-tighter">PK</p>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">Nationwide Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
