import Dexie, { Table } from 'dexie';
import {
  User,
  BusinessProfile,
  Customer,
  Product,
  Category,
  Supplier,
  Invoice,
  Payment,
  Expense,
  InventoryTransaction,
  AuditLog,
  AppNotification,
  RecurringInvoiceSchedule,
} from '../types';

export class BillingDatabase extends Dexie {
  users!: Table<User, string>;
  businessProfile!: Table<BusinessProfile, string>;
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  suppliers!: Table<Supplier, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  expenses!: Table<Expense, string>;
  inventoryTransactions!: Table<InventoryTransaction, string>;
  auditLogs!: Table<AuditLog, string>;
  notifications!: Table<AppNotification, string>;
  recurringSchedules!: Table<RecurringInvoiceSchedule, string>;

  constructor() {
    super('AdvancedBillingDB');
    this.version(1).stores({
      users: 'id, email, role, active',
      businessProfile: 'id',
      customers: 'id, name, phone, email, gstin, state, outstandingBalance',
      products: 'id, name, sku, barcode, category, currentStock, minStockLevel',
      categories: 'id, name',
      suppliers: 'id, name, companyName',
      invoices: 'id, invoiceNumber, customerId, invoiceDate, dueDate, paymentStatus, invoiceType, grandTotal, balanceDue',
      payments: 'id, paymentNumber, invoiceId, customerId, paymentDate, paymentMethod',
      expenses: 'id, expenseNumber, category, date, supplierName',
      inventoryTransactions: 'id, productId, type, date',
      auditLogs: 'id, userId, module, timestamp',
      notifications: 'id, type, read, createdAt',
      recurringSchedules: 'id, active, nextRunDate',
    });
  }
}

export const db = new BillingDatabase();
