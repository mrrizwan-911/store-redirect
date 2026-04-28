export interface KpiCardProps {
  label: string
  value: string | number
  trend?: { pct: number; label: string }
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  const trendPositive = (trend?.pct ?? 0) >= 0

  return (
    <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-28">
      <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1 font-sans">{label}</p>
      <p className="text-xl font-bold text-neutral-900 font-sans tracking-tight">{value}</p>
      {trend && (
        <p className={`text-[10px] mt-2 font-sans font-medium ${trendPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendPositive ? '▲' : '▼'} {Math.abs(trend.pct)}% {trend.label}
        </p>
      )}
    </div>
  )
}
