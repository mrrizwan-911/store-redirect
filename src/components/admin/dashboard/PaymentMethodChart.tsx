'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PaymentMethodChartProps {
  data: { method: string; revenue: number; count: number }[]
}

export function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 border border-black flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans text-sm">
        No payment data available.
      </div>
    )
  }

  return (
    <div className="w-full h-80 border border-black p-4 bg-white font-sans flex flex-col">
      <h3 className="text-sm font-bold uppercase mb-2 text-center shrink-0">Revenue by Payment Method</h3>
      <div className="flex-1 w-full min-h-[240px]">
        {!isMounted ? <div className="w-full h-full" /> : <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E5E5" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="method"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#000', fontSize: 12, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: '#FAFAFA' }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #000',
                borderRadius: '0px',
                fontFamily: 'inherit',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#000000" barSize={24} />
          </BarChart>
        </ResponsiveContainer>}
      </div>
    </div>
  )
}
