import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// BRAND CONFIG TYPE — populated from SiteSettings DB record by each route handler
// ─────────────────────────────────────────────────────────────────────────────
export interface BrandConfig {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  logoBase64?: string; // raw PNG base64 (no "data:image/png;base64," prefix)
}

/** Safe fallback used when DB fetch fails */
export const DEFAULT_BRAND: BrandConfig = {
  name: 'CALNZA',
  tagline: 'PREMIUM APPAREL & ACCESSORIES',
  email: 'concierge@calnza.pk',
  phone: '+92 300 1234567',
  address: 'DHA Phase 6, Lahore, Pakistan',
  website: 'www.calnza.pk',
};

/**
 * Reads /public/bgless-logo.png and returns a base64 string.
 * Call this server-side BEFORE constructing BrandConfig.
 * Returns undefined silently if the file is missing.
 */
export function loadLogoBase64(): string | undefined {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'bgless-logo.png');
    const buffer = fs.readFileSync(logoPath);
    return buffer.toString('base64');
  } catch {
    return undefined;
  }
}

/**
 * Builds a BrandConfig from a SiteSettings DB row + logo base64.
 * Keeps defaults for any missing DB fields.
 */
export function buildBrandConfig(settings: any, logoBase64?: string): BrandConfig {
  return {
    name: settings?.footerTitle || DEFAULT_BRAND.name,
    tagline: DEFAULT_BRAND.tagline,
    email: settings?.contactEmail || DEFAULT_BRAND.email,
    phone: settings?.contactPhone || DEFAULT_BRAND.phone,
    address: settings?.contactAddress || DEFAULT_BRAND.address,
    website: DEFAULT_BRAND.website,
    logoBase64,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const M = 18; // margin

const BLACK: [number, number, number] = [0, 0, 0];
const WHITE: [number, number, number] = [255, 255, 255];
const G_LIGHT: [number, number, number] = [230, 230, 230];
const G_MID: [number, number, number] = [140, 140, 140];
const G_DARK: [number, number, number] = [60, 60, 60];
const SURFACE: [number, number, number] = [248, 248, 248];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED DRAW HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function _fallbackLogo(doc: jsPDF, x: number, y: number) {
  const s = 6;
  doc.setFillColor(...BLACK);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.triangle(x + s, y, x + s * 2, y + s, x + s, y + s * 2, 'F');
  doc.triangle(x + s, y, x, y + s, x + s, y + s * 2, 'S');
}

/**
 * Branded page header.
 * Returns the Y position immediately after the bottom divider line.
 */
function _header(
  doc: jsPDF,
  brand: BrandConfig,
  docType: string,
  ref: string,
  date: string,
): number {
  const topY = 12;

  // ── Logo (PNG or fallback diamond) ──
  if (brand.logoBase64) {
    try {
      // Height fixed at 14mm; width auto-scales to keep aspect ratio.
      // We supply a generous width cap (40mm) and jsPDF clips inside.
      doc.addImage(brand.logoBase64, 'PNG', M, topY, 40, 14);
    } catch {
      _fallbackLogo(doc, M, topY);
    }
  } else {
    _fallbackLogo(doc, M, topY);
  }

  // ── Brand name + tagline ──
  const textX = brand.logoBase64 ? M + 44 : M + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...BLACK);
  doc.text(brand.name, textX, topY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...G_MID);
  doc.text(brand.tagline, textX, topY + 11);

  // ── Right block ──
  const rX = PAGE_W - M;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(docType, rX, topY + 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...G_DARK);
  doc.text(`REF: ${ref}`, rX, topY + 9, { align: 'right' });
  doc.text(date, rX, topY + 14, { align: 'right' });

  // ── Divider ──
  const divY = topY + 17;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(M, divY, PAGE_W - M, divY);

  return divY + 2;
}

/** Footer drawn on the current active page */
function _footer(doc: jsPDF, brand: BrandConfig, msg: string) {
  const y = PAGE_H - 14;
  doc.setDrawColor(...G_LIGHT);
  doc.setLineWidth(0.2);
  doc.line(M, y - 4, PAGE_W - M, y - 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...G_MID);
  doc.text(msg, PAGE_W / 2, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    `${brand.website}  •  ${brand.email}  •  ${brand.phone}`,
    PAGE_W / 2,
    y + 4,
    { align: 'center' },
  );

  const pg: number = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pg}`, PAGE_W - M, y + 4, { align: 'right' });
}

/** Two-column info panel with black title bars */
function _infoPanel(
  doc: jsPDF,
  startY: number,
  lTitle: string,
  lLines: { label: string; value: string }[],
  rTitle: string,
  rLines: { label: string; value: string }[],
): number {
  const colW = (PAGE_W - M * 2) / 2 - 4;
  const lX = M;
  const rX = PAGE_W / 2 + 2;
  const pad = 5;
  const lh = 5.5;
  const h = Math.max(lLines.length, rLines.length) * lh + pad * 2 + 8;

  doc.setFillColor(...SURFACE);
  doc.setDrawColor(...G_LIGHT);
  doc.setLineWidth(0.2);
  doc.roundedRect(lX, startY, colW, h, 1, 1, 'FD');
  doc.roundedRect(rX, startY, colW, h, 1, 1, 'FD');

  // Title bars
  doc.setFillColor(...BLACK);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.roundedRect(lX, startY, colW, 7, 1, 1, 'F');
  doc.text(lTitle.toUpperCase(), lX + pad, startY + 4.8);
  doc.roundedRect(rX, startY, colW, 7, 1, 1, 'F');
  doc.text(rTitle.toUpperCase(), rX + pad, startY + 4.8);

  const drawRows = (x: number, lines: { label: string; value: string }[]) => {
    let ry = startY + 7 + pad;
    for (const row of lines) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...G_MID);
      doc.text(row.label, x + pad, ry);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BLACK);
      const wrapped = doc.splitTextToSize(row.value, colW - pad * 2 - 28);
      doc.text(wrapped, x + pad + 30, ry);
      ry += lh;
    }
  };

  drawRows(lX, lLines);
  drawRows(rX, rLines);

  return startY + h + 6;
}

/** Section heading with extending rule */
function _section(doc: jsPDF, y: number, title: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...G_MID);
  doc.text(title.toUpperCase(), M, y);
  const tw = doc.getTextWidth(title.toUpperCase());
  doc.setDrawColor(...G_LIGHT);
  doc.setLineWidth(0.2);
  doc.line(M + tw + 3, y - 1, PAGE_W - M, y - 1);
  return y + 6;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORDER INVOICE
// ─────────────────────────────────────────────────────────────────────────────
export function generateOrderInvoicePDF(order: any, brand: BrandConfig = DEFAULT_BRAND): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const date = new Date(order.createdAt).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  let y = _header(doc, brand, 'INVOICE', order.orderNumber, date);
  y += 8;

  // Info panels
  const addr = order.address;
  const addrStr = addr
    ? [
        [addr.firstName, addr.lastName].filter(Boolean).join(' ') || addr.label,
        addr.line1,
        addr.line2,
        [addr.city, addr.province].filter(Boolean).join(', '),
        addr.postalCode,
        addr.phone,
      ]
        .filter(Boolean)
        .join(', ')
    : 'N/A';

  y = _infoPanel(
    doc, y,
    'Bill To',
    [
      { label: 'Customer', value: order.user?.name || addr?.firstName || 'Guest' },
      { label: 'Email', value: order.user?.email || 'N/A' },
      { label: 'Phone', value: order.user?.phone || addr?.phone || 'N/A' },
      { label: 'Address', value: addrStr },
    ],
    'Order Details',
    [
      { label: 'Order #', value: order.orderNumber },
      { label: 'Date', value: date },
      { label: 'Status', value: order.status },
      { label: 'Payment', value: (order.payment?.method || 'N/A').replace(/_/g, ' ') },
      { label: 'Pay Status', value: order.payment?.status || 'N/A' },
    ],
  );

  // Items table
  y = _section(doc, y, 'Order Items');

  const tableBody = (order.items || []).map((item: any) => {
    const v = item.variant;
    let variantStr = '-';
    if (v?.optionValues && Object.keys(v.optionValues).length > 0) {
      variantStr = Object.entries(v.optionValues as Record<string, string>)
        .map(([k, val]) => `${k}: ${val}`)
        .join(', ');
    } else if (v?.title && v.title !== 'Default') {
      variantStr = v.title;
    }
    const price = Number(item.price);
    const qty = Number(item.quantity);
    return [
      item.product?.name || 'Product',
      v?.sku || '-',
      variantStr,
      qty.toString(),
      `PKR ${price.toLocaleString('en-PK')}`,
      `PKR ${(price * qty).toLocaleString('en-PK')}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['PRODUCT', 'SKU', 'VARIANT', 'QTY', 'UNIT PRICE', 'AMOUNT']],
    body: tableBody,
    theme: 'plain',
    headStyles: { font: 'helvetica', fontStyle: 'bold', textColor: WHITE, fillColor: BLACK, fontSize: 7, cellPadding: 3.5 },
    bodyStyles: { font: 'helvetica', fontSize: 7.5, cellPadding: 3.5, textColor: G_DARK },
    alternateRowStyles: { fillColor: SURFACE },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 24 },
      2: { cellWidth: 38 },
      3: { cellWidth: 12, halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
    },
  });

  // Totals
  const endY: number = (doc as any).lastAutoTable.finalY + 8;
  const rX = PAGE_W - M;
  const lX = rX - 72;

  const subtotal = Number(order.subtotal);
  const shipping = Number(order.shippingCost);
  const discount = Number(order.discount || 0);
  const total = Number(order.total);

  type Row = { label: string; value: string; highlight?: boolean };
  const rows: Row[] = [
    { label: 'Subtotal', value: `PKR ${subtotal.toLocaleString('en-PK')}` },
    { label: 'Shipping', value: `PKR ${shipping.toLocaleString('en-PK')}` },
  ];
  if (discount > 0) rows.push({ label: 'Discount', value: `– PKR ${discount.toLocaleString('en-PK')}` });
  if (order.couponCode) rows.push({ label: `Coupon (${order.couponCode})`, value: 'Applied' });
  rows.push({ label: 'GRAND TOTAL', value: `PKR ${total.toLocaleString('en-PK')}`, highlight: true });

  let tY = endY;
  for (const row of rows) {
    if (row.highlight) {
      doc.setFillColor(...BLACK);
      doc.roundedRect(lX - 4, tY - 4.5, rX - lX + 8, 10, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text(row.label, lX, tY + 1.5);
      doc.text(row.value, rX, tY + 1.5, { align: 'right' });
      tY += 14;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...G_DARK);
      doc.text(row.label, lX, tY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BLACK);
      doc.text(row.value, rX, tY, { align: 'right' });
      tY += 6.5;
    }
  }

  if (order.isGift && order.giftMessage) {
    tY += 6;
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(7.5);
    doc.setTextColor(...G_MID);
    doc.text('Gift Message:', M, tY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(`"${order.giftMessage}"`, PAGE_W - M * 2), M + 2, tY + 5);
  }

  if (order.trackingNumber) {
    tY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...G_DARK);
    doc.text(`Carrier: ${order.carrier || 'N/A'}  |  Tracking #: ${order.trackingNumber}`, M, tY);
  }

  _footer(doc, brand, 'Thank you for choosing ' + brand.name + '. This is a computer-generated invoice.');
  return Buffer.from(doc.output('arraybuffer'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. B2B QUOTATION
// ─────────────────────────────────────────────────────────────────────────────
export function generateQuotationPDF(quotation: any, brand: BrandConfig = DEFAULT_BRAND): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const refId = (quotation.id || '').slice(-8).toUpperCase() || 'XXXXXXXX';
  const issueDate = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

  const expiryDate = quotation.expiresAt
    ? new Date(quotation.expiresAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
    : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }); })();

  let y = _header(doc, brand, 'QUOTATION', refId, issueDate);
  y += 4;

  // Validity banner
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(...G_LIGHT);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, PAGE_W - M * 2, 8, 1, 1, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...G_MID);
  doc.text('Valid until:', M + 4, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text(expiryDate, M + 22, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...G_MID);
  doc.text(`Status: ${quotation.status}`, PAGE_W - M - 4, y + 5, { align: 'right' });
  y += 14;

  y = _infoPanel(
    doc, y,
    'Client Information',
    [
      { label: 'Name', value: quotation.name || 'N/A' },
      { label: 'Company', value: quotation.company || 'Individual' },
      { label: 'Email', value: quotation.email || 'N/A' },
      { label: 'Phone', value: quotation.phone || 'N/A' },
    ],
    'Quotation Reference',
    [
      { label: 'Quotation #', value: refId },
      { label: 'Issued', value: issueDate },
      { label: 'Expires', value: expiryDate },
      { label: 'Issued By', value: brand.name },
    ],
  );

  y = _section(doc, y, 'Requested Items & Pricing');

  const rawItems: any[] = Array.isArray(quotation.items) ? quotation.items : [];
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['PRODUCT', 'NOTES', 'QTY', 'EST. UNIT PRICE', 'LINE TOTAL']],
    body: rawItems.map((item: any) => {
      const qty = Number(item.quantity) || 0;
      const up = item.unitPrice != null ? Number(item.unitPrice) : null;
      return [
        (item.productName || item.name || 'Custom Product').toUpperCase(),
        item.notes || '-',
        qty.toString(),
        up !== null ? `PKR ${up.toLocaleString('en-PK')}` : 'TBD',
        up !== null ? `PKR ${(up * qty).toLocaleString('en-PK')}` : 'TBD',
      ];
    }),
    theme: 'plain',
    headStyles: { font: 'helvetica', fontStyle: 'bold', textColor: WHITE, fillColor: BLACK, fontSize: 7, cellPadding: 3.5 },
    bodyStyles: { font: 'helvetica', fontSize: 7.5, cellPadding: 3.5, textColor: G_DARK },
    alternateRowStyles: { fillColor: SURFACE },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold', textColor: BLACK },
      1: { cellWidth: 45, fontStyle: 'italic' },
      2: { cellWidth: 12, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
    },
  });

  let tY: number = (doc as any).lastAutoTable.finalY + 8;

  const hasPrices = rawItems.some((i: any) => i.unitPrice != null);
  if (hasPrices) {
    const est = rawItems.reduce(
      (acc: number, i: any) => acc + Number(i.unitPrice || 0) * Number(i.quantity || 0), 0,
    );
    const rX = PAGE_W - M;
    const lX = rX - 72;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...G_MID);
    doc.text('* Estimates only, subject to final confirmation.', M, tY);
    tY += 7;
    doc.setFillColor(...BLACK);
    doc.roundedRect(lX - 4, tY - 4.5, rX - lX + 8, 11, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text('ESTIMATED TOTAL', lX, tY + 2);
    doc.text(`PKR ${est.toLocaleString('en-PK')}`, rX, tY + 2, { align: 'right' });
    tY += 16;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...G_MID);
    doc.text('* Pricing to be confirmed. Our team will follow up shortly.', M, tY);
    tY += 10;
  }

  if (quotation.aiDraft) {
    tY = _section(doc, tY, 'Message from ' + brand.name);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...G_DARK);
    const lines = doc.splitTextToSize(quotation.aiDraft, PAGE_W - M * 2);
    if (tY + lines.length * 5 > PAGE_H - 30) { doc.addPage(); tY = 20; }
    doc.text(lines, M, tY);
    tY += lines.length * 5 + 8;
  }

  if (tY + 55 > PAGE_H - 25) { doc.addPage(); tY = 20; }
  tY = _section(doc, tY, 'Terms & Conditions');

  const terms = [
    '1. All prices stated are estimates based on current catalogue pricing and subject to change.',
    '2. Final pricing will be confirmed upon review of order volume and product specifications.',
    '3. Standard lead time for bulk orders is 15–20 business days from order confirmation.',
    '4. An advance payment of 50% of the total order value is required to commence production.',
    '5. Balance payment must be cleared prior to dispatch of goods.',
    '6. Prices do not include applicable taxes unless explicitly stated.',
    `7. This quotation is valid until ${expiryDate} and will automatically expire thereafter.`,
    `8. ${brand.name} reserves the right to revise this quotation in case of significant material cost changes.`,
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...G_DARK);
  for (const t of terms) {
    const ls = doc.splitTextToSize(t, PAGE_W - M * 2);
    doc.text(ls, M, tY);
    tY += ls.length * 5 + 1;
  }

  tY += 8;
  if (tY + 30 < PAGE_H - 25) {
    const sW = 60;
    const sX = PAGE_W - M - sW;
    doc.setDrawColor(...G_LIGHT);
    doc.setLineWidth(0.3);
    doc.line(sX, tY + 15, sX + sW, tY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLACK);
    doc.text('Authorised Signature', sX + sW / 2, tY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...G_MID);
    doc.text(brand.name, sX + sW / 2, tY + 23.5, { align: 'center' });
  }

  _footer(doc, brand, `Thank you for your interest in a partnership with ${brand.name}.`);
  return Buffer.from(doc.output('arraybuffer'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ANALYTICS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export function generateAnalyticsReportPDF(
  data: { revenueData: any; statusData: any[]; topProducts: any[]; period?: string },
  brand: BrandConfig = DEFAULT_BRAND,
): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const reportDate = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  const refId = `RPT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  let y = _header(doc, brand, 'ANALYTICS REPORT', refId, reportDate);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...G_MID);
  doc.text(`Reporting Period: ${data.period || 'All Time'}  •  Generated: ${reportDate}`, M, y);
  y += 10;

  // KPI boxes
  y = _section(doc, y, 'Key Performance Indicators');

  const kpis = [
    { label: "Today's Revenue", value: `PKR ${Number(data.revenueData?.today?.revenue || 0).toLocaleString('en-PK')}` },
    { label: 'This Month', value: `PKR ${Number(data.revenueData?.thisMonth?.revenue || 0).toLocaleString('en-PK')}` },
    { label: 'YTD Revenue', value: `PKR ${Number(data.revenueData?.ytd?.revenue || 0).toLocaleString('en-PK')}` },
    { label: 'Active Orders', value: String(data.revenueData?.activeOrders || 0) },
  ];

  const bW = (PAGE_W - M * 2 - 9) / 4;
  const bH = 20;
  for (let i = 0; i < kpis.length; i++) {
    const bX = M + i * (bW + 3);
    if (i === 3) { doc.setFillColor(...BLACK); } else { doc.setFillColor(...SURFACE); }
    doc.setDrawColor(...G_LIGHT);
    doc.setLineWidth(0.2);
    doc.roundedRect(bX, y, bW, bH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    if (i === 3) { doc.setTextColor(...WHITE); } else { doc.setTextColor(...BLACK); }
    doc.text(kpis[i].value, bX + bW / 2, y + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    if (i === 3) { doc.setTextColor(200, 200, 200); } else { doc.setTextColor(...G_MID); }
    doc.text(kpis[i].label.toUpperCase(), bX + bW / 2, y + 17, { align: 'center' });
  }
  y += bH + 10;

  // Orders by status
  y = _section(doc, y, 'Orders by Status');
  const statusBody = (data.statusData || []).map((s: any) => [
    s.status || 'Unknown',
    String(s.count || 0),
    s.revenue ? `PKR ${Number(s.revenue).toLocaleString('en-PK')}` : 'N/A',
  ]);

  if (statusBody.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...G_MID);
    doc.text('No status data available.', M, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['STATUS', 'ORDER COUNT', 'TOTAL REVENUE']],
      body: statusBody,
      theme: 'plain',
      headStyles: { font: 'helvetica', fontStyle: 'bold', textColor: WHITE, fillColor: BLACK, fontSize: 7, cellPadding: 3 },
      bodyStyles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: G_DARK },
      alternateRowStyles: { fillColor: SURFACE },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: BLACK },
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (y + 60 > PAGE_H - 25) { doc.addPage(); y = 20; }
  y = _section(doc, y, 'Top Selling Products (Last 30 Days)');

  const productBody = (data.topProducts || []).slice(0, 20).map((p: any, i: number) => [
    String(i + 1),
    p.name || 'Unknown',
    p.category || '-',
    String(p.unitsSold || 0),
    `PKR ${Number(p.revenue || 0).toLocaleString('en-PK')}`,
  ]);

  if (productBody.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...G_MID);
    doc.text('No product data available.', M, y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['#', 'PRODUCT NAME', 'CATEGORY', 'UNITS SOLD', 'REVENUE']],
      body: productBody,
      theme: 'plain',
      headStyles: { font: 'helvetica', fontStyle: 'bold', textColor: WHITE, fillColor: BLACK, fontSize: 7, cellPadding: 3 },
      bodyStyles: { font: 'helvetica', fontSize: 7.5, cellPadding: 3, textColor: G_DARK },
      alternateRowStyles: { fillColor: SURFACE },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', textColor: G_MID },
        1: { cellWidth: 75, fontStyle: 'bold', textColor: BLACK },
        2: { cellWidth: 35 },
        3: { halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
      },
    });
  }

  const totalPages: number = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    _footer(doc, brand, `${brand.name} Analytics Report — ${reportDate}. Confidential.`);
  }
  return Buffer.from(doc.output('arraybuffer'));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ORDERS EXPORT (landscape A4)
// ─────────────────────────────────────────────────────────────────────────────
export function generateOrdersExportPDF(
  orders: any[],
  options?: { status?: string; dateRange?: string },
  brand: BrandConfig = DEFAULT_BRAND,
): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pW = 297;

  const exportDate = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  const refId = `EXP-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // Compact landscape header
  if (brand.logoBase64) {
    try { doc.addImage(brand.logoBase64, 'PNG', M, 8, 28, 10); } catch { _fallbackLogo(doc, M, 8); }
  } else {
    _fallbackLogo(doc, M, 8);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(brand.name, M + 32, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...G_MID);
  doc.text(brand.tagline, M + 32, 18.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text('ORDERS EXPORT', pW - M, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...G_MID);
  doc.text(`REF: ${refId}  •  ${exportDate}`, pW - M, 17, { align: 'right' });
  if (options?.status) doc.text(`Status: ${options.status}`, pW - M, 21.5, { align: 'right' });
  if (options?.dateRange) doc.text(`Period: ${options.dateRange}`, pW - M, 26, { align: 'right' });

  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(M, 22, pW - M, 22);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...G_DARK);
  doc.text(
    `Total Orders: ${orders.length}  •  Combined Revenue: PKR ${totalRevenue.toLocaleString('en-PK')}`,
    M, 28,
  );

  autoTable(doc, {
    startY: 32,
    margin: { left: M, right: M },
    head: [['ORDER #', 'DATE', 'CUSTOMER', 'EMAIL', 'CITY', 'STATUS', 'ITEMS', 'PAYMENT', 'PAY STATUS', 'TOTAL']],
    body: orders.map((o: any) => [
      o.orderNumber || o.id?.slice(-8).toUpperCase(),
      new Date(o.createdAt).toLocaleDateString('en-PK'),
      o.user?.name || 'Guest',
      o.user?.email || 'N/A',
      o.address ? `${o.address.city}, ${o.address.province}` : 'N/A',
      o.status,
      String(o.items?.length || o.itemCount || 0),
      (o.payment?.method || 'N/A').replace(/_/g, ' '),
      o.payment?.status || 'N/A',
      `PKR ${Number(o.total || 0).toLocaleString('en-PK')}`,
    ]),
    theme: 'plain',
    headStyles: { font: 'helvetica', fontStyle: 'bold', textColor: WHITE, fillColor: BLACK, fontSize: 6.5, cellPadding: 2.5 },
    bodyStyles: { font: 'helvetica', fontSize: 6.5, cellPadding: 2.5, textColor: G_DARK },
    alternateRowStyles: { fillColor: SURFACE },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: BLACK, cellWidth: 24 },
      1: { cellWidth: 20 },
      2: { cellWidth: 28 },
      3: { cellWidth: 38 },
      4: { cellWidth: 24 },
      5: { cellWidth: 20, fontStyle: 'bold' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 22 },
      8: { cellWidth: 20 },
      9: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
    },
  });

  const totalPages: number = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fY = 210 - 10;
    doc.setDrawColor(...G_LIGHT);
    doc.setLineWidth(0.2);
    doc.line(M, fY - 2, pW - M, fY - 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...G_MID);
    doc.text(`${brand.name} — Orders Export  •  ${exportDate}  •  Confidential`, M, fY + 2);
    doc.text(`Page ${p} of ${totalPages}`, pW - M, fY + 2, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
