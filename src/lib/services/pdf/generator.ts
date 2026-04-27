import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional, minimalist luxury PDF for an Order Invoice.
 * Aesthetic: Black & White, Serif headings, clean lines.
 */
export const generateOrderInvoicePDF = (order: any) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- HEADER: STORE BRANDING ---
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.text('ANTIGRAVITY ATELIER', margin, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('PREMIUM APPAREL & ACCESSORIES', margin, 36);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text('INVOICE', pageWidth - margin, 30, { align: 'right' });
  doc.text(new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), pageWidth - margin, 35, { align: 'right' });

  // Divider
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.line(margin, 45, pageWidth - margin, 45);

  // --- INFO SECTION: BILL TO & ORDER DETAILS ---
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO:', margin, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const address = order.address;
  if (address) {
    doc.text(`${address.firstName || ''} ${address.lastName || ''}`, margin, 66);
    doc.text(address.line1 || '', margin, 71);
    if (address.line2) doc.text(address.line2, margin, 76);
    doc.text(`${address.city || ''}, ${address.province || ''} ${address.postalCode || ''}`, margin, address.line2 ? 81 : 76);
    doc.text(address.phone || '', margin, address.line2 ? 86 : 81);
  }

  doc.setFont('times', 'bold');
  doc.text('ORDER DETAILS:', pageWidth / 2 + 10, 60);

  doc.setFont('helvetica', 'normal');
  doc.text(`Order Number: ${order.orderNumber}`, pageWidth / 2 + 10, 66);
  doc.text(`Payment Method: ${order.paymentMethod || order.payment?.method || 'N/A'}`, pageWidth / 2 + 10, 71);
  doc.text(`Status: ${order.status}`, pageWidth / 2 + 10, 76);

  // --- ITEMS TABLE ---
  autoTable(doc, {
    startY: 100,
    margin: { left: margin, right: margin },
    head: [['ITEM', 'VARIANT', 'QTY', 'PRICE', 'AMOUNT']],
    body: order.items.map((item: any) => [
      item.product?.name?.toUpperCase() || 'PRODUCT',
      `${item.variant?.color || ''} ${item.variant?.size || ''}`.trim() || '-',
      item.quantity,
      `${item.price.toLocaleString()}`,
      `${(item.quantity * item.price).toLocaleString()}`
    ]),
    theme: 'plain',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fontSize: 10,
      cellPadding: 4,
      lineWidth: { bottom: 0.1 }
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 70 },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  });

  // --- TOTALS SECTION ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const totalsX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', totalsX - 40, finalY);
  doc.text(`${order.subtotal.toLocaleString()}`, totalsX, finalY, { align: 'right' });

  doc.text('Shipping:', totalsX - 40, finalY + 7);
  doc.text(`${order.shippingCost.toLocaleString()}`, totalsX, finalY + 7, { align: 'right' });

  if (Number(order.discount) > 0) {
    doc.text('Discount:', totalsX - 40, finalY + 14);
    doc.text(`-${Number(order.discount).toLocaleString()}`, totalsX, finalY + 14, { align: 'right' });
  }

  const grandTotalY = Number(order.discount) > 0 ? finalY + 25 : finalY + 18;

  doc.setLineWidth(0.5);
  doc.line(totalsX - 60, grandTotalY - 6, totalsX, grandTotalY - 6);

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL (PKR):', totalsX - 40, grandTotalY);
  doc.text(`${order.total.toLocaleString()}`, totalsX, grandTotalY, { align: 'right' });

  // --- FOOTER: THANK YOU MESSAGE ---
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Thank you for choosing Antigravity Atelier.', pageWidth / 2, 280, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('This is a computer generated invoice and does not require a physical signature.', pageWidth / 2, 285, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
};

/**
 * Generates a professional, minimalist luxury PDF for a B2B Quotation.
 */
export const generateQuotationPDF = (quotation: any) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- HEADER: STORE BRANDING ---
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.text('ANTIGRAVITY ATELIER', margin, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('B2B BULK ORDER QUOTATION', margin, 36);

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text('QUOTATION', pageWidth - margin, 30, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), pageWidth - margin, 35, { align: 'right' });

  // Divider
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.line(margin, 45, pageWidth - margin, 45);

  // --- INFO SECTION: CLIENT & QUOTATION DETAILS ---
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('CLIENT INFO:', margin, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Contact: ${quotation.name}`, margin, 66);
  doc.text(`Company: ${quotation.company || 'N/A'}`, margin, 71);
  doc.text(`Email: ${quotation.email}`, margin, 76);
  doc.text(`Phone: ${quotation.phone || 'N/A'}`, margin, 81);

  doc.setFont('times', 'bold');
  doc.text('QUOTATION INFO:', pageWidth / 2 + 10, 60);

  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${quotation.status}`, pageWidth / 2 + 10, 66);
  if (quotation.expiresAt) {
    doc.text(`Expires: ${new Date(quotation.expiresAt).toLocaleDateString()}`, pageWidth / 2 + 10, 71);
  } else {
    // Default 30 days expiry if not set
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    doc.text(`Expires: ${expiry.toLocaleDateString()}`, pageWidth / 2 + 10, 71);
  }

  // --- ITEMS TABLE ---
  // Quotation items are stored as JSON
  const items = Array.isArray(quotation.items) ? quotation.items : [];

  autoTable(doc, {
    startY: 100,
    margin: { left: margin, right: margin },
    head: [['ITEM', 'QTY', 'EST. UNIT PRICE', 'TOTAL']],
    body: items.map((item: any) => [
      item.productName?.toUpperCase() || item.name?.toUpperCase() || 'CUSTOM PRODUCT',
      item.quantity || 0,
      item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : 'TBD',
      item.unitPrice ? `PKR ${(item.quantity * item.unitPrice).toLocaleString()}` : 'TBD'
    ]),
    theme: 'plain',
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      textColor: [0, 0, 0],
      fontSize: 10,
      cellPadding: 4,
      lineWidth: { bottom: 0.1 }
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Totals if unit prices are present
  const hasPrices = items.some((item: any) => item.unitPrice);
  if (hasPrices) {
    const total = items.reduce((acc: number, item: any) => acc + ((item.unitPrice || 0) * (item.quantity || 0)), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Estimated Total:', pageWidth - margin - 60, finalY);
    doc.text(`PKR ${total.toLocaleString()}`, pageWidth - margin, finalY, { align: 'right' });
  }

  // --- TERMS SECTION ---
  const lastY = (doc as any).lastAutoTable.finalY + 25;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('TERMS & CONDITIONS:', margin, lastY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  const terms = [
    '1. Prices are subject to change based on final order volume.',
    '2. Standard lead time for bulk orders is 15-20 business days.',
    '3. 50% advance payment required to commence production.',
    '4. This quotation is valid for 30 days from the date of issue.'
  ];
  terms.forEach((term, index) => {
    doc.text(term, margin, lastY + 7 + (index * 5));
  });

  // --- FOOTER ---
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Thank you for your interest in a partnership with Antigravity Atelier.', pageWidth / 2, 280, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
};
