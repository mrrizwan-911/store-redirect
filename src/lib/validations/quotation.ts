import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

// ─── Customer Submission ──────────────────────────────────────────────────────

export const quotationItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(10, "Minimum quantity for quotation is 10 units"),
  notes: z.string().optional(),
});

export const quotationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
});

// ─── Admin: General Status / Draft Update ────────────────────────────────────

export const quotationUpdateSchema = z.object({
  status: z.nativeEnum(QuotationStatus).optional(),
  aiDraft: z.string().optional(),
  expiresAt: z.string().datetime().or(z.date()).optional(),
});

// ─── Admin: Per-Item Pricing ──────────────────────────────────────────────────
// Admin sets a direct negotiated unit price and an optional fixed discount per
// item. No percentage logic — admin tells the customer the exact price.

export const quotationItemWithPriceSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
  // Admin-set fields (optional — absent until admin prices the quotation)
  unitPrice: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(), // fixed PKR discount per unit
  productName: z.string().optional(),           // enriched at read time
});

export const quotationPricingUpdateSchema = z.object({
  items: z.array(quotationItemWithPriceSchema).min(1),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuotationInput = z.infer<typeof quotationSchema>;
export type QuotationUpdateInput = z.infer<typeof quotationUpdateSchema>;
export type QuotationItemWithPrice = z.infer<typeof quotationItemWithPriceSchema>;
export type QuotationPricingUpdateInput = z.infer<typeof quotationPricingUpdateSchema>;
