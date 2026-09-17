import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Package,
  Users,
  PieChart as PieIcon,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { formatCurrency } from '../../utils/numberToWords';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';
import { useNotifications } from '../../context/NotificationContext';

export const ReportsView: React.FC = () => {
  const { showToast } = useNotifications();

  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];

  const [activeTab, setActiveTab] = useState<'sales' | 'gst' | 'profit' | 'inventory' | 'customer'>('sales');

  // Sales Totals
  const salesSummary = useMemo(() => {
    let totalSales = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    invoices.forEach((inv) => {
      if (inv.paymentStatus !== 'Cancelled') {
        totalSales += inv.grandTotal;
        totalCgst += inv.totalCgst;
        totalSgst += inv.totalSgst;
        totalIgst += inv.totalIgst;
        totalTax += inv.totalTax;
        totalDiscount += inv.totalDiscount;
      }
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalSales - totalExpenses;

    return {
      totalSales,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      totalDiscount,
      totalExpenses,
      netProfit,
    };
  }, [invoices, expenses]);

  // Export Sales Report to CSV
  const handleExportSalesCSV = () => {
    const data = invoices.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      Date: inv.invoiceDate,
      'Customer Name': inv.customerName,
      GSTIN: inv.customerGstin || 'N/A',
      'Place of Supply': inv.placeOfSupplyState,
      Taxable: inv.taxableSubtotal,
      CGST: inv.totalCgst,
      SGST: inv.totalSgst,
      IGST: inv.totalIgst,
      'Total Tax': inv.totalTax,
      'Grand Total': inv.grandTotal,
      Status: inv.paymentStatus,
    }));
    exportToCSV(data, `Sales_Report_${new Date().toISOString().split('T')[0]}`);
    showToast('Sales report exported to CSV', 'success');
  };

  // Export GST Report to Excel
  const handleExportGSTExcel = () => {
    const data = invoices.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      Date: inv.invoiceDate,
      Customer: inv.customerName,
      'Customer GSTIN': inv.customerGstin || 'Unregistered',
      'Supply Type': inv.isInterState ? 'Inter-State' : 'Intra-State',
      'Taxable Value': inv.taxableSubtotal,
      'CGST Amount': inv.totalCgst,
      'SGST Amount': inv.totalSgst,
      'IGST Amount': inv.totalIgst,
      'Total Tax': inv.totalTax,
      'Invoice Value': inv.grandTotal,
    }));
    exportToExcel(data, `GST_Summary_GSTR1_${new Date().toISOString().split('T')[0]}`);
    showToast('GST report exported to Excel', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Financial Reports & GST Tax Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export GSTR-1 tax summaries, profit & loss statements, sales ledgers & inventory valuations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportSalesCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportGSTExcel}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {[
          { id: 'sales', label: 'Sales Summary', icon: TrendingUp },
          { id: 'gst', label: 'GST Tax Summary', icon: FileText },
          { id: 'profit', label: 'Profit & Loss', icon: DollarSign },
          { id: 'inventory', label: 'Inventory Valuation', icon: Package },
          { id: 'customer', label: 'Outstanding Receivables', icon: Users },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === t.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sales Summary */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Gross Sales Revenue</span>
              <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                {formatCurrency(salesSummary.totalSales)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Tax Collected</span>
              <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                {formatCurrency(salesSummary.totalTax)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Discounts Given</span>
              <div className="text-xl font-extrabold text-rose-500 mt-1">
                {formatCurrency(salesSummary.totalDiscount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GST Tax Summary */}
      {activeTab === 'gst' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">GSTR-1 Tax Collection Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <span className="text-xs text-slate-500 font-semibold">CGST (Intra-State)</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(salesSummary.totalCgst)}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <span className="text-xs text-slate-500 font-semibold">SGST (Intra-State)</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(salesSummary.totalSgst)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl">
              <span className="text-xs text-slate-500 font-semibold">IGST (Inter-State)</span>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                {formatCurrency(salesSummary.totalIgst)}
              </div>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <span className="text-xs text-slate-500 font-semibold">Total GST Liability</span>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatCurrency(salesSummary.totalTax)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Profit & Loss */}
      {activeTab === 'profit' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Profit & Loss Overview</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
              <span>Total Operating Revenue:</span>
              <span className="text-emerald-600 font-bold">{formatCurrency(salesSummary.totalSales)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200">
              <span>Total Operational Expenses:</span>
              <span className="text-rose-600 font-bold">-{formatCurrency(salesSummary.totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-extrabold text-sm border-t border-slate-300 dark:border-slate-600">
              <span>Estimated Net Profit:</span>
              <span className={salesSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(salesSummary.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Inventory Valuation */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-right">Purchase Price</th>
                <th className="p-3.5 text-right">Selling Price</th>
                <th className="p-3.5 text-right">Total Inventory Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">{p.name}</td>
                  <td className="p-3.5 text-slate-500">{p.category}</td>
                  <td className="p-3.5 text-center font-bold">{p.currentStock} {p.unit}</td>
                  <td className="p-3.5 text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="p-3.5 text-right">{formatCurrency(p.sellingPrice)}</td>
                  <td className="p-3.5 text-right font-extrabold text-emerald-600">
                    {formatCurrency(p.currentStock * p.purchasePrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Customer Outstanding Receivables */}
      {activeTab === 'customer' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5 text-right">Total Purchases</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {customers
                .filter((c) => c.outstandingBalance > 0)
                .map((c) => (
                  <tr key={c.id}>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">{c.name}</td>
                    <td className="p-3.5 text-slate-500">{c.phone}</td>
                    <td className="p-3.5 text-slate-500">{c.state}</td>
                    <td className="p-3.5 text-right font-semibold">{formatCurrency(c.totalPurchases)}</td>
                    <td className="p-3.5 text-right text-emerald-600 font-medium">{formatCurrency(c.totalPaid)}</td>
                    <td className="p-3.5 text-right font-extrabold text-rose-600 text-sm">
                      {formatCurrency(c.outstandingBalance)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
