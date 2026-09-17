import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle, AlertTriangle, Scan } from 'lucide-react';
import { db } from '../../db/database';
import { Invoice, InvoiceItem, Customer, Product, BusinessProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  calculateInvoiceItem,
  calculateInvoiceTotals,
  ItemCalculationInput,
} from '../../utils/gstCalculator';
import { syncInvoiceToNeon, syncProductToNeon, syncCustomerToNeon } from '../../db/neonSync';
import { getIndianStates, isValidGSTIN } from '../../utils/validators';
import { formatCurrency } from '../../utils/numberToWords';

interface InvoiceBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoiceId?: string | null;
  onSaved: () => void;
  onOpenScanner?: () => void;
}

export const InvoiceBuilderModal: React.FC<InvoiceBuilderModalProps> = ({
  isOpen,
  onClose,
  editingInvoiceId,
  onSaved,
  onOpenScanner,
}) => {
  const { currentUser, businessProfile } = useAuth();
  const { showToast, addNotification } = useNotifications();

  // Reference lists from DB
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState('Karnataka');
  const [reverseCharge, setReverseCharge] = useState(false);

  // Line items
  const [lineInputs, setLineInputs] = useState<ItemCalculationInput[]>([]);

  // Extras & Payment
  const [shippingCharges, setShippingCharges] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [enableRoundOff, setEnableRoundOff] = useState(true);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('Thank you for your business!');

  // Inline Customer Creation Toggle
  const [showAddCustomerInline, setShowAddCustomerInline] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustState, setNewCustState] = useState('Karnataka');

  // Load Customers & Products
  useEffect(() => {
    async function loadData() {
      const custs = await db.customers.toArray();
      const prods = await db.products.toArray();
      setCustomers(custs);
      setProducts(prods);

      if (businessProfile) {
        setPlaceOfSupplyState(businessProfile.state || 'Karnataka');
      }

      if (!editingInvoiceId) {
        // Auto-generate Invoice #
        const count = await db.invoices.count();
        const prefix = businessProfile?.invoicePrefix || 'INV-2026-';
        const formattedNum = `${prefix}${(count + 1).toString().padStart(3, '0')}`;
        setInvoiceNumber(formattedNum);

        // Add 1 empty item default
        if (prods.length > 0) {
          const p = prods[0];
          setLineInputs([
            {
              productId: p.id,
              productName: p.name,
              hsnSac: p.hsnSac,
              quantity: 1,
              unitPrice: p.sellingPrice,
              discountType: 'percentage',
              discountValue: 0,
              gstRate: p.gstRate,
            },
          ]);
        }
      } else {
        // Edit Mode: Load Invoice
        const inv = await db.invoices.get(editingInvoiceId);
        if (inv) {
          setInvoiceNumber(inv.invoiceNumber);
          setInvoiceDate(inv.invoiceDate);
          setDueDate(inv.dueDate);
          setSelectedCustomerId(inv.customerId);
          setCustomerName(inv.customerName);
          setCustomerPhone(inv.customerPhone);
          setCustomerEmail(inv.customerEmail);
          setCustomerGstin(inv.customerGstin || '');
          setBillingAddress(inv.billingAddress);
          setShippingAddress(inv.shippingAddress);
          setPlaceOfSupplyState(inv.placeOfSupplyState);
          setReverseCharge(inv.reverseCharge);
          setShippingCharges(inv.shippingCharges);
          setAdditionalCharges(inv.additionalCharges);
          setAmountPaid(inv.amountPaid);
          setNotes(inv.notes || '');

          setLineInputs(
            inv.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              hsnSac: i.hsnSac,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountType: i.discountType,
              discountValue: i.discountValue,
              gstRate: i.gstRate,
            }))
          );
        }
      }
    }

    if (isOpen) loadData();
  }, [isOpen, editingInvoiceId, businessProfile]);

  // Handle Customer Selection
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
      setCustomerEmail(cust.email);
      setCustomerGstin(cust.gstin || '');
      setBillingAddress(cust.billingAddress);
      setShippingAddress(cust.shippingAddress || cust.billingAddress);
      setPlaceOfSupplyState(cust.state || businessProfile?.state || 'Karnataka');
    }
  };

  // Inline Quick Add Customer
  const handleCreateInlineCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      showToast('Please provide customer name and phone', 'error');
      return;
    }
    const newCust: Customer = {
      id: 'cust_' + Math.random().toString(36).substring(2, 9),
      name: newCustName.trim(),
      customerCode: 'CUST-' + Math.floor(100 + Math.random() * 900),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || `${newCustName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      gstin: '',
      billingAddress: `${newCustState}, India`,
      shippingAddress: `${newCustState}, India`,
      city: '',
      state: newCustState,
      pincode: '',
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    await db.customers.add(newCust);
    const allCusts = await db.customers.toArray();
    setCustomers(allCusts);
    handleSelectCustomer(newCust.id);
    setShowAddCustomerInline(false);
    showToast(`Customer ${newCust.name} added!`, 'success');
  };

  // Determine Inter-state vs Intra-state
  const isInterState = useMemo(() => {
    const bizState = businessProfile?.state || 'Karnataka';
    return bizState.trim().toLowerCase() !== placeOfSupplyState.trim().toLowerCase();
  }, [businessProfile, placeOfSupplyState]);

  // Compute items & totals in real-time
  const calculatedItems = useMemo<InvoiceItem[]>(() => {
    return lineInputs.map((input) => calculateInvoiceItem(input, isInterState));
  }, [lineInputs, isInterState]);

  const totals = useMemo(() => {
    return calculateInvoiceTotals(
      calculatedItems,
      shippingCharges,
      additionalCharges,
      enableRoundOff,
      amountPaid
    );
  }, [calculatedItems, shippingCharges, additionalCharges, enableRoundOff, amountPaid]);

  // Add Item Line
  const handleAddLine = () => {
    if (products.length === 0) return;
    const p = products[0];
    setLineInputs((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        hsnSac: p.hsnSac,
        quantity: 1,
        unitPrice: p.sellingPrice,
        discountType: 'percentage',
        discountValue: 0,
        gstRate: p.gstRate,
      },
    ]);
  };

  // Update Item Line
  const handleLineChange = (index: number, fields: Partial<ItemCalculationInput>) => {
    setLineInputs((prev) => {
      const next = [...prev];
      const updated = { ...next[index], ...fields };

      // If product ID changed, sync default price, SKU, HSN
      if (fields.productId && fields.productId !== next[index].productId) {
        const prod = products.find((p) => p.id === fields.productId);
        if (prod) {
          updated.productName = prod.name;
          updated.hsnSac = prod.hsnSac;
          updated.unitPrice = prod.sellingPrice;
          updated.gstRate = prod.gstRate;
        }
      }

      next[index] = updated;
      return next;
    });
  };

  // Remove Line
  const handleRemoveLine = (index: number) => {
    setLineInputs((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Invoice Handler
  const handleSaveInvoice = async () => {
    if (!customerName.trim()) {
      showToast('Please enter customer name', 'error');
      return;
    }
    if (calculatedItems.length === 0) {
      showToast('Please add at least one product item', 'error');
      return;
    }
    if (customerGstin && !isValidGSTIN(customerGstin)) {
      showToast('Invalid GSTIN format', 'warning');
    }

    const businessState = businessProfile?.state || 'Karnataka';

    const invoiceData: Invoice = {
      id: editingInvoiceId || 'inv_' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      customerId: selectedCustomerId || 'cust_guest',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      customerGstin: customerGstin.trim().toUpperCase(),
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim() || billingAddress.trim(),
      placeOfSupplyState,
      businessState,
      isInterState,
      reverseCharge,
      items: calculatedItems,
      ...totals,
      invoiceType: 'Regular',
      notes,
      createdById: currentUser?.id || 'usr_admin',
      createdAt: new Date().toISOString(),
    };

    await db.invoices.put(invoiceData);
    syncInvoiceToNeon(invoiceData).catch(console.error);

    // Update Customer Totals & Balances
    if (selectedCustomerId) {
      const cust = await db.customers.get(selectedCustomerId);
      if (cust) {
        const updatedTotalPurchases = cust.totalPurchases + totals.grandTotal;
        const updatedPaid = cust.totalPaid + totals.amountPaid;
        const updatedBalance = Math.max(0, updatedTotalPurchases - updatedPaid);
        await db.customers.update(selectedCustomerId, {
          totalPurchases: updatedTotalPurchases,
          totalPaid: updatedPaid,
          outstandingBalance: updatedBalance,
        });
      }
    }

    // Auto-Deduct Inventory Stock
    for (const item of calculatedItems) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        const prevStock = prod.currentStock;
        const newStock = Math.max(0, prevStock - item.quantity);

        await db.products.update(item.productId, { currentStock: newStock });

        // Record Inventory Audit Transaction
        await db.inventoryTransactions.add({
          id: 'tx_' + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productName: item.productName,
          type: 'Invoice Deduction',
          quantityChange: -item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          referenceId: invoiceNumber,
          notes: `Deducted for Invoice #${invoiceNumber}`,
          date: new Date().toISOString(),
        });

        // Trigger notification if low or out of stock
        if (newStock <= prod.minStockLevel && newStock > 0) {
          addNotification(
            'Low Stock Alert',
            `Product "${prod.name}" stock is now ${newStock} ${prod.unit} (Min: ${prod.minStockLevel}).`,
            'low_stock'
          );
        } else if (newStock === 0) {
          addNotification(
            'Out of Stock Alert',
            `Product "${prod.name}" is completely OUT OF STOCK!`,
            'out_of_stock'
          );
        }
      }
    }

    // Record Audit Log
    await db.auditLogs.add({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      userId: currentUser?.id || 'usr_admin',
      userName: currentUser?.name || 'Admin',
      action: editingInvoiceId ? `Updated Invoice ${invoiceNumber}` : `Created Invoice ${invoiceNumber}`,
      module: 'Invoice',
      details: `Grand Total: ₹${totals.grandTotal} for ${customerName}`,
      timestamp: new Date().toISOString(),
    });

    showToast(`Invoice ${invoiceNumber} saved successfully!`, 'success');
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingInvoiceId ? 'Edit Invoice' : 'Create New GST Tax Invoice'}
            </h2>
            <p className="text-xs text-slate-400">
              Auto real-time tax calculation, state determination & stock deduction
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                <Scan className="w-4 h-4 text-emerald-500" />
                <span>Barcode Scan</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Section 2: Customer Details & GST State */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Customer & Billing Details
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerInline(!showAddCustomerInline)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                {showAddCustomerInline ? 'Select Existing Customer' : '+ Add New Customer'}
              </button>
            </div>

            {showAddCustomerInline ? (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                  Quick Add Customer
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Phone *"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                  <select
                    value={newCustState}
                    onChange={(e) => setNewCustState(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  >
                    {getIndianStates().map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleCreateInlineCustomer}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Save & Select Customer
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                  >
                    <option value="">-- Custom / One-Time Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Enterprises"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer GSTIN
                  </label>
                  <input
                    type="text"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 29AAACI9988H1Z4"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}

            {/* Place of Supply State & Tax Determination Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Place of Supply (State) *
                </label>
                <select
                  value={placeOfSupplyState}
                  onChange={(e) => setPlaceOfSupplyState(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                >
                  {getIndianStates().map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Street, City, Pincode"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>

              {/* Tax Type Badge */}
              <div className="flex flex-col justify-end">
                <div
                  className={`p-2.5 rounded-lg border flex items-center space-x-2 font-bold ${
                    isInterState
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {isInterState
                      ? 'Inter-State Transaction: IGST Applied'
                      : 'Intra-State Transaction: CGST + SGST Split'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Product Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Product & Services Table
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item Line</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Product / Item</th>
                    <th className="p-2.5 w-20">HSN/SAC</th>
                    <th className="p-2.5 w-20">Qty</th>
                    <th className="p-2.5 w-28">Price (₹)</th>
                    <th className="p-2.5 w-28">Discount</th>
                    <th className="p-2.5 w-24">GST %</th>
                    <th className="p-2.5 w-28 text-right">Taxable</th>
                    <th className="p-2.5 w-32 text-right">Total (₹)</th>
                    <th className="p-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {lineInputs.map((line, idx) => {
                    const calc = calculatedItems[idx];
                    const prod = products.find((p) => p.id === line.productId);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                        <td className="p-2">
                          <select
                            value={line.productId}
                            onChange={(e) => handleLineChange(idx, { productId: e.target.value })}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-semibold text-slate-800 dark:text-slate-100"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                          {prod && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              SKU: {prod.sku} | Available: {prod.currentStock} {prod.unit}
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.hsnSac}
                            onChange={(e) => handleLineChange(idx, { hsnSac: e.target.value })}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-center font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineChange(idx, { quantity: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-center font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) =>
                              handleLineChange(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-right font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <input
                              type="number"
                              value={line.discountValue}
                              onChange={(e) =>
                                handleLineChange(idx, {
                                  discountValue: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-16 px-1.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-right"
                            />
                            <select
                              value={line.discountType}
                              onChange={(e) =>
                                handleLineChange(idx, {
                                  discountType: e.target.value as 'percentage' | 'fixed',
                                })
                              }
                              className="px-1 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px]"
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₹</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={line.gstRate}
                            onChange={(e) =>
                              handleLineChange(idx, { gstRate: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-center font-semibold"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(calc?.taxableAmount || 0)}
                        </td>
                        <td className="p-2 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(calc?.totalAmount || 0)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Calculations Summary & Extra Charges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Left: Extra Charges & Notes */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Shipping Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-right"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Additional Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-right"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount Advance Paid Now (₹)
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-right font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Terms & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            {/* Right: Calculated Grand Totals */}
            <div className="space-y-2 text-right font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Total Item Discounts:</span>
                <span>-{formatCurrency(totals.totalDiscount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-1">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(totals.taxableSubtotal)}</span>
              </div>

              {isInterState ? (
                <div className="flex justify-between text-purple-600 dark:text-purple-400">
                  <span>IGST Total:</span>
                  <span>{formatCurrency(totals.totalIgst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>CGST Total:</span>
                    <span>{formatCurrency(totals.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>SGST Total:</span>
                    <span>{formatCurrency(totals.totalSgst)}</span>
                  </div>
                </>
              )}

              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Round Off:</span>
                  <span>
                    {totals.roundOff > 0 ? '+' : ''}
                    {formatCurrency(totals.roundOff)}
                  </span>
                </div>
              )}

              {/* Grand Total Box */}
              <div className="flex justify-between items-center p-3 bg-emerald-600 text-white rounded-lg shadow-lg text-base font-extrabold my-2">
                <span>Grand Total:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-xs text-rose-500 font-bold">
                <span>Balance Due:</span>
                <span>{formatCurrency(totals.balanceDue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveInvoice}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save & Deduct Inventory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
