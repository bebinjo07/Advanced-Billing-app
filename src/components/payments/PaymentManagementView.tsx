import React, { useState, useMemo } from 'react';
import { CreditCard, Search, Plus, Calendar, CheckCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { formatCurrency } from '../../utils/numberToWords';

export const PaymentManagementView: React.FC = () => {
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const matchesQuery =
          p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.transactionReference.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;

        return matchesQuery && matchesMethod;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [payments, searchQuery, methodFilter]);

  const totalAmountReceived = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Payment Transactions Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit payment receipts, UPI references, NEFT/IMPS transfers & cash entries
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Filtered Payments</div>
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalAmountReceived)}
          </div>
        </div>
      </div>

      {/* Search & Method Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, invoice #, UTR, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Payment Mode:</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-medium"
          >
            <option value="All">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Debit/Credit Card">Debit/Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Payment ID</th>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Transaction Ref / UTR</th>
                <th className="p-3.5 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {p.paymentNumber}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100">
                    {p.invoiceNumber}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                    {p.customerName}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300 text-[10px]">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{p.paymentDate}</td>
                  <td className="p-3.5 font-mono text-slate-500">{p.transactionReference || '-'}</td>
                  <td className="p-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
