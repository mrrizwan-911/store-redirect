import { z } from 'zod'

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const variantOptionSchema = z.object({
  name: z.string(),
  values: z.array(z.string()),
})

export const productVariantSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  optionValues: z.record(z.string(), z.string()).optional(),
  stock: z.number().int().min(0),
  sku: z.string(),
  price: z.number().positive().optional().nullable(),
})

export const productSchema = z.object({
  name: z.string().min(2, 'Product name required'),
  slug: z.string().optional(),  // auto-generated if not provided
  description: z.string().min(20, 'Description must be at least 20 characters'),
  shortDescription: z.string().max(200).optional(),
  categoryId: z.string().min(1, 'Category required'),
  basePrice: z.number().positive('Price must be positive'),
  salePrice: z.number().positive().optional().nullable(),
  sku: z.string().min(2, 'SKU required'),
  baseStock: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().url(),
    publicId: z.string().optional(),
    isPrimary: z.boolean().optional().default(false),
    sortOrder: z.number().optional().default(0),
  })).optional().default([]),
  variantOptions: z.array(variantOptionSchema).optional().default([]),
  variants: z.array(productVariantSchema).default([]),
})

export const flashSaleSchema = z.object({
  name: z.string().min(2),
  discountPct: z.number().int().min(1).max(99),
  startTime: z.string().min(5, 'Invalid time'),  // ISO UTC string
  endTime: z.string().min(5, 'Invalid time'),
  productIds: z.array(z.string()).min(1, 'Select at least one product'),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
}).refine(data => new Date(data.endTime) > new Date(), {
  message: 'End time must be in the future',
  path: ['endTime'],
})

export type ProductInput = z.infer<typeof productSchema>
export type FlashSaleInput = z.infer<typeof flashSaleSchema>
