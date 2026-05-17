"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Counts {
  all: number;
  PENDING: number;
  SENT: number;
  ACCEPTED: number;
  REJECTED: number;
  CONVERTED: number;
  EXPIRED: number;
}

interface QuotationTabsProps {
  counts?: Counts;
}

const TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Sent", value: "SENT" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Expired", value: "EXPIRED" },
];

export function QuotationTabs({ counts }: QuotationTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("status") || "all";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/d8f2a1/admin/quotations?${params.toString()}`);
  };

  return (
    <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide">
      <div className="flex gap-1 border-b border-neutral-200 min-w-max">
        {TABS.map((tab) => {
          const count = counts?.[tab.value as keyof Counts];
          const isActive = currentTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                isActive
                  ? "text-black border-b-2 border-black -mb-[1px]"
                  : "text-neutral-400 hover:text-neutral-700"
              )}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[9px] font-bold px-1",
                    isActive ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
