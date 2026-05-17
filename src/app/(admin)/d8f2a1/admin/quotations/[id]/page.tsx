import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { QuotationDetail } from "@/components/admin/quotations/QuotationDetail";
import { QuotationGuideButton } from "@/components/admin/quotations/QuotationGuideButton";
import { logger } from "@/lib/utils/logger";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  try {
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!quotation) notFound();

    // Enrich items with product names (keep admin-set prices if present)
    const rawItems = quotation.items as any[];
    const productIds = rawItems.map((i: any) => i.productId).filter(Boolean);

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, basePrice: true },
    });

    const enrichedItems = rawItems.map((item: any) => ({
      ...item,
      productName:
        item.productName ||
        products.find((p) => p.id === item.productId)?.name ||
        "Custom Product",
    }));

    const enrichedQuotation = {
      ...quotation,
      items: enrichedItems,
    };

    const statusColors: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
      SENT: "bg-blue-50 text-blue-700 border-blue-200",
      ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
      REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
      CONVERTED: "bg-black text-white border-black",
      EXPIRED: "bg-neutral-100 text-neutral-500 border-neutral-200",
    };

    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* ── Header ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 border-b border-neutral-100 pb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link
                href="/d8f2a1/admin/quotations"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black"
              >
                <ChevronLeft className="w-3 h-3" /> Back to Inbox
              </Link>

              {/* Guide button (client component) */}
              <QuotationGuideButton quotation={enrichedQuotation as any} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold">
                  Quotation Detail
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  {quotation.name}
                  {quotation.company && (
                    <span className="text-neutral-400 font-normal ml-2 text-lg">
                      · {quotation.company}
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-neutral-400 font-mono">
                  REF: {quotation.id.slice(-8).toUpperCase()} · Received{" "}
                  {new Date(quotation.createdAt).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <span
                className={`self-start sm:self-auto inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest border rounded-full ${
                  statusColors[quotation.status] || "bg-neutral-100 text-neutral-600 border-neutral-200"
                }`}
              >
                {quotation.status}
              </span>
            </div>
          </div>

          {/* ── Main content ──────────────────────────────────────────── */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <QuotationDetail quotation={enrichedQuotation as any} />
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <p className="text-right text-[10px] font-bold uppercase tracking-widest text-neutral-300 pt-4">
            Last updated: {new Date(quotation.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch quotation detail", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-neutral-900">Error Loading Quotation</h2>
          <p className="text-sm text-neutral-500">Please try again or contact support.</p>
          <Link
            href="/d8f2a1/admin/quotations"
            className="inline-block mt-4 border border-neutral-200 px-6 h-10 text-[10px] font-bold uppercase tracking-widest hover:border-black transition-all leading-10"
          >
            Return to Inbox
          </Link>
        </div>
      </div>
    );
  }
}
