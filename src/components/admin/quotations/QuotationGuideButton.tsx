"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { QuotationGuide } from "./QuotationGuide";

interface Props {
  quotation: any;
}

export function QuotationGuideButton({ quotation }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-4 border border-neutral-200 hover:border-black transition-all text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Guide
      </button>

      <QuotationGuide
        open={open}
        onClose={() => setOpen(false)}
        quotation={quotation}
        currentStage={undefined}
      />
    </>
  );
}
