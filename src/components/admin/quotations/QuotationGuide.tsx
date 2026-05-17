"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, HelpCircle, MessageCircle, BookOpen,
  Send, LoaderCircle, ClipboardList, FileEdit,
  Send as SendIcon, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuotationGuideProps {
  open: boolean;
  onClose: () => void;
  quotation: any;
  currentStage?: string;
}

const GUIDE_STEPS = [
  {
    stage: "Stage 1 — Review",
    icon: ClipboardList,
    steps: [
      "Read the customer information: name, email, company, phone.",
      "Review every item requested and note the quantities.",
      "Enter a negotiated Unit Price (PKR) per item — this is the direct price you're offering.",
      "Optionally enter a per-unit Discount (PKR). The line total updates live.",
      'Click "Save Prices". Totals preview updates immediately.',
      "Move to Stage 2 — Draft.",
    ],
  },
  {
    stage: "Stage 2 — Draft",
    icon: FileEdit,
    steps: [
      'If the draft is empty, click "Regenerate" to generate an AI cover letter.',
      "The AI uses the customer name, company, and items as context.",
      "You can freely edit the text in the textarea.",
      'Click "Save Draft" to persist your edits.',
      "Move to Stage 3 — Send.",
    ],
  },
  {
    stage: "Stage 3 — Send",
    icon: SendIcon,
    steps: [
      'Click "Download Preview PDF" and verify it looks correct before sending.',
      "The PDF includes your logo, item table with prices/discounts, totals, and terms.",
      'Click "Approve & Send Quotation" to email the PDF + cover letter to the customer.',
      "Status automatically changes to SENT.",
      "Move to Stage 4 — Track.",
    ],
  },
  {
    stage: "Stage 4 — Track",
    icon: BarChart2,
    steps: [
      "After sending, the status is SENT. Monitor for customer reply.",
      "When they respond: update status to ACCEPTED or REJECTED manually.",
      "If they request changes, return to Stage 1, update prices, and send again.",
      'When accepted and advance payment received, click "Convert to Order & Email Customer".',
      "This creates a real order, marks the quotation CONVERTED, and emails the customer.",
      'Use "Extend 7 Days" if the customer needs more time to decide.',
    ],
  },
];

export function QuotationGuide({ open, onClose, quotation, currentStage }: QuotationGuideProps) {
  const [panel, setPanel]     = useState<"guide" | "ai">("guide");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm your quotation assistant. I have full context about this quotation — ${quotation?.name || "customer"}, ${Array.isArray(quotation?.items) ? quotation.items.length : 0} items, status: ${quotation?.status || "PENDING"}. Ask me anything about the workflow, pricing, or what to do next.`,
    },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const itemsList = Array.isArray(quotation?.items)
      ? quotation.items.map((i: any) => `${i.quantity}x ${i.productName || "Product"}${i.unitPrice ? ` @ PKR ${i.unitPrice}` : ""}`).join(", ")
      : "unknown items";

    try {
      const res = await fetch("/api/ai/quotation-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          question: userMsg,
          name: quotation?.name,
          company: quotation?.company,
          items: itemsList,
          quotationId: quotation?.id,
          status: quotation?.status,
          currentStage,
        }),
      });

      const data = await res.json();
      const reply = data?.reply || "Sorry, I couldn't generate a response. Please check the Guide tab.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting. Please refer to the Guide tab for step-by-step instructions." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 animate-in fade-in duration-200" onClick={onClose}/>

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-black"/>
            <span className="text-[12px] font-black uppercase tracking-widest text-black">Quotation Guide</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 rounded-full">
            <X className="w-4 h-4 text-neutral-600"/>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 shrink-0">
          {[
            { id: "guide", label: "Guide",        icon: BookOpen },
            { id: "ai",    label: "AI Assistant", icon: MessageCircle },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setPanel(t.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                  panel === t.id ? "text-black border-b-2 border-black" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <Icon className="w-3.5 h-3.5"/>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Guide panel ─────────────────────────────────────────────── */}
        {panel === "guide" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Follow these 4 stages in order to process a quotation from request to order.
            </p>
            {GUIDE_STEPS.map((step, i) => {
              const Icon = step.icon;
              const stageKeys = ["review", "draft", "send", "track"];
              const isCurrent = currentStage === stageKeys[i];
              return (
                <div key={i} className={cn("border overflow-hidden", isCurrent ? "border-black" : "border-neutral-200")}>
                  <div className={cn("flex items-center gap-3 px-4 py-3", isCurrent ? "bg-black" : "bg-neutral-50")}>
                    <Icon className={cn("w-4 h-4 shrink-0", isCurrent ? "text-white" : "text-neutral-500")}/>
                    <span className={cn("text-[11px] font-black uppercase tracking-widest", isCurrent ? "text-white" : "text-black")}>
                      {step.stage}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-white/70">← You are here</span>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <ol className="space-y-2">
                      {step.steps.map((s, j) => (
                        <li key={j} className="flex gap-2 text-[11px] text-neutral-600 leading-relaxed">
                          <span className="text-neutral-300 font-bold shrink-0">{j + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── AI panel ────────────────────────────────────────────────── */}
        {panel === "ai" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] text-[12px] leading-relaxed px-4 py-3",
                    m.role === "user"
                      ? "ml-auto bg-black text-white rounded-tl-xl rounded-bl-xl rounded-tr-sm"
                      : "mr-auto bg-neutral-100 text-neutral-800 rounded-tr-xl rounded-br-xl rounded-tl-sm"
                  )}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin"/> Thinking…
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div className="border-t border-neutral-200 p-4 flex gap-2 shrink-0">
              <input
                className="flex-1 h-10 px-3 border border-neutral-200 text-[12px] focus:outline-none focus:border-black transition-colors"
                placeholder="Ask anything about this quotation…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <Button
                className="h-10 w-10 p-0 bg-black hover:bg-neutral-800 rounded-none shrink-0"
                onClick={handleSend}
                disabled={loading || !input.trim()}
              >
                <Send className="w-4 h-4 text-white"/>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
