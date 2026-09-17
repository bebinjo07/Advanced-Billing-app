export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  businessState: string;
  gstin?: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  tagline?: string;
  logo?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  gstin: string;
  pan?: string;
  currency: string; // e.g. "INR"
  currencySymbol: string; // e.g. "₹"
  invoicePrefix: string; // e.g. "INV-2026-"
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    upiId: string;
  };
  termsAndConditions: string;
  signatureImage?: string;
  taxRegistrationType: 'Regular' | 'Composition' | 'Unregistered';
}

export interface Customer {
  id: string;
  name: string;
  customerCode: string;
  phone: string;
  email: string;
  gstin?: string;
  billingAddress: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  notes?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  gstin?: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  hsnSac: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // e.g., 18 for 18%
  currentStock: number;
  minStockLevel: number;
  unit: string; // e.g., 'pcs', 'kg', 'box', 'hrs'
  supplierId?: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number; // e.g., 18
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export type InvoiceStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue' | 'Cancelled';
export type InvoiceType = 'Regular' | 'Recurring' | 'Credit Note' | 'Debit Note';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerGstin?: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupplyState: string;
  businessState: string;
  isInterState: boolean;
  reverseCharge: boolean;
  
  items: InvoiceItem[];
  
  subtotal: number;
  totalDiscount: number;
  taxableSubtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  shippingCharges: number;
  additionalCharges: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  
  paymentStatus: InvoiceStatus;
  invoiceType: InvoiceType;
  notes?: string;
  terms?: string;
  qrCodeUrl?: string;
  createdById: string;
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Debit/Credit Card' | 'Bank Transfer' | 'Cheque' | 'Other';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionReference: string;
  notes?: string;
  createdById: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  date: string;
  supplierName?: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: 'Stock In' | 'Stock Out' | 'Adjustment' | 'Invoice Deduction' | 'Invoice Cancellation';
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  referenceId?: string; // e.g., Invoice #
  notes?: string;
  date: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: 'Invoice' | 'Product' | 'Customer' | 'Payment' | 'Settings' | 'Expense' | 'Auth';
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'out_of_stock' | 'pending_payment' | 'overdue' | 'new_payment' | 'new_customer' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface RecurringInvoiceSchedule {
  id: string;
  templateInvoiceId: string;
  customerName: string;
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextRunDate: string;
  active: boolean;
  lastGeneratedDate?: string;
}
