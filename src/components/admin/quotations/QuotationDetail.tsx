"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Quotation, QuotationStatus, User } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  FileEdit,
  Send,
  BarChart2,
  Save,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  LoaderCircle,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Package,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuotationGuide } from "./QuotationGuide";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuotationItemWithPrice {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  notes?: string;
  unitPrice?: number;
  discountAmount?: number;
}

interface QuotationDetailProps {
  quotation: Quotation & {
    user?: User | null;
    items: QuotationItemWithPrice[];
  };
}

// ─── Stages ───────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "review", label: "Review", icon: ClipboardList, step: 1 },
  { id: "draft",  label: "Draft",  icon: FileEdit,      step: 2 },
  { id: "send",   label: "Send",   icon: Send,          step: 3 },
  { id: "track",  label: "Track",  icon: BarChart2,     step: 4 },
] as const;

type StageId = (typeof STAGES)[number]["id"];

function statusToStage(status: QuotationStatus): StageId {
  if (status === "PENDING") return "review";
  return "track";
}

function statusBadge(status: QuotationStatus) {
  switch (status) {
    case "PENDING":   return "bg-amber-50 text-amber-700 border-amber-200";
    case "SENT":      return "bg-blue-50 text-blue-700 border-blue-200";
    case "ACCEPTED":  return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REJECTED":  return "bg-rose-50 text-rose-700 border-rose-200";
    case "CONVERTED": return "bg-black text-white border-black";
    case "EXPIRED":   return "bg-neutral-100 text-neutral-500 border-neutral-200";
    default:          return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuotationDetail({ quotation }: QuotationDetailProps) {
  const router = useRouter();

  const [activeStage, setActiveStage] = useState<StageId>(statusToStage(quotation.status));
  const [items, setItems]             = useState<QuotationItemWithPrice[]>(quotation.items || []);
  const [aiDraft, setAiDraft]         = useState(quotation.aiDraft || "");
  // Track the *live* status so UI reflects changes immediately without a full reload
  const [liveStatus, setLiveStatus]   = useState<QuotationStatus>(quotation.status);
  const [selectStatus, setSelectStatus] = useState<QuotationStatus>(quotation.status);
  const [showGuide, setShowGuide]     = useState(false);

  // Granular loading flags
  const [saving,          setSaving]          = useState(false);
  const [regenerating,    setRegenerating]    = useState(false);
  const [savingDraft,     setSavingDraft]     = useState(false);
  const [approving,       setApproving]       = useState(false);
  const [updatingStatus,  setUpdatingStatus]  = useState(false);
  const [extendingExpiry, setExtendingExpiry] = useState(false);
  const [converting,      setConverting]      = useState(false);

  // ── PATCH helper ──────────────────────────────────────────────────────────
  async function patch(body: object, successMsg?: string) {
    const res = await fetch(`/api/admin/quotations/${quotation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "Update failed");
    if (successMsg) toast.success(successMsg);
    router.refresh();
    return result;
  }

  // ── Save prices ───────────────────────────────────────────────────────────
  async function handleSavePrices() {
    setSaving(true);
    try {
      await patch({ items }, "Prices saved successfully");
    } catch {
      toast.error("Failed to save prices");
    } finally {
      setSaving(false);
    }
  }

  // ── Regenerate AI draft (calls the real API endpoint) ────────────────────
  async function handleRegenerateDraft() {
    setRegenerating(true);
    const toastId = toast.loading("Generating AI draft…");
    try {
      const res = await fetch("/api/ai/quotation-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate",
          name: quotation.name,
          company: quotation.company,
          addressLine1: quotation.addressLine1,
          addressLine2: quotation.addressLine2,
          city: quotation.city,
          province: quotation.province,
          postalCode: quotation.postalCode,
          country: quotation.country,
          items: items.map((i) => `${i.quantity}x ${i.productName}${i.variantName ? ` - ${i.variantName}` : ""}`),
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setAiDraft(data.draft);
        toast.success("Draft regenerated", { id: toastId });
      } else {
        toast.error(data.error || "No draft returned", { id: toastId });
      }
    } catch (e: any) {
      toast.error("Failed to regenerate draft: " + (e.message || ""), { id: toastId });
    } finally {
      setRegenerating(false);
    }
  }

  // ── Save draft ────────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      await patch({ aiDraft }, "Draft saved");
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  // ── Download PDF ──────────────────────────────────────────────────────────
  async function handleDownloadPDF() {
    const toastId = toast.loading("Generating PDF…");
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}/download-pdf`);
      if (!res.ok) throw new Error("Server error generating PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Calnza-Quotation-${quotation.id.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded", { id: toastId });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate PDF", { id: toastId });
    }
  }

  // ── Approve & Send ────────────────────────────────────────────────────────
  async function handleApproveAndSend() {
    setApproving(true);
    const toastId = toast.loading("Generating PDF and sending email…");
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}/approve`, {
        method: "POST",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast.success("Quotation sent to customer!", { id: toastId });
      setLiveStatus("SENT");
      setSelectStatus("SENT");
      setActiveStage("track");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to send", { id: toastId });
    } finally {
      setApproving(false);
    }
  }

  // ── Update status ─────────────────────────────────────────────────────────
  async function handleStatusChange() {
    if (selectStatus === liveStatus) return;
    setUpdatingStatus(true);
    try {
      await patch({ status: selectStatus }, `Status updated to ${selectStatus}`);
      // Reflect immediately in UI without waiting for server re-render
      setLiveStatus(selectStatus);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── Extend expiry ─────────────────────────────────────────────────────────
  async function handleExtendExpiry() {
    setExtendingExpiry(true);
    try {
      const base = quotation.expiresAt ? new Date(quotation.expiresAt) : new Date();
      const newExpiry = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
      await patch({ expiresAt: newExpiry.toISOString() }, "Expiry extended by 7 days");
    } catch {
      toast.error("Failed to extend expiry");
    } finally {
      setExtendingExpiry(false);
    }
  }

  // ── Convert to order ──────────────────────────────────────────────────────
  async function handleConvertToOrder() {
    setConverting(true);
    const toastId = toast.loading("Creating order and sending confirmation email…");
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}/convert-to-order`, {
        method: "POST",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      toast.success(
        `Order created! ${result.data?.order?.orderNumber || ""} — email sent to customer.`,
        { id: toastId, duration: 6000 }
      );
      setLiveStatus("CONVERTED");
      setSelectStatus("CONVERTED");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to convert quotation to order", { id: toastId });
    } finally {
      setConverting(false);
    }
  }

  // ── Derived totals ────────────────────────────────────────────────────────
  const subtotal      = items.reduce((a, i) => a + (i.unitPrice || 0) * i.quantity, 0);
  const totalDiscount = items.reduce((a, i) => a + (i.discountAmount || 0) * i.quantity, 0);
  const grandTotal    = subtotal - totalDiscount;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Guide modal */}
      <QuotationGuide
        open={showGuide}
        onClose={() => setShowGuide(false)}
        quotation={{ ...quotation, status: liveStatus, items }}
        currentStage={activeStage}
      />

      {/* Stage tabs */}
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
        <div className="flex gap-1 border-b border-neutral-200 min-w-max">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const active = activeStage === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(s.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  active
                    ? "text-black border-b-2 border-black -mb-[1px]"
                    : "text-neutral-400 hover:text-neutral-700"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0",
                  active ? "bg-black text-white" : "bg-neutral-100 text-neutral-400"
                )}>
                  {s.step}
                </span>
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Stage content ─────────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-300">

        {/* ══ STAGE 1 — REVIEW ══════════════════════════════════════════ */}
        {activeStage === "review" && (
          <div className="space-y-6">
            <InfoBanner color="amber">
              <strong>What to do here:</strong> Review the customer&apos;s request, set a negotiated
              unit price (and optional per-unit discount) for each item. Click{" "}
              <strong>Save Prices</strong>, then move to <strong>Stage 2 — Draft</strong>.
            </InfoBanner>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer info */}
              <Panel title="Customer Information">
                <div className="p-5 space-y-3">
                  <InfoRow icon={<UserIcon className="w-3.5 h-3.5"/>} label="Name"      value={quotation.name} />
                  <InfoRow icon={<Mail      className="w-3.5 h-3.5"/>} label="Email"     value={quotation.email} />
                  {quotation.phone   && <InfoRow icon={<Phone     className="w-3.5 h-3.5"/>} label="Phone"    value={quotation.phone} />}
                  {quotation.company && <InfoRow icon={<Building2 className="w-3.5 h-3.5"/>} label="Company"  value={quotation.company} />}
                  <InfoRow icon={<Clock className="w-3.5 h-3.5"/>} label="Submitted"
                    value={new Date(quotation.createdAt).toLocaleDateString("en-PK",
                      { year: "numeric", month: "long", day: "numeric" })} />
                  <div className="pt-2">
                    <span className={cn("inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-full", statusBadge(liveStatus))}>
                      {liveStatus}
                    </span>
                  </div>
                </div>
              </Panel>

              {/* Pricing editor */}
              <div className="border border-neutral-200 bg-white">
                <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">Item Pricing</h3>
                  <span className="text-[10px] text-neutral-400 font-bold">PKR</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-bold text-black">
                            {item.productName}
                            {item.variantName && <span className="text-neutral-500 font-normal ml-1">({item.variantName})</span>}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Qty: {item.quantity}{item.notes && ` · ${item.notes}`}
                          </p>
                        </div>
                        <Package className="w-4 h-4 text-neutral-300 shrink-0 mt-1"/>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Unit Price", key: "unitPrice" as const },
                          { label: "Discount / Unit", key: "discountAmount" as const },
                        ].map(({ label, key }) => (
                          <label key={key} className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">{label}</span>
                            <input
                              type="number" min="0"
                              className="h-9 px-3 border border-neutral-200 text-[12px] font-bold text-black focus:outline-none focus:border-black transition-colors w-full"
                              placeholder="0"
                              value={item[key] ?? ""}
                              onChange={(e) => {
                                const copy = [...items];
                                copy[idx] = { ...copy[idx], [key]: e.target.value === "" ? undefined : Number(e.target.value) };
                                setItems(copy);
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      {item.unitPrice !== undefined && (
                        <div className="flex justify-between text-[10px] font-bold text-neutral-500 bg-neutral-50 px-3 py-2">
                          <span>Line Total</span>
                          <span className="text-black font-mono">
                            PKR {(((item.unitPrice || 0) - (item.discountAmount || 0)) * item.quantity).toLocaleString("en-PK")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {subtotal > 0 && (
                  <div className="border-t border-neutral-200 bg-neutral-950 text-white px-5 py-4 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                      <span>Subtotal</span><span>PKR {subtotal.toLocaleString("en-PK")}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        <span>Total Discount</span><span>-PKR {totalDiscount.toLocaleString("en-PK")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] font-black text-white uppercase tracking-widest border-t border-white/20 pt-2 mt-2">
                      <span>Grand Total</span><span>PKR {grandTotal.toLocaleString("en-PK")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <ActionButton onClick={handleSavePrices} loading={saving} icon={<Save className="w-4 h-4"/>}>
                Save Prices
              </ActionButton>
              <OutlineButton onClick={() => setActiveStage("draft")}>
                Next: Draft <ArrowRight className="w-4 h-4 ml-2"/>
              </OutlineButton>
            </div>
          </div>
        )}

        {/* ══ STAGE 2 — DRAFT ═══════════════════════════════════════════ */}
        {activeStage === "draft" && (
          <div className="space-y-6">
            <InfoBanner color="blue">
              <strong>What to do here:</strong> Review and edit the AI-generated cover letter.
              Click <strong>Regenerate</strong> for a fresh draft. Click <strong>Save Draft</strong>, then move to <strong>Stage 3 — Send</strong>.
            </InfoBanner>

            <div className="border border-neutral-200 bg-white">
              <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">Email Cover Letter</h3>
                <button
                  onClick={handleRegenerateDraft}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors disabled:opacity-50"
                >
                  {regenerating
                    ? <LoaderCircle className="w-3.5 h-3.5 animate-spin"/>
                    : <RefreshCw className="w-3.5 h-3.5"/>}
                  Regenerate
                </button>
              </div>
              <div className="p-5">
                {aiDraft.trim() === "" && !regenerating && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-bold">
                    No draft yet — click <strong>Regenerate</strong> to generate one with AI.
                  </div>
                )}
                <Textarea
                  value={aiDraft}
                  onChange={(e) => setAiDraft(e.target.value)}
                  className="min-h-[280px] rounded-none border-neutral-200 text-[13px] leading-relaxed font-mono resize-none focus:border-black"
                  placeholder="Click Regenerate to generate an AI draft, or type your own cover letter here…"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <ActionButton onClick={handleSaveDraft} loading={savingDraft} icon={<Save className="w-4 h-4"/>}>
                Save Draft
              </ActionButton>
              <OutlineButton onClick={() => setActiveStage("send")}>
                Next: Send <ArrowRight className="w-4 h-4 ml-2"/>
              </OutlineButton>
            </div>
          </div>
        )}

        {/* ══ STAGE 3 — SEND ════════════════════════════════════════════ */}
        {activeStage === "send" && (
          <div className="space-y-6">
            <InfoBanner color="emerald">
              <strong>What to do here:</strong> Download the PDF to verify it. When correct, click{" "}
              <strong>Approve &amp; Send</strong> — generates the final PDF, emails it to the customer,
              and sets status to <strong>SENT</strong>.
            </InfoBanner>

            <Panel title="Pre-Send Checklist">
              <div className="p-5 space-y-3">
                {[
                  { label: "Customer info reviewed",       done: true },
                  { label: "Prices set for all items",     done: items.every((i) => (i.unitPrice ?? 0) > 0) },
                  { label: "Cover letter draft ready",     done: aiDraft.trim().length > 20 },
                  { label: "Quotation is Pending",         done: liveStatus === "PENDING" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {c.done
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/>
                      : <XCircle className="w-4 h-4 text-amber-400 shrink-0"/>}
                    <span className={cn("text-[12px] font-bold", c.done ? "text-black" : "text-amber-700")}>
                      {c.label} {c.label === "Quotation is Pending" && liveStatus !== "PENDING" && `(Current: ${liveStatus})`}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            {grandTotal > 0 && (
              <div className="border border-neutral-200 bg-neutral-950 text-white px-6 py-5">
                <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">Quotation Total</p>
                <p className="text-3xl font-black tracking-tight">PKR {grandTotal.toLocaleString("en-PK")}</p>
                {totalDiscount > 0 && (
                  <p className="text-[11px] text-neutral-400 mt-1 font-bold">
                    Includes PKR {totalDiscount.toLocaleString("en-PK")} discount
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <OutlineButton onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2"/> Download Preview PDF
              </OutlineButton>
              <ActionButton
                onClick={handleApproveAndSend}
                loading={approving}
                disabled={liveStatus === "SENT"}
                icon={<Send className="w-4 h-4"/>}
              >
                {liveStatus === "SENT" ? "Already Sent" : "Approve & Send Quotation"}
              </ActionButton>
            </div>
          </div>
        )}

        {/* ══ STAGE 4 — TRACK ═══════════════════════════════════════════ */}
        {activeStage === "track" && (
          <div className="space-y-6">
            <InfoBanner color="neutral">
              <strong>What to do here:</strong> Monitor the customer&apos;s response. Update the status
              manually when they reply. When accepted and advance payment received, click{" "}
              <strong>Convert to Order</strong> to create a real order and email the customer.
            </InfoBanner>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current status card */}
              <Panel title="Current Status">
                <div className="p-5 space-y-4">
                  <span className={cn("inline-block px-4 py-2 text-[12px] font-black uppercase tracking-widest border rounded-full", statusBadge(liveStatus))}>
                    {liveStatus}
                  </span>
                  <p className="text-[11px] text-neutral-500 font-bold">
                    {liveStatus === "PENDING"   && "Awaiting review. Set prices and send the quotation."}
                    {liveStatus === "SENT"      && "Quotation emailed to customer. Awaiting their response."}
                    {liveStatus === "ACCEPTED"  && "Customer accepted! Set advance payment and convert to order."}
                    {liveStatus === "REJECTED"  && "Customer declined. Consider following up with a revised offer."}
                    {liveStatus === "CONVERTED" && "This quotation has been converted to a confirmed order."}
                    {liveStatus === "EXPIRED"   && "This quotation has passed its validity date."}
                  </p>
                </div>
              </Panel>

              {/* Update status */}
              <Panel title="Update Status">
                <div className="p-5 space-y-4">
                  <Select value={selectStatus} onValueChange={(v) => setSelectStatus(v as QuotationStatus)}>
                    <SelectTrigger className="rounded-none border-neutral-200 text-[12px] font-bold h-10">
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="PENDING">Pending Review</SelectItem>
                      <SelectItem value="SENT">Sent to Customer</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CONVERTED">Converted to Order</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full h-10 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-none"
                    onClick={handleStatusChange}
                    disabled={updatingStatus || selectStatus === liveStatus}
                  >
                    {updatingStatus && <LoaderCircle className="w-4 h-4 animate-spin mr-2"/>}
                    Update Status
                  </Button>
                </div>
              </Panel>

              {/* Expiry */}
              <Panel title="Validity Period">
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400"/>
                    <span className="text-[12px] font-bold text-black">
                      {quotation.expiresAt
                        ? new Date(quotation.expiresAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
                        : "No expiry set"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="h-9 px-4 border-neutral-200 hover:border-black text-[10px] font-bold uppercase tracking-widest rounded-none transition-all"
                    onClick={handleExtendExpiry}
                    disabled={extendingExpiry}
                  >
                    {extendingExpiry
                      ? <LoaderCircle className="w-3.5 h-3.5 animate-spin mr-1.5"/>
                      : <PlusCircle className="w-3.5 h-3.5 mr-1.5"/>}
                    Extend 7 Days
                  </Button>
                </div>
              </Panel>

              {/* Convert to order */}
              <Panel title="Convert to Order">
                <div className="p-5 space-y-4">
                  {liveStatus === "CONVERTED" ? (
                    <div className="flex items-center gap-2 text-[12px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-4 py-3">
                      <CheckCircle className="w-4 h-4 shrink-0"/>
                      This quotation has already been converted to an order.
                    </div>
                  ) : (
                    <>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Once the customer has <strong>accepted</strong> and confirmed advance payment,
                        click below. This will create a real order, update the quotation status to{" "}
                        <strong>CONVERTED</strong>, and send an order confirmation email to the customer.
                      </p>
                      {liveStatus !== "ACCEPTED" && liveStatus !== "SENT" && (
                        <div className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-4 py-2">
                          Tip: Update status to ACCEPTED first, then convert.
                        </div>
                      )}
                      <Button
                        className="w-full h-11 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-none"
                        onClick={handleConvertToOrder}
                        disabled={converting || liveStatus === "REJECTED" || liveStatus === "EXPIRED"}
                      >
                        {converting
                          ? <><LoaderCircle className="w-4 h-4 animate-spin mr-2"/>Creating Order…</>
                          : <><ShoppingCart className="w-4 h-4 mr-2"/>Convert to Order &amp; Email Customer</>}
                      </Button>
                    </>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Small shared sub-components ─────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-neutral-200 bg-white">
      <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-neutral-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[9px] uppercase tracking-widest font-bold text-neutral-400">{label}</p>
        <p className="text-[12px] font-bold text-black mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function InfoBanner({ color, children }: { color: "amber"|"blue"|"emerald"|"neutral"; children: React.ReactNode }) {
  const styles = {
    amber:   "bg-amber-50 border-amber-200 text-amber-800",
    blue:    "bg-blue-50 border-blue-200 text-blue-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    neutral: "bg-neutral-50 border-neutral-200 text-neutral-700",
  };
  return (
    <div className={cn("flex items-start gap-3 border p-4", styles[color])}>
      <span className="shrink-0 mt-0.5">💡</span>
      <p className="text-[12px] leading-relaxed">{children}</p>
    </div>
  );
}

function ActionButton({ onClick, loading, disabled, icon, children }: {
  onClick: () => void; loading?: boolean; disabled?: boolean;
  icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Button
      className="h-11 px-8 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-none"
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <LoaderCircle className="w-4 h-4 animate-spin mr-2"/> : icon && <span className="mr-2">{icon}</span>}
      {children}
    </Button>
  );
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant="outline"
      className="h-11 px-6 border-black text-black text-[11px] font-bold uppercase tracking-widest rounded-none hover:bg-black hover:text-white transition-all"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
