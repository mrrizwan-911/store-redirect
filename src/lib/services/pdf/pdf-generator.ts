import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as fs from 'fs';
import * as path from 'path';

// ─── Helper: load logo as base64 ──────────────────────────────────────────────
function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'bgless-logo.png');
    if (fs.existsSync(logoPath)) {
      const data = fs.readFileSync(logoPath);
      return data.toString('base64');
    }
  } catch {
    // silently skip if logo not accessible
  }
  return null;
}

// ─── Order Invoice PDF ────────────────────────────────────────────────────────

/**
 * Generates a professional, minimalist luxury PDF for an Order Invoice.
 */
export const generateOrderInvoicePDF = (order: any) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- HEADER ---
  const logoBase64 = getLogoBase64();
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 14, 28, 14);
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('CALNZA', margin, 28);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('PREMIUM APPAREL & ACCESSORIES', margin, 34);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text('INVOICE', pageWidth - margin, 24, { align: 'right' });
  doc.text(
    new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    pageWidth - margin,
    30,
    { align: 'right' }
  );

  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.line(margin, 42, pageWidth - margin, 42);

  // --- BILL TO ---
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO:', margin, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const address = order.address;
  if (address) {
    doc.text(`${address.firstName || ''} ${address.lastName || ''}`, margin, 63);
    doc.text(address.line1 || '', margin, 69);
    if (address.line2) doc.text(address.line2, margin, 75);
    doc.text(
      `${address.city || ''}, ${address.province || ''} ${address.postalCode || ''}`,
      margin,
      address.line2 ? 81 : 75
    );
    doc.text(address.phone || '', margin, address.line2 ? 87 : 81);
  }

  doc.setFont('times', 'bold');
  doc.text('ORDER DETAILS:', pageWidth / 2 + 10, 56);

  doc.setFont('helvetica', 'normal');
  doc.text(`Order Number: ${order.orderNumber}`, pageWidth / 2 + 10, 63);
  doc.text(
    `Payment: ${order.paymentMethod || order.payment?.method || 'N/A'}`,
    pageWidth / 2 + 10,
    69
  );
  doc.text(`Status: ${order.status}`, pageWidth / 2 + 10, 75);

  // --- ITEMS TABLE ---
  autoTable(doc, {
    startY: 98,
    margin: { left: margin, right: margin },
    head: [['ITEM', 'VARIANT', 'QTY', 'PRICE', 'AMOUNT']],
    body: order.items.map((item: any) => [
      item.product?.name?.toUpperCase() || 'PRODUCT',
      `${item.variant?.color || ''} ${item.variant?.size || ''}`.trim() || '-',
      item.quantity,
      `PKR ${item.price.toLocaleString()}`,
      `PKR ${(item.quantity * item.price).toLocaleString()}`,
    ]),
    theme: 'plain',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fontSize: 10,
      cellPadding: 4,
      lineWidth: { bottom: 0.1 },
    },
    bodyStyles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 65 },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });

  // --- TOTALS ---
  const finalY = (doc as any).lastAutoTable.finalY + 14;
  const totalsX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX - 45, finalY);
  doc.text(`PKR ${order.subtotal.toLocaleString()}`, totalsX, finalY, { align: 'right' });

  doc.text('Shipping:', totalsX - 45, finalY + 7);
  doc.text(`PKR ${order.shippingCost.toLocaleString()}`, totalsX, finalY + 7, { align: 'right' });

  let nextY = finalY + 14;
  if (Number(order.discount) > 0) {
    doc.text('Discount:', totalsX - 45, nextY);
    doc.text(`-PKR ${Number(order.discount).toLocaleString()}`, totalsX, nextY, { align: 'right' });
    nextY += 7;
  }

  doc.setLineWidth(0.5);
  doc.line(totalsX - 65, nextY + 2, totalsX, nextY + 2);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL (PKR):', totalsX - 45, nextY + 10);
  doc.text(`PKR ${order.total.toLocaleString()}`, totalsX, nextY + 10, { align: 'right' });

  // --- FOOTER ---
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Thank you for choosing Calnza.', pageWidth / 2, 280, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'This is a computer generated invoice and does not require a physical signature.',
    pageWidth / 2,
    286,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
};

// ─── Quotation PDF ────────────────────────────────────────────────────────────

/**
 * Generates an authenticated, branded B2B Quotation PDF.
 *
 * Items should carry:
 *   productName  – display name
 *   quantity     – number
 *   unitPrice    – admin-set PKR price (0 / undefined = TBD)
 *   discountAmount – fixed PKR discount per unit (optional, 0 = none)
 */
export const generateQuotationPDF = (quotation: any): Buffer => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();   // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297

  // ── BLACK HEADER BAND ────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Logo inside header
  const logoBase64 = getLogoBase64();
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 6, 30, 15);
  } else {
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('CALNZA', margin, 22);
  }

  // "QUOTATION" label right-aligned in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('B2B QUOTATION', pageWidth - margin, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text('CALNZA PREMIUM APPAREL', pageWidth - margin, 20, { align: 'right' });

  const refNo = quotation.id?.slice(-8).toUpperCase() || 'N/A';
  const issuedDate = new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const expiryDate = quotation.expiresAt
    ? new Date(quotation.expiresAt).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
      })();

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`REF: ${refNo}  |  Issued: ${issuedDate}`, pageWidth - margin, 28, { align: 'right' });

  // ── CLIENT / QUOTATION SPLIT INFO ─────────────────────────────────────────
  const infoY = 46;
  doc.setTextColor(0, 0, 0);

  // Left: Prepared For
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('PREPARED FOR', margin, infoY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 10, 10);
  doc.text(quotation.name || 'N/A', margin, infoY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  if (quotation.company) doc.text(quotation.company, margin, infoY + 14);
  doc.text(quotation.email || '', margin, infoY + (quotation.company ? 20 : 14));
  if (quotation.phone) doc.text(quotation.phone, margin, infoY + (quotation.company ? 26 : 20));

  // Right: Quotation Meta
  const rightX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('QUOTATION DETAILS', rightX, infoY);

  const metaRows = [
    ['Reference No.', refNo],
    ['Date Issued', issuedDate],
    ['Valid Until', expiryDate],
    ['Status', quotation.status || 'PENDING'],
  ];

  doc.setFontSize(9);
  metaRows.forEach(([label, value], i) => {
    const y = infoY + 7 + i * 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, rightX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(10, 10, 10);
    doc.text(value, rightX + 32, y);
  });

  // Thin divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, infoY + 36, pageWidth - margin, infoY + 36);

  // ── ITEMS TABLE ───────────────────────────────────────────────────────────
  const items: any[] = Array.isArray(quotation.items) ? quotation.items : [];

  const tableBody = items.map((item: any) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discountAmt = Number(item.discountAmount) || 0;
    const finalUnit = unitPrice - discountAmt;
    const lineTotal = finalUnit * qty;

    return [
      (item.productName || item.name || 'Custom Product').toUpperCase(),
      qty.toString(),
      unitPrice > 0 ? `PKR ${unitPrice.toLocaleString('en-PK')}` : 'TBD',
      discountAmt > 0 ? `PKR ${discountAmt.toLocaleString('en-PK')}` : '—',
      unitPrice > 0 ? `PKR ${lineTotal.toLocaleString('en-PK')}` : 'TBD',
      item.notes || '—',
    ];
  });

  autoTable(doc, {
    startY: infoY + 42,
    margin: { left: margin, right: margin },
    head: [['PRODUCT', 'QTY', 'UNIT PRICE', 'DISCOUNT', 'LINE TOTAL', 'NOTES']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [10, 10, 10],
      textColor: [255, 255, 255],
      font: 'helvetica',
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 4,
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 4,
      textColor: [20, 20, 20],
    },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 28 },
      5: { cellWidth: 30, textColor: [140, 140, 140], fontSize: 7.5 },
    },
  });

  // ── TOTALS BOX ────────────────────────────────────────────────────────────
  const hasPrices = items.some((i: any) => Number(i.unitPrice) > 0);

  if (hasPrices) {
    const afterTable = (doc as any).lastAutoTable.finalY + 6;

    const subtotal = items.reduce((acc: number, i: any) => {
      return acc + Number(i.unitPrice || 0) * Number(i.quantity || 0);
    }, 0);

    const totalDiscount = items.reduce((acc: number, i: any) => {
      return acc + Number(i.discountAmount || 0) * Number(i.quantity || 0);
    }, 0);

    const grandTotal = subtotal - totalDiscount;

    // Totals box background
    const boxX = pageWidth / 2 + 5;
    const boxW = pageWidth - margin - boxX;
    const rowH = 7;
    let rowY = afterTable;

    const drawTotalRow = (label: string, value: string, bold = false, bgDark = false) => {
      if (bgDark) {
        doc.setFillColor(10, 10, 10);
        doc.rect(boxX - 2, rowY - 5, boxW + 4, rowH + 1, 'F');
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setTextColor(40, 40, 40);
      }
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 9.5 : 9);
      doc.text(label, boxX + 2, rowY);
      doc.text(value, pageWidth - margin, rowY, { align: 'right' });
      rowY += rowH + 1;
    };

    drawTotalRow('Subtotal', `PKR ${subtotal.toLocaleString('en-PK')}`);
    if (totalDiscount > 0) {
      drawTotalRow('Total Discount', `-PKR ${totalDiscount.toLocaleString('en-PK')}`);
    }
    drawTotalRow('GRAND TOTAL (PKR)', `PKR ${grandTotal.toLocaleString('en-PK')}`, true, true);
  }

  // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
  const termsY = Math.min(
    (doc as any).lastAutoTable.finalY + (hasPrices ? 22 : 10),
    pageHeight - 55
  );

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, termsY, pageWidth - margin, termsY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('TERMS & CONDITIONS', margin, termsY + 7);

  const terms = [
    '1.  Prices stated in this quotation are the final agreed rates as communicated to the customer.',
    '2.  Standard lead time for bulk orders is 15–20 business days after confirmation.',
    '3.  50% advance payment is required to commence production; balance due before dispatch.',
    '4.  This quotation is valid until the expiry date shown above.',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  terms.forEach((t, i) => doc.text(t, margin, termsY + 14 + i * 5.5));

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10);
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('Thank you for your interest in partnering with Calnza.', pageWidth / 2, pageHeight - 9, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    'This is a computer-generated document. calnza.com',
    pageWidth / 2,
    pageHeight - 4,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
};
