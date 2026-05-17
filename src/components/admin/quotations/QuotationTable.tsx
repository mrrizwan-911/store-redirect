"use client";

import Link from "next/link";
import { Eye, Building2, User, Calendar, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuotationStatus } from "@prisma/client";

export interface Quotation {
  id: string;
  name: string;
  email: string;
  company: string | null;
  items: any;
  status: QuotationStatus;
  createdAt: Date | string;
  expiresAt: Date | string | null;
}

interface QuotationTableProps {
  quotations: Quotation[];
}

function getStatusStyles(status: QuotationStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "SENT":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200 opacity-70";
    case "CONVERTED":
      return "bg-black text-white border-black";
    case "EXPIRED":
      return "bg-neutral-100 text-neutral-400 border-neutral-200 opacity-60";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function getItemCount(items: any): number {
  return Array.isArray(items) ? items.length : 0;
}

export function QuotationTable({ quotations }: QuotationTableProps) {
  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-neutral-200 rounded-sm bg-neutral-50/40">
        <Package className="w-10 h-10 text-neutral-300 mb-4 stroke-[1.5]" />
        <p className="text-[11px] uppercase tracking-widest font-bold text-neutral-400">
          No quotations found
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Table (md+) ─────────────────────────────────────────────── */}
      <div className="hidden md:block w-full bg-white border border-neutral-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {["REF", "Customer", "Company", "Items", "Submitted", "Expires", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {quotations.map((q) => (
              <tr
                key={q.id}
                data-testid="quotation-row"
                className="hover:bg-neutral-50/60 transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-[10px] font-mono font-bold text-neutral-500">
                    #{q.id.slice(-6).toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-bold text-black">{q.name}</span>
                    <span className="text-[10px] text-neutral-400">{q.email}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {q.company ? (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="text-[12px] text-black">{q.company}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-300">—</span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-[12px] font-bold text-black">{getItemCount(q.items)}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-[11px] text-neutral-600">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-[11px] text-neutral-600">
                    {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : "—"}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-full",
                      getStatusStyles(q.status)
                    )}
                  >
                    {q.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link
                    href={`/d8f2a1/admin/quotations/${q.id}`}
                    data-testid="view-detail-btn"
                    className="inline-flex items-center gap-1.5 h-8 px-3 border border-neutral-200 hover:border-black transition-all text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-black"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards (< md) ────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {quotations.map((q) => (
          <Link
            key={q.id}
            href={`/d8f2a1/admin/quotations/${q.id}`}
            className="block bg-white border border-neutral-200 p-4 active:bg-neutral-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[12px] font-bold text-black">{q.name}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">{q.email}</p>
              </div>
              <span
                className={cn(
                  "inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-full shrink-0",
                  getStatusStyles(q.status)
                )}
              >
                {q.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-neutral-500 font-bold uppercase tracking-wide">
              {q.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {q.company}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {getItemCount(q.items)} items
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(q.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
