import React, { useState, useMemo } from 'react';
import {
  FileText,
  CreditCard,
  User as UserIcon,
  Download,
  Eye,
  Printer,
  DollarSign,
  QrCode,
  CheckCircle,
  Clock,
  Building,
  Save,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/numberToWords';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { useNotifications } from '../../context/NotificationContext';
import { Invoice } from '../../types';

interface CustomerPortalViewProps {
  onViewInvoice: (invoiceId: string) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({ onViewInvoice }) => {
  const { currentUser, businessProfile } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'profile'>('invoices');
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<Invoice | null>(null);

  // Profile Edit State
  const [custPhone, setCustPhone] = useState(currentUser?.phone || '');
  const [custAddress, setCustAddress] = useState('');
  const [custGstin, setCustGstin] = useState('');

  // Live Query Invoices & Payments for this logged in Customer
  const customerInvoices =
    useLiveQuery(
      () =>
        db.invoices
          .filter(
            (inv) =>
              inv.customerEmail.toLowerCase() === (currentUser?.email || '').toLowerCase() ||
              Boolean(currentUser?.phone && inv.customerPhone === currentUser.phone)
          )
          .toArray(),
      [currentUser]
    ) || [];

  const customerPayments =
    useLiveQuery(
      () =>
        db.payments
          .filter(
            (p) =>
              customerInvoices.some((inv) => inv.id === p.invoiceId) ||
              p.customerName.toLowerCase() === (currentUser?.name || '').toLowerCase()
          )
          .toArray(),
      [currentUser, customerInvoices]
    ) || [];

  // Summary Metrics
  const summary = useMemo(() => {
    let totalPurchases = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;

    customerInvoices.forEach((inv) => {
      if (inv.paymentStatus !== 'Cancelled') {
        totalPurchases += inv.grandTotal;
        totalPaid += inv.amountPaid;
        outstandingBalance += inv.balanceDue;
      }
    });

    return { totalPurchases, totalPaid, outstandingBalance };
  }, [customerInvoices]);

  const handleDownloadPDF = async (inv: Invoice) => {
    if (!businessProfile) return;
    try {
      const doc = await generateInvoicePDF(inv, businessProfile);
      doc.save(`${inv.invoiceNumber}.pdf`);
      showToast(`Downloaded PDF for ${inv.invoiceNumber}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider mb-2">
            Customer Portal
          </div>
          <h1 className="text-2xl font-black">Welcome, {currentUser?.name}!</h1>
          <p className="text-emerald-100 text-xs mt-1">
            View your invoice statements, track payment receipts & download tax invoices
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 text-xs">
          <div>
            <div className="text-[10px] text-emerald-200 uppercase font-semibold">Account Email</div>
            <div className="font-bold">{currentUser?.email}</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Invoiced Purchases
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {formatCurrency(summary.totalPurchases)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{customerInvoices.length} Tax Invoices</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Amount Cleared
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(summary.totalPaid)}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1">Verified receipts</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Outstanding Balance Due
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(summary.outstandingBalance)}
          </div>
          <div className="text-[10px] text-rose-500 mt-1">Pending payment</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Invoices ({customerInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment History ({customerPayments.length})</span>
        </button>
      </div>

      {/* TAB 1: My Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Invoice Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-right">Paid</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {customerInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No invoices found for your customer account yet.
                    </td>
                  </tr>
                ) : (
                  customerInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                      <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3.5 text-slate-500">{inv.invoiceDate}</td>
                      <td className="p-3.5 text-slate-500">{inv.dueDate}</td>
                      <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-slate-100">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="p-3.5 text-right text-emerald-600 font-medium">
                        {formatCurrency(inv.amountPaid)}
                      </td>
                      <td className="p-3.5 text-right text-rose-600 font-bold">
                        {formatCurrency(inv.balanceDue)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : inv.paymentStatus === 'Overdue'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => onViewInvoice(inv.id)}
                          title="View Invoice"
                          className="p-1 text-slate-400 hover:text-emerald-600"
                        >
                          <Eye className="w-4 h-4 text-emerald-500" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          title="Download PDF"
                          className="p-1 text-slate-400 hover:text-purple-600"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => setSelectedPayInvoice(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                          >
                            Pay Online
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: My Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Payment #</th>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Transaction Ref / UTR</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {customerPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No payment receipts logged yet.
                    </td>
                  </tr>
                ) : (
                  customerPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3.5 font-bold font-mono text-emerald-600">{p.paymentNumber}</td>
                      <td className="p-3.5 font-semibold">{p.invoiceNumber}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{p.paymentDate}</td>
                      <td className="p-3.5 font-mono text-slate-500">{p.transactionReference || '-'}</td>
                      <td className="p-3.5 text-right font-extrabold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Online Payment Modal for Customer */}
      {selectedPayInvoice && businessProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 text-xs space-y-4 my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Pay Invoice #{selectedPayInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setSelectedPayInvoice(null)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-center space-y-2 border border-emerald-200 dark:border-emerald-800">
              <div className="text-slate-500 uppercase font-bold text-[10px]">Amount Due</div>
              <div className="text-2xl font-black text-emerald-600">
                {formatCurrency(selectedPayInvoice.balanceDue)}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
              <div className="font-bold text-slate-800 dark:text-slate-200">Merchant Payment Details:</div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-1 font-mono text-slate-700 dark:text-slate-300">
                <div>Bank: {businessProfile.bankDetails?.bankName}</div>
                <div>A/C No: {businessProfile.bankDetails?.accountNumber}</div>
                <div>IFSC: {businessProfile.bankDetails?.ifscCode}</div>
                <div>UPI ID: <span className="font-bold text-emerald-600">{businessProfile.bankDetails?.upiId}</span></div>
              </div>
            </div>

            <button
              onClick={() => {
                showToast(`Payment instructions copied for ${businessProfile.name}`, 'success');
                setSelectedPayInvoice(null);
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
            >
              Copy UPI & Bank Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
