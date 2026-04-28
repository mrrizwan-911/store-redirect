import { db } from "@/lib/db/client";
import { getUserSession } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { QuotationDetail } from '@/components/admin/quotations/QuotationDetail';
import { logger } from "@/lib/utils/logger";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface QuotationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const session = await getUserSession();

  if (!session || session.role !== "ADMIN") {
    logger.auth("Unauthorized access attempt to admin quotation detail page", {
      userId: session?.userId,
      role: session?.role
    });
    redirect("/login");
  }

  const { id } = await params;

  logger.info("Fetching quotation detail", { quotationId: id });

  try {
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!quotation) {
      logger.warn("Quotation not found", { quotationId: id });
      return notFound();
    }

    // Enrich items with product names
    const items = quotation.items as any[];
    const productIds = items.map((item: any) => item.productId);

    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const enrichedQuotation = {
      ...quotation,
      items: items.map((item: any) => ({
        ...item,
        name: products.find((p) => p.id === item.productId)?.name || "Unknown Product"
      }))
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Back button and Status */}
          <div className="flex flex-col gap-4 border-b border-neutral-100 pb-6">
            <Link
              href="/admin/quotations"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors w-fit border border-neutral-200 px-3 py-1 rounded-md hover:bg-neutral-50"
            >
              <ChevronLeft className="w-3 h-3" /> Back to Inbox
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Quotation Detail
                </h1>
                <p className="text-xs text-neutral-400">
                  REF: <span className="font-mono text-neutral-600">{quotation.id.slice(-8).toUpperCase()}</span> • RECEIVED {new Date(quotation.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest border rounded-full shadow-sm ${
                  quotation.status === 'PENDING' ? 'bg-neutral-50 border-neutral-200 text-neutral-600' :
                  quotation.status === 'SENT' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                  quotation.status === 'ACCEPTED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                  quotation.status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                  quotation.status === 'CONVERTED' ? 'bg-neutral-900 border-neutral-900 text-white' :
                  'bg-neutral-800 border-neutral-800 text-white'
                }`}>
                  {quotation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <QuotationDetail quotation={enrichedQuotation as any} />
          </div>

          {/* Footer Meta */}
          <div className="pt-8 flex justify-end">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
              Last updated: {new Date(quotation.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error("Failed to fetch quotation detail", error);
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Error Loading Quotation</h2>
          <p className="text-sm text-neutral-500">Please try again later or contact support.</p>
          <Link href="/admin/quotations">
            <Button variant="outline" className="rounded-lg border-neutral-200 mt-4 uppercase text-[10px] font-bold tracking-widest px-6">
              Return to Inbox
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}
