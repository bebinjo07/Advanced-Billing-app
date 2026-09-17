import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Package, Users, CreditCard, ArrowRight } from 'lucide-react';
import { db } from '../../db/database';
import { Invoice, Product, Customer, Payment } from '../../types';
import { formatCurrency } from '../../utils/numberToWords';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (type: 'invoice' | 'product' | 'customer' | 'payment', id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setInvoices([]);
      setProducts([]);
      setCustomers([]);
      setPayments([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setInvoices([]);
        setProducts([]);
        setCustomers([]);
        setPayments([]);
        return;
      }
      const q = query.toLowerCase().trim();

      const matchedInvoices = await db.invoices
        .filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            inv.customerPhone.includes(q)
        )
        .limit(5)
        .toArray();

      const matchedProducts = await db.products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.includes(q) ||
            p.hsnSac.includes(q)
        )
        .limit(5)
        .toArray();

      const matchedCustomers = await db.customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.gstin ? c.gstin.toLowerCase().includes(q) : false)
        )
        .limit(5)
        .toArray();

      const matchedPayments = await db.payments
        .filter(
          (p) =>
            p.paymentNumber.toLowerCase().includes(q) ||
            p.invoiceNumber.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            p.transactionReference.toLowerCase().includes(q)
        )
        .limit(5)
        .toArray();

      setInvoices(matchedInvoices);
      setProducts(matchedProducts);
      setCustomers(matchedCustomers);
      setPayments(matchedPayments);
    }

    const timer = setTimeout(performSearch, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = invoices.length + products.length + customers.length + payments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone, product SKU, barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 text-base"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-4 space-y-6 flex-1">
          {!query.trim() && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              Type anything to instantly search invoices, products, customers, and payments.
            </div>
          )}

          {query.trim() && totalResults === 0 && (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No matching records found for "<span className="font-semibold">{query}</span>".
            </div>
          )}

          {/* Invoices */}
          {invoices.length > 0 && (
            <div>
              <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                <FileText className="w-4 h-4 mr-1 text-emerald-500" /> Invoices ({invoices.length})
              </h4>
              <div className="space-y-1">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onSelectResult('invoice', inv.id);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {inv.invoiceNumber} — <span className="font-normal text-slate-600 dark:text-slate-300">{inv.customerName}</span>
                      </div>
                      <div className="text-xs text-slate-400">Date: {inv.invoiceDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(inv.grandTotal)}
                      </div>
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div>
              <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                <Package className="w-4 h-4 mr-1 text-blue-500" /> Products ({products.length})
              </h4>
              <div className="space-y-1">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectResult('product', p.id);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        SKU: {p.sku} | HSN: {p.hsnSac || 'N/A'} | Stock: {p.currentStock} {p.unit}
                      </div>
                    </div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                      {formatCurrency(p.sellingPrice)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {customers.length > 0 && (
            <div>
              <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                <Users className="w-4 h-4 mr-1 text-purple-500" /> Customers ({customers.length})
              </h4>
              <div className="space-y-1">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectResult('customer', c.id);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {c.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Phone: {c.phone} | State: {c.state}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-slate-500">Total: {formatCurrency(c.totalPurchases)}</div>
                      {c.outstandingBalance > 0 && (
                        <div className="font-semibold text-rose-500">
                          Due: {formatCurrency(c.outstandingBalance)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div>
              <h4 className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                <CreditCard className="w-4 h-4 mr-1 text-amber-500" /> Payments ({payments.length})
              </h4>
              <div className="space-y-1">
                {payments.map((pay) => (
                  <button
                    key={pay.id}
                    onClick={() => {
                      onSelectResult('payment', pay.id);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {pay.paymentNumber} — {pay.paymentMethod}
                      </div>
                      <div className="text-xs text-slate-400">
                        For Invoice {pay.invoiceNumber} | Ref: {pay.transactionReference || 'N/A'}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600 text-sm">
                      +{formatCurrency(pay.amount)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center justify-between">
          <span>Press ESC to exit</span>
          <span>BillPro Quick Search</span>
        </div>
      </div>
    </div>
  );
};
