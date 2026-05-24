import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { QuotationTabs } from "@/components/admin/quotations/QuotationTabs";
import { QuotationTable } from "@/components/admin/quotations/QuotationTable";
import { logger } from "@/lib/utils/logger";
import { QuotationStatus } from "@prisma/client";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { CountryFilterToggle } from "@/components/admin/orders/CountryFilterToggle";

export const dynamic = "force-dynamic";

interface QuotationsPageProps {
  searchParams: Promise<{ status?: string; country?: string }>;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    logger.auth("Unauthorized access attempt to admin quotations page", {
      userId: session?.userId,
      role: session?.role,
    });
    redirect("/login");
  }

  const params = await searchParams;
  const status = params.status || "all";
  const country = params.country || "";

  try {
    const whereClause: any = {};
    if (status !== "all") {
      whereClause.status = status as QuotationStatus;
    }
    
    if (country === "PK") {
      whereClause.OR = [
        { country: { equals: "PK", mode: "insensitive" } },
        { country: { equals: "Pakistan", mode: "insensitive" } },
        { country: null },
        { country: "" }
      ];
    } else if (country === "UK") {
      whereClause.OR = [
        { country: { equals: "UK", mode: "insensitive" } },
        { country: { equals: "United Kingdom", mode: "insensitive" } },
        { country: { equals: "GB", mode: "insensitive" } }
      ];
    }

    const countWhereClause = { ...whereClause };
    delete countWhereClause.status;

    // Fetch filtered list + all counts in parallel
    const [quotations, allCounts] = await Promise.all([
      db.quotation.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      }),
      db.quotation.groupBy({
        where: countWhereClause,
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    // Build counts object for tabs
    const counts = {
      all: 0,
      PENDING: 0,
      SENT: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      CONVERTED: 0,
      EXPIRED: 0,
    } as Record<string, number>;

    for (const row of allCounts) {
      counts[row.status] = row._count.id;
      counts.all += row._count.id;
    }

    return (
      <div className="min-h-screen bg-[#FDFDFD]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-100 pb-5">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold">
                Admin
              </p>
              <h1
                data-testid="page-heading"
                className="text-2xl font-bold tracking-tight text-neutral-900"
              >
                Quotation Inbox
              </h1>
              <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">
                Review and manage B2B bulk order quotation requests.
              </p>
            </div>

            {/* Guide button */}
            <Link
              href={`/d8f2a1/admin/quotations?guide=1`}
              className="inline-flex items-center gap-2 h-9 px-4 border border-neutral-200 hover:border-black transition-all text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Guide
            </Link>
          </div>

          <CountryFilterToggle currentCountry={country} resourceName="Quotations" />

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <QuotationTabs counts={counts as any} />

          {/* ── Table ───────────────────────────────────────────────────── */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <QuotationTable quotations={quotations} />
          </div>

          {/* ── Footer Meta ─────────────────────────────────────────────── */}
          <div className="flex justify-between items-center pt-4 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
            <span>Showing {quotations.length} requests</span>
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch quotations", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-neutral-900">Error Loading Quotations</h2>
          <p className="text-sm text-neutral-500">Please try again or contact support.</p>
        </div>
      </div>
    );
  }
}
