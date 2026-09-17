import { db } from './database';
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
} from '../types';
import { calculateInvoiceItem, calculateInvoiceTotals } from '../utils/gstCalculator';

export async function seedInitialDataIfNeeded() {
  const userCount = await db.users.count();
  if (userCount > 0) return; // Database already seeded

  console.log('Seeding initial realistic data for Billing App...');

  // 1. Users
  const users: User[] = [
    {
      id: 'usr_admin',
      name: 'Bebinjo Admin',
      email: 'admin@billingapp.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      phone: '+91 98765 43210',
      active: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_mgr',
      name: 'Rajesh Sharma',
      email: 'manager@billingapp.com',
      role: 'manager',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      phone: '+91 98123 45678',
      active: true,
      createdAt: '2026-01-10T00:00:00.000Z',
    },
    {
      id: 'usr_staff',
      name: 'Priya Verma',
      email: 'staff@billingapp.com',
      role: 'staff',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      phone: '+91 97654 32109',
      active: true,
      createdAt: '2026-01-15T00:00:00.000Z',
    },
  ];
  await db.users.bulkAdd(users);

  // 2. Business Profile
  const businessProfile: BusinessProfile = {
    id: 'biz_main',
    name: 'TechMatrix Solutions & Retail Pvt Ltd',
    tagline: 'Premium Electronics & Enterprise Services',
    logo: '',
    address: 'Plot 42, Tech Park Avenue, HSR Layout, Sector 3',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
    phone: '+91 80 4912 8800',
    email: 'contact@techmatrix.in',
    website: 'https://techmatrix.in',
    gstin: '29AABCT1332L1Z5', // 29 = Karnataka
    pan: 'AABCT1332L',
    currency: 'INR',
    currencySymbol: '₹',
    invoicePrefix: 'INV-2026-',
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '50200088991122',
      ifscCode: 'HDFC0001234',
      branch: 'HSR Layout Branch, Bengaluru',
      upiId: 'techmatrix@hdfcbank',
    },
    termsAndConditions: '1. Goods once sold are subject to standard 1-year manufacturer warranty.\n2. Payment due within 15 days of invoice date.\n3. Delayed payments incur interest @ 18% p.a.\n4. Disputes subject to Bengaluru jurisdiction.',
    taxRegistrationType: 'Regular',
  };
  await db.businessProfile.add(businessProfile);

  // 3. Categories
  const categories: Category[] = [
    { id: 'cat_1', name: 'Laptops & Computers', description: 'Desktops, laptops, monitors' },
    { id: 'cat_2', name: 'Mobile Accessories', description: 'Chargers, cables, power banks' },
    { id: 'cat_3', name: 'Networking & Servers', description: 'Routers, switches, rack servers' },
    { id: 'cat_4', name: 'Software & Cloud Services', description: 'SaaS licenses, annual contracts' },
    { id: 'cat_5', name: 'IT Support & Maintenance', description: 'On-site repair and AMC services' },
  ];
  await db.categories.bulkAdd(categories);

  // 4. Suppliers
  const suppliers: Supplier[] = [
    {
      id: 'sup_1',
      name: 'Anil Gupta',
      companyName: 'Redington India Distributors',
      phone: '+91 99887 76655',
      email: 'sales@redington.in',
      gstin: '27AAACR1234F1Z8',
      address: 'Industrial Estate, Andheri East, Mumbai, Maharashtra',
    },
    {
      id: 'sup_2',
      name: 'Sunil Mehta',
      companyName: 'Ingram Micro Tech Pvt Ltd',
      phone: '+91 98220 11223',
      email: 'orders@ingrammicro.co.in',
      gstin: '29AAACI5544K1Z2',
      address: 'Peenya Industrial Area, Bengaluru, Karnataka',
    },
  ];
  await db.suppliers.bulkAdd(suppliers);

  // 5. Products
  const products: Product[] = [
    {
      id: 'prod_1',
      name: 'Dell XPS 15 Laptop (Core i7, 16GB, 512GB SSD)',
      sku: 'DELL-XPS15-01',
      barcode: '890123456701',
      hsnSac: '8471',
      category: 'Laptops & Computers',
      purchasePrice: 110000,
      sellingPrice: 135000,
      gstRate: 18,
      currentStock: 12,
      minStockLevel: 3,
      unit: 'pcs',
      supplierId: 'sup_1',
      createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'prod_2',
      name: 'Apple MacBook Pro 14" M3 (8GB, 512GB)',
      sku: 'AAPL-MBP14-M3',
      barcode: '890123456702',
      hsnSac: '8471',
      category: 'Laptops & Computers',
      purchasePrice: 145000,
      sellingPrice: 169900,
      gstRate: 18,
      currentStock: 8,
      minStockLevel: 2,
      unit: 'pcs',
      supplierId: 'sup_1',
      createdAt: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 'prod_3',
      name: 'Logitech MX Master 3S Wireless Mouse',
      sku: 'LOGI-MX3S-BLK',
      barcode: '890123456703',
      hsnSac: '8471',
      category: 'Mobile Accessories',
      purchasePrice: 6200,
      sellingPrice: 8495,
      gstRate: 18,
      currentStock: 45,
      minStockLevel: 10,
      unit: 'pcs',
      supplierId: 'sup_2',
      createdAt: '2026-01-08T00:00:00.000Z',
    },
    {
      id: 'prod_4',
      name: 'Samsung 27" 4K UHD IPS Ergonomic Monitor',
      sku: 'SAMS-27-4K',
      barcode: '890123456704',
      hsnSac: '8528',
      category: 'Laptops & Computers',
      purchasePrice: 22000,
      sellingPrice: 28900,
      gstRate: 18,
      currentStock: 15,
      minStockLevel: 4,
      unit: 'pcs',
      supplierId: 'sup_2',
      createdAt: '2026-01-10T00:00:00.000Z',
    },
    {
      id: 'prod_5',
      name: 'TP-Link AX3000 Wi-Fi 6 Gigabit Router',
      sku: 'TPLK-AX3000',
      barcode: '890123456705',
      hsnSac: '8517',
      category: 'Networking & Servers',
      purchasePrice: 4200,
      sellingPrice: 5999,
      gstRate: 18,
      currentStock: 2, // Low stock!
      minStockLevel: 5,
      unit: 'pcs',
      supplierId: 'sup_2',
      createdAt: '2026-01-12T00:00:00.000Z',
    },
    {
      id: 'prod_6',
      name: 'Type-C Braided Fast Charging Cable 2m',
      sku: 'CABL-TPC-02M',
      barcode: '890123456706',
      hsnSac: '8544',
      category: 'Mobile Accessories',
      purchasePrice: 150,
      sellingPrice: 499,
      gstRate: 18,
      currentStock: 0, // Out of stock!
      minStockLevel: 15,
      unit: 'pcs',
      supplierId: 'sup_2',
      createdAt: '2026-01-14T00:00:00.000Z',
    },
    {
      id: 'prod_7',
      name: 'Annual Enterprise Cloud Maintenance AMC',
      sku: 'SRV-AMC-1YR',
      barcode: '890123456707',
      hsnSac: '998313', // SAC code for IT services
      category: 'IT Support & Maintenance',
      purchasePrice: 0,
      sellingPrice: 45000,
      gstRate: 18,
      currentStock: 999,
      minStockLevel: 0,
      unit: 'hrs',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  await db.products.bulkAdd(products);

  // 6. Customers
  const customers: Customer[] = [
    {
      id: 'cust_1',
      name: 'InnovateX Technologies Pvt Ltd',
      customerCode: 'CUST-001',
      phone: '98450 12345',
      email: 'finance@innovatex.io',
      gstin: '29AAACI9988H1Z4', // Karnataka (Intra-State)
      billingAddress: 'Suite 204, Brigade Towers, MG Road',
      shippingAddress: 'Suite 204, Brigade Towers, MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      totalPurchases: 328800,
      totalPaid: 328800,
      outstandingBalance: 0,
      createdAt: '2026-01-10T00:00:00.000Z',
    },
    {
      id: 'cust_2',
      name: 'Apex Digital Marketing Agency',
      customerCode: 'CUST-002',
      phone: '99100 88776',
      email: 'billing@apexdigital.com',
      gstin: '07AABCA4321K1Z1', // Delhi (Inter-State)
      billingAddress: 'Connaught Place, Block B, 4th Floor',
      shippingAddress: 'Connaught Place, Block B, 4th Floor',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      totalPurchases: 198000,
      totalPaid: 100000,
      outstandingBalance: 98000,
      createdAt: '2026-01-18T00:00:00.000Z',
    },
    {
      id: 'cust_3',
      name: 'Vikram Solar Enterprises',
      customerCode: 'CUST-003',
      phone: '97230 45612',
      email: 'purchase@vikramsolar.in',
      gstin: '24AABCV5566N1Z9', // Gujarat (Inter-State)
      billingAddress: 'GIDC Estate Phase 2, Vatva',
      shippingAddress: 'GIDC Estate Phase 2, Vatva',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382445',
      totalPurchases: 89400,
      totalPaid: 89400,
      outstandingBalance: 0,
      createdAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: 'cust_4',
      name: 'Dr. Ramesh Kumar (Individual)',
      customerCode: 'CUST-004',
      phone: '94480 33221',
      email: 'ramesh.k@gmail.com',
      gstin: '', // Unregistered
      billingAddress: '#142, 10th Main, Jayanagar 4th Block',
      shippingAddress: '#142, 10th Main, Jayanagar 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560011',
      totalPurchases: 10024,
      totalPaid: 10024,
      outstandingBalance: 0,
      createdAt: '2026-02-14T00:00:00.000Z',
    },
  ];
  await db.customers.bulkAdd(customers);

  // 7. Invoices
  // Invoice 1 (Paid - Karnataka Intra-State)
  const item1_1 = calculateInvoiceItem(
    {
      productId: 'prod_1',
      productName: 'Dell XPS 15 Laptop (Core i7, 16GB, 512GB SSD)',
      hsnSac: '8471',
      quantity: 2,
      unitPrice: 135000,
      discountType: 'fixed',
      discountValue: 10000,
      gstRate: 18,
    },
    false // Intra-state
  );
  const totals1 = calculateInvoiceTotals([item1_1], 0, 0, true, 306800);

  const inv1: Invoice = {
    id: 'inv_001',
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-08-10',
    dueDate: '2026-08-25',
    customerId: 'cust_1',
    customerName: 'InnovateX Technologies Pvt Ltd',
    customerPhone: '98450 12345',
    customerEmail: 'finance@innovatex.io',
    customerGstin: '29AAACI9988H1Z4',
    billingAddress: 'Suite 204, Brigade Towers, MG Road, Bengaluru, Karnataka - 560001',
    shippingAddress: 'Suite 204, Brigade Towers, MG Road, Bengaluru, Karnataka - 560001',
    placeOfSupplyState: 'Karnataka',
    businessState: 'Karnataka',
    isInterState: false,
    reverseCharge: false,
    items: [item1_1],
    ...totals1,
    invoiceType: 'Regular',
    notes: 'Thank you for your business!',
    createdById: 'usr_admin',
    createdAt: '2026-08-10T10:30:00.000Z',
  };

  // Invoice 2 (Partially Paid - Delhi Inter-State)
  const item2_1 = calculateInvoiceItem(
    {
      productId: 'prod_2',
      productName: 'Apple MacBook Pro 14" M3 (8GB, 512GB)',
      hsnSac: '8471',
      quantity: 1,
      unitPrice: 169900,
      discountType: 'percentage',
      discountValue: 5,
      gstRate: 18,
    },
    true // Inter-state
  );
  const totals2 = calculateInvoiceTotals([item2_1], 500, 0, true, 100000);

  const inv2: Invoice = {
    id: 'inv_002',
    invoiceNumber: 'INV-2026-002',
    invoiceDate: '2026-09-01',
    dueDate: '2026-09-16',
    customerId: 'cust_2',
    customerName: 'Apex Digital Marketing Agency',
    customerPhone: '99100 88776',
    customerEmail: 'billing@apexdigital.com',
    customerGstin: '07AABCA4321K1Z1',
    billingAddress: 'Connaught Place, Block B, 4th Floor, New Delhi - 110001',
    shippingAddress: 'Connaught Place, Block B, 4th Floor, New Delhi - 110001',
    placeOfSupplyState: 'Delhi',
    businessState: 'Karnataka',
    isInterState: true,
    reverseCharge: false,
    items: [item2_1],
    ...totals2,
    invoiceType: 'Regular',
    notes: 'Partial payment received via UPI.',
    createdById: 'usr_mgr',
    createdAt: '2026-09-01T14:15:00.000Z',
  };

  // Invoice 3 (Overdue - Gujarat Inter-State)
  const item3_1 = calculateInvoiceItem(
    {
      productId: 'prod_4',
      productName: 'Samsung 27" 4K UHD IPS Ergonomic Monitor',
      hsnSac: '8528',
      quantity: 2,
      unitPrice: 28900,
      discountType: 'fixed',
      discountValue: 1800,
      gstRate: 18,
    },
    true
  );
  const totals3 = calculateInvoiceTotals([item3_1], 0, 0, true, 0);

  const inv3: Invoice = {
    id: 'inv_003',
    invoiceNumber: 'INV-2026-003',
    invoiceDate: '2026-08-15',
    dueDate: '2026-08-30', // Overdue
    customerId: 'cust_3',
    customerName: 'Vikram Solar Enterprises',
    customerPhone: '97230 45612',
    customerEmail: 'purchase@vikramsolar.in',
    customerGstin: '24AABCV5566N1Z9',
    billingAddress: 'GIDC Estate Phase 2, Vatva, Ahmedabad, Gujarat - 382445',
    shippingAddress: 'GIDC Estate Phase 2, Vatva, Ahmedabad, Gujarat - 382445',
    placeOfSupplyState: 'Gujarat',
    businessState: 'Karnataka',
    isInterState: true,
    reverseCharge: false,
    items: [item3_1],
    ...totals3,
    paymentStatus: 'Overdue',
    invoiceType: 'Regular',
    createdById: 'usr_admin',
    createdAt: '2026-08-15T11:00:00.000Z',
  };

  await db.invoices.bulkAdd([inv1, inv2, inv3]);

  // 8. Payments
  const payments: Payment[] = [
    {
      id: 'pay_001',
      paymentNumber: 'PAY-2026-001',
      invoiceId: 'inv_001',
      invoiceNumber: 'INV-2026-001',
      customerId: 'cust_1',
      customerName: 'InnovateX Technologies Pvt Ltd',
      amount: 306800,
      paymentMethod: 'Bank Transfer',
      paymentDate: '2026-08-12',
      transactionReference: 'NEFT-HDFC-9988112233',
      notes: 'Full payment cleared via NEFT',
      createdById: 'usr_admin',
      createdAt: '2026-08-12T16:00:00.000Z',
    },
    {
      id: 'pay_002',
      paymentNumber: 'PAY-2026-002',
      invoiceId: 'inv_002',
      invoiceNumber: 'INV-2026-002',
      customerId: 'cust_2',
      customerName: 'Apex Digital Marketing Agency',
      amount: 100000,
      paymentMethod: 'UPI',
      paymentDate: '2026-09-02',
      transactionReference: 'UPI-RAZOR-44112233',
      notes: 'Advance partial payment',
      createdById: 'usr_mgr',
      createdAt: '2026-09-02T09:30:00.000Z',
    },
  ];
  await db.payments.bulkAdd(payments);

  // 9. Expenses
  const expenses: Expense[] = [
    {
      id: 'exp_001',
      expenseNumber: 'EXP-2026-001',
      title: 'Office Broadband Internet Bill',
      category: 'Utilities',
      amount: 3500,
      taxAmount: 630,
      paymentMethod: 'UPI',
      date: '2026-09-01',
      supplierName: 'Airtel Broadband',
      referenceNo: 'AIR-992211',
      notes: 'Monthly 1Gbps Fiber connection',
      createdAt: '2026-09-01T12:00:00.000Z',
    },
    {
      id: 'exp_002',
      expenseNumber: 'EXP-2026-002',
      title: 'Packaging & Bubble Wrap Supplies',
      category: 'Office Supplies',
      amount: 4200,
      taxAmount: 756,
      paymentMethod: 'Cash',
      date: '2026-09-05',
      supplierName: 'PackRight Mart',
      notes: 'Box packing materials',
      createdAt: '2026-09-05T15:00:00.000Z',
    },
  ];
  await db.expenses.bulkAdd(expenses);

  // 10. Notifications
  const notifications: AppNotification[] = [
    {
      id: 'notif_1',
      title: 'Low Stock Alert',
      message: 'Product "TP-Link AX3000 Wi-Fi 6 Router" is running low (2 left, min: 5).',
      type: 'low_stock',
      read: false,
      createdAt: '2026-09-15T08:00:00.000Z',
    },
    {
      id: 'notif_2',
      title: 'Out of Stock Alert',
      message: 'Product "Type-C Braided Fast Charging Cable" is out of stock.',
      type: 'out_of_stock',
      read: false,
      createdAt: '2026-09-16T09:30:00.000Z',
    },
    {
      id: 'notif_3',
      title: 'Overdue Invoice Alert',
      message: 'Invoice INV-2026-003 for Vikram Solar Enterprises is overdue by 18 days.',
      type: 'overdue',
      read: false,
      createdAt: '2026-09-17T07:00:00.000Z',
    },
  ];
  await db.notifications.bulkAdd(notifications);

  // 11. Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: 'log_1',
      userId: 'usr_admin',
      userName: 'Bebinjo Admin',
      action: 'Created Invoice INV-2026-001',
      module: 'Invoice',
      details: 'Invoice amount: ₹306,800 for InnovateX Technologies',
      timestamp: '2026-08-10T10:30:00.000Z',
    },
    {
      id: 'log_2',
      userId: 'usr_mgr',
      userName: 'Rajesh Sharma',
      action: 'Recorded Payment PAY-2026-002',
      module: 'Payment',
      details: 'Recorded UPI payment of ₹100,000 for INV-2026-002',
      timestamp: '2026-09-02T09:30:00.000Z',
    },
  ];
  await db.auditLogs.bulkAdd(auditLogs);

  console.log('Database seeding complete!');
}
