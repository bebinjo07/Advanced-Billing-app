import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Copy,
  Printer,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Invoice, InvoiceStatus } from '../../types';
import { formatCurrency } from '../../utils/numberToWords';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';

interface InvoiceListViewProps {
  onOpenCreate: () => void;
  onOpenEdit: (id: string) => void;
  onViewPrint: (id: string) => void;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  onOpenCreate,
  onOpenEdit,
  onViewPrint,
}) => {
  const { businessProfile, currentUser } = useAuth();
  const { showToast } = useNotifications();

  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [recordPayInvoice, setRecordPayInvoice] = useState<Invoice | null>(null);

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesQuery =
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerPhone.includes(searchQuery);

        const matchesStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, searchQuery, statusFilter]);

  // Actions
  const handleDuplicate = async (inv: Invoice) => {
    const count = await db.invoices.count();
    const prefix = businessProfile?.invoicePrefix || 'INV-2026-';
    const newNum = `${prefix}${(count + 1).toString().padStart(3, '0')}`;

    const newInv: Invoice = {
      ...inv,
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: newNum,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 0,
      balanceDue: inv.grandTotal,
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };

    await db.invoices.add(newInv);
    showToast(`Invoice duplicated as ${newNum}`, 'success');
  };

  const handleCancelInvoice = async (inv: Invoice) => {
    if (window.confirm(`Are you sure you want to cancel Invoice #${inv.invoiceNumber}?`)) {
      await db.invoices.update(inv.id, { paymentStatus: 'Cancelled' });
      showToast(`Invoice ${inv.invoiceNumber} marked as Cancelled`, 'warning');
    }
  };

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Invoices & Billing</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, filter, generate PDF, record payments & print invoices
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Invoice</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['All', 'Paid', 'Partially Paid', 'Pending', 'Overdue', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Balance</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No invoices matching search filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition"
                  >
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {inv.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>
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
                            : inv.paymentStatus === 'Cancelled'
                            ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => onViewPrint(inv.id)}
                        title="View & Print Invoice"
                        className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenEdit(inv.id)}
                        title="Edit Invoice"
                        className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        title="Download PDF"
                        className="p-1 rounded text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {inv.paymentStatus !== 'Paid' && inv.paymentStatus !== 'Cancelled' && (
                        <button
                          onClick={() => setRecordPayInvoice(inv)}
                          title="Record Payment"
                          className="p-1 rounded text-slate-400 hover:text-emerald-500"
                        >
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(inv)}
                        title="Duplicate Invoice"
                        className="p-1 rounded text-slate-400 hover:text-indigo-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {inv.paymentStatus !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelInvoice(inv)}
                          title="Cancel Invoice"
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                        >
                          <XCircle className="w-4 h-4" />
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

      {/* Record Payment Modal */}
      {recordPayInvoice && (
        <RecordPaymentModal
          isOpen={!!recordPayInvoice}
          invoice={recordPayInvoice}
          onClose={() => setRecordPayInvoice(null)}
          onRecorded={() => {
            setRecordPayInvoice(null);
            showToast('Payment recorded successfully!', 'success');
          }}
        />
      )}
    </div>
  );
};
