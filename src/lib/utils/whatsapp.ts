/**
 * WhatsApp URL generation helpers.
 * All functions accept an optional `phoneOverride` (digits only, e.g. "923001234567").
 * Callers should resolve the number from /api/settings (whatsappNumber field), falling
 * back to process.env.NEXT_PUBLIC_WHATSAPP_NUMBER as a last resort.
 */

const fallbackPhone = () =>
  (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^0-9]/g, '')

function buildUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${digits || fallbackPhone()}?text=${encodeURIComponent(message)}`
}

// ── PDP: Order via WhatsApp ───────────────────────────────────────────────────
export interface WhatsAppOrderParams {
  productName: string
  sku?: string
  size?: string
  color?: string
  quantity: number
  unitPrice: number
  total: number
  productUrl: string
  currencySymbol?: string
  phoneOverride?: string
}

export function generateWhatsAppOrderUrl(params: WhatsAppOrderParams): string {
  const {
    productName, sku, size, color, quantity,
    unitPrice, total, productUrl,
    currencySymbol = 'PKR',
    phoneOverride = '',
  } = params

  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`

  const lines = [
    `*New Order Request — CALNZA* 🛍️`,
    ``,
    `*Product:* ${productName}`,
    sku   ? `*SKU:* ${sku}` : null,
    color ? `*Color:* ${color}` : null,
    size  ? `*Size:* ${size}` : null,
    `*Quantity:* ${quantity}`,
    `*Unit Price:* ${fmt(unitPrice)}`,
    `*Total:* ${fmt(total)}`,
    ``,
    `*Link:* ${productUrl}`,
    ``,
    `Please confirm availability and delivery details. Thank you!`,
  ]

  return buildUrl(phoneOverride, lines.filter(l => l !== null).join('\n'))
}

// ── Cart: Order via WhatsApp ──────────────────────────────────────────────────
export interface CartItemForWhatsApp {
  name: string
  size?: string
  color?: string
  quantity: number
  price: number
}

export function generateWhatsAppCartUrl(
  items: CartItemForWhatsApp[],
  total: number,
  currencySymbol = 'PKR',
  phoneOverride = '',
): string {
  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`

  const itemLines = items.map(item => {
    const variant = [item.color, item.size].filter(Boolean).join(' / ')
    return `• ${item.name}${variant ? ` (${variant})` : ''} × ${item.quantity} — ${fmt(item.price)}`
  })

  const message = [
    `*Cart Order — CALNZA* 🛒`,
    ``,
    ...itemLines,
    ``,
    `*Total: ${fmt(total)}*`,
    ``,
    `Please confirm availability and delivery details. Thank you!`,
  ].join('\n')

  return buildUrl(phoneOverride, message)
}

// ── Order confirmation / help button ─────────────────────────────────────────
export interface OrderConfirmationParams {
  orderNumber: string
  total: number
  paymentMethod: string
  itemsCount: number
  currencySymbol?: string
  phoneOverride?: string
}

export function generateWhatsAppOrderConfirmationUrl(params: OrderConfirmationParams): string {
  const {
    orderNumber, total, paymentMethod, itemsCount,
    currencySymbol = 'PKR',
    phoneOverride = '',
  } = params

  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`

  const message = [
    `Hi! I've just placed an order on CALNZA.`,
    ``,
    `*Order:* #${orderNumber}`,
    `*Items:* ${itemsCount}`,
    `*Total:* ${fmt(total)}`,
    `*Payment:* ${paymentMethod}`,
    ``,
    `Please process my order as soon as possible. Thank you!`,
  ].join('\n')

  return buildUrl(phoneOverride, message)
}

// ── Account orders: Inquiry about an order ────────────────────────────────────
export interface OrderInquiryParams {
  orderNumber: string
  status: string
  total: number
  createdAt: string
  itemsCount?: number
  trackingNumber?: string | null
  carrier?: string | null
  paymentMethod?: string
  currencySymbol?: string
  phoneOverride?: string
}

export function generateWhatsAppOrderInquiryUrl(params: OrderInquiryParams): string {
  const {
    orderNumber, status, total, createdAt,
    itemsCount, trackingNumber, carrier, paymentMethod,
    currencySymbol = 'PKR',
    phoneOverride = '',
  } = params

  const fmt = (n: number) => `${currencySymbol} ${n.toLocaleString()}`
  const date = new Date(createdAt).toLocaleDateString('en-GB', { dateStyle: 'long' })

  const lines = [
    `Hi! I'd like to enquire about my order on CALNZA.`,
    ``,
    `*Order:* #${orderNumber}`,
    `*Placed:* ${date}`,
    `*Status:* ${status}`,
    `*Total:* ${fmt(total)}`,
    paymentMethod  ? `*Payment:* ${paymentMethod}` : null,
    itemsCount     ? `*Items:* ${itemsCount}` : null,
    trackingNumber ? `*Tracking:* ${carrier ? `${carrier} — ` : ''}${trackingNumber}` : null,
    ``,
    `Could you please update me on the current status or expected delivery? Thank you!`,
  ]

  return buildUrl(phoneOverride, lines.filter(l => l !== null).join('\n'))
}
