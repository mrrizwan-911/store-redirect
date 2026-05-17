'use client'

import type { Tab } from './AnalyticsDashboard'

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Orders' },
  { value: 'products', label: 'Products' },
  { value: 'customers', label: 'Customers' },
  { value: 'marketing', label: 'Marketing' },
]

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <div className="an-card !p-0 overflow-x-auto">
      <div className="flex min-w-max border-b border-[var(--an-border)] px-2">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              px-4 py-3 text-[11px] font-medium tracking-wide whitespace-nowrap transition-all
              ${activeTab === tab.value
                ? 'text-[var(--an-ink)] border-b-2 border-[var(--an-ink)] -mb-px'
                : 'text-[var(--an-ink-3)] hover:text-[var(--an-ink-2)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
