import { InvoiceItem } from '../types';

export interface ItemCalculationInput {
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  gstRate: number; // e.g. 18
}

export function calculateInvoiceItem(
  input: ItemCalculationInput,
  isInterState: boolean
): InvoiceItem {
  const quantity = Math.max(0, input.quantity || 0);
  const unitPrice = Math.max(0, input.unitPrice || 0);
  const grossSubtotal = quantity * unitPrice;

  let discountAmount = 0;
  if (input.discountType === 'percentage') {
    discountAmount = (grossSubtotal * (input.discountValue || 0)) / 100;
  } else {
    discountAmount = Math.min(grossSubtotal, input.discountValue || 0);
  }

  const taxableAmount = Math.max(0, grossSubtotal - discountAmount);
  const gstRate = Math.max(0, input.gstRate || 0);

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  let totalTax = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = (taxableAmount * igstRate) / 100;
    totalTax = igstAmount;
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
    totalTax = cgstAmount + sgstAmount;
  }

  const totalAmount = taxableAmount + totalTax;

  return {
    id: Math.random().toString(36).substring(2, 9),
    productId: input.productId,
    productName: input.productName,
    hsnSac: input.hsnSac || '',
    quantity,
    unitPrice,
    discountType: input.discountType,
    discountValue: input.discountValue || 0,
    discountAmount,
    taxableAmount,
    gstRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    totalAmount,
  };
}

export function calculateInvoiceTotals(
  items: InvoiceItem[],
  shippingCharges = 0,
  additionalCharges = 0,
  enableRoundOff = true,
  amountPaid = 0
) {
  let subtotal = 0;
  let totalDiscount = 0;
  let taxableSubtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  items.forEach((item) => {
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.discountAmount;
    taxableSubtotal += item.taxableAmount;
    totalCgst += item.cgstAmount;
    totalSgst += item.sgstAmount;
    totalIgst += item.igstAmount;
    totalTax += item.totalTax;
  });

  const rawGrandTotal = taxableSubtotal + totalTax + (shippingCharges || 0) + (additionalCharges || 0);

  let grandTotal = rawGrandTotal;
  let roundOff = 0;

  if (enableRoundOff) {
    grandTotal = Math.round(rawGrandTotal);
    roundOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;
  }

  const balanceDue = Math.max(0, grandTotal - (amountPaid || 0));

  let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
  if (amountPaid >= grandTotal && grandTotal > 0) {
    paymentStatus = 'Paid';
  } else if (amountPaid > 0) {
    paymentStatus = 'Partially Paid';
  }

  return {
    subtotal,
    totalDiscount,
    taxableSubtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    shippingCharges: shippingCharges || 0,
    additionalCharges: additionalCharges || 0,
    roundOff,
    grandTotal,
    amountPaid: amountPaid || 0,
    balanceDue,
    paymentStatus,
  };
}
