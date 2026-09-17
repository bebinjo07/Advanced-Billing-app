import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessProfile, Customer } from '../types';
import { formatCurrency, numberToWordsIndian } from './numberToWords';

export async function generateInvoicePDF(
  invoice: Invoice,
  business: BusinessProfile
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [16, 185, 129]; // Emerald 500 #10b981
  const darkTextColor = [30, 41, 59]; // Slate 800

  // Header Banner / Title
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(business.name, 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  if (business.tagline) {
    doc.text(business.tagline, 14, 22);
  }

  doc.text(`${business.address}, ${business.city}, ${business.state} - ${business.pincode}`, 14, 27);
  doc.text(`GSTIN: ${business.gstin} | Phone: ${business.phone} | Email: ${business.email}`, 14, 32);

  // TAX INVOICE Badge
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('TAX INVOICE', pageWidth - 14, 16, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`# ${invoice.invoiceNumber}`, pageWidth - 14, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - 14, 28, { align: 'right' });
  doc.text(`Due Date: ${invoice.dueDate}`, pageWidth - 14, 33, { align: 'right' });

  // Status Stamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  if (invoice.paymentStatus === 'Paid') {
    doc.setTextColor(22, 163, 74);
  } else if (invoice.paymentStatus === 'Overdue') {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(217, 119, 6);
  }
  doc.text(`Status: ${invoice.paymentStatus.toUpperCase()}`, pageWidth - 14, 39, { align: 'right' });

  // Separator Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 44, pageWidth - 14, 44);

  // Customer / Billing Details Box
  const startY = 50;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, startY, (pageWidth - 36) / 2, 34, 2, 2, 'F');
  doc.roundedRect(14 + (pageWidth - 36) / 2 + 8, startY, (pageWidth - 36) / 2, 34, 2, 2, 'F');

  // Billed To
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('BILLED TO:', 18, startY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.customerName, 18, startY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(invoice.billingAddress || 'N/A', 18, startY + 17);
  doc.text(`Phone: ${invoice.customerPhone} | Email: ${invoice.customerEmail}`, 18, startY + 22);
  doc.text(`GSTIN: ${invoice.customerGstin || 'Unregistered / N/A'}`, 18, startY + 27);

  // Supply / Transport Info
  const rightBoxX = 14 + (pageWidth - 36) / 2 + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('SUPPLY & INVOICE DETAILS:', rightBoxX + 4, startY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Place of Supply: ${invoice.placeOfSupplyState}`, rightBoxX + 4, startY + 12);
  doc.text(`Tax Category: ${invoice.isInterState ? 'IGST (Inter-State)' : 'CGST + SGST (Intra-State)'}`, rightBoxX + 4, startY + 17);
  doc.text(`Reverse Charge: ${invoice.reverseCharge ? 'Yes' : 'No'}`, rightBoxX + 4, startY + 22);
  doc.text(`Business State: ${invoice.businessState}`, rightBoxX + 4, startY + 27);

  // Item Table
  const tableData = invoice.items.map((item, index) => {
    if (invoice.isInterState) {
      return [
        (index + 1).toString(),
        item.productName,
        item.hsnSac || '-',
        item.quantity.toString(),
        `₹${item.unitPrice.toFixed(2)}`,
        item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : '-',
        `₹${item.taxableAmount.toFixed(2)}`,
        `${item.igstRate}% (₹${item.igstAmount.toFixed(2)})`,
        `₹${item.totalAmount.toFixed(2)}`,
      ];
    } else {
      return [
        (index + 1).toString(),
        item.productName,
        item.hsnSac || '-',
        item.quantity.toString(),
        `₹${item.unitPrice.toFixed(2)}`,
        item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : '-',
        `₹${item.taxableAmount.toFixed(2)}`,
        `${item.cgstRate}% (₹${item.cgstAmount.toFixed(2)})`,
        `${item.sgstRate}% (₹${item.sgstAmount.toFixed(2)})`,
        `₹${item.totalAmount.toFixed(2)}`,
      ];
    }
  });

  const tableHeaders = invoice.isInterState
    ? [['#', 'Item / Description', 'HSN/SAC', 'Qty', 'Unit Price', 'Disc', 'Taxable', 'IGST', 'Total']]
    : [['#', 'Item / Description', 'HSN/SAC', 'Qty', 'Unit Price', 'Disc', 'Taxable', 'CGST', 'SGST', 'Total']];

  autoTable(doc, {
    startY: 90,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 16 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'center', cellWidth: 22 },
      8: { halign: 'right', cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 6;

  // Amount in Words & Totals Summary Box
  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  // Left Column: Amount in words & Bank/UPI details
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Amount in Words:', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const wordsStr = numberToWordsIndian(invoice.grandTotal);
  const splitWords = doc.splitTextToSize(wordsStr, 110);
  doc.text(splitWords, 14, finalY + 5);

  const bankY = finalY + 5 + splitWords.length * 4 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Bank & Payment Details:', 14, bankY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank Name: ${business.bankDetails.bankName}`, 14, bankY + 4);
  doc.text(`A/C No: ${business.bankDetails.accountNumber} | IFSC: ${business.bankDetails.ifscCode}`, 14, bankY + 8);
  doc.text(`UPI ID: ${business.bankDetails.upiId}`, 14, bankY + 12);

  // Right Column: Totals Summary Table
  const totalsX = 125;
  const totalsWidth = pageWidth - 14 - totalsX;
  let currY = finalY;

  const summaryRows = [
    { label: 'Subtotal:', value: `₹${invoice.subtotal.toFixed(2)}` },
    { label: 'Discount:', value: `-₹${invoice.totalDiscount.toFixed(2)}` },
    { label: 'Taxable Amount:', value: `₹${invoice.taxableSubtotal.toFixed(2)}` },
  ];

  if (invoice.isInterState) {
    summaryRows.push({ label: 'IGST Total:', value: `₹${invoice.totalIgst.toFixed(2)}` });
  } else {
    summaryRows.push({ label: 'CGST Total:', value: `₹${invoice.totalCgst.toFixed(2)}` });
    summaryRows.push({ label: 'SGST Total:', value: `₹${invoice.totalSgst.toFixed(2)}` });
  }

  if (invoice.shippingCharges > 0) {
    summaryRows.push({ label: 'Shipping Charges:', value: `₹${invoice.shippingCharges.toFixed(2)}` });
  }
  if (invoice.additionalCharges > 0) {
    summaryRows.push({ label: 'Additional Charges:', value: `₹${invoice.additionalCharges.toFixed(2)}` });
  }
  if (invoice.roundOff !== 0) {
    summaryRows.push({ label: 'Round Off:', value: `${invoice.roundOff > 0 ? '+' : ''}₹${invoice.roundOff.toFixed(2)}` });
  }

  summaryRows.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(row.label, totalsX, currY);
    doc.setTextColor(30, 41, 59);
    doc.text(row.value, pageWidth - 14, currY, { align: 'right' });
    currY += 5;
  });

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX, currY - 2, pageWidth - 14, currY - 2);

  // Grand Total Box
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(totalsX - 2, currY, totalsWidth + 4, 10, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text('Grand Total:', totalsX, currY + 6.5);
  doc.text(`₹${invoice.grandTotal.toFixed(2)}`, pageWidth - 14, currY + 6.5, { align: 'right' });

  currY += 14;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Amount Paid:', totalsX, currY);
  doc.text(`₹${invoice.amountPaid.toFixed(2)}`, pageWidth - 14, currY, { align: 'right' });

  currY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('Balance Due:', totalsX, currY);
  doc.text(`₹${invoice.balanceDue.toFixed(2)}`, pageWidth - 14, currY, { align: 'right' });

  // Footer: Terms & Signature
  const footerY = Math.max(bankY + 20, currY + 15);
  if (footerY < 265) {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, footerY, pageWidth - 14, footerY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('Terms & Conditions:', 14, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(business.termsAndConditions || '1. Goods once sold will not be taken back. 2. Subject to local jurisdiction.', 14, footerY + 9);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`For ${business.name}`, pageWidth - 14, footerY + 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signatory', pageWidth - 14, footerY + 22, { align: 'right' });
  }

  return doc;
}
