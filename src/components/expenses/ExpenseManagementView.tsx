import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Search, Trash2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Expense, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/numberToWords';
import { useNotifications } from '../../context/NotificationContext';

export const ExpenseManagementView: React.FC = () => {
  const { showToast } = useNotifications();
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.supplierName ? e.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) : false)
    );
  }, [expenses, searchQuery]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const handleSaveExpense = async () => {
    if (!title.trim() || amount <= 0) {
      showToast('Please provide expense title and valid amount', 'error');
      return;
    }

    const count = await db.expenses.count();
    const expNum = `EXP-2026-${(count + 1).toString().padStart(3, '0')}`;

    const newExpense: Expense = {
      id: 'exp_' + Math.random().toString(36).substring(2, 9),
      expenseNumber: expNum,
      title: title.trim(),
      category,
      amount,
      taxAmount,
      paymentMethod,
      date,
      supplierName: supplierName.trim(),
      notes,
      createdAt: new Date().toISOString(),
    };

    await db.expenses.add(newExpense);
    showToast(`Expense ${expNum} recorded!`, 'success');
    setShowModal(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Delete this expense record?')) {
      await db.expenses.delete(id);
      showToast('Expense record deleted', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Expense Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log operational business expenses, utility bills & supplier costs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Expenses</div>
            <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenseAmount)}
            </div>
          </div>
          <button
            onClick={() => {
              setTitle('');
              setAmount(500);
              setTaxAmount(90);
              setShowModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search expense title, category, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Expense #</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Supplier / Payee</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Tax Included</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {e.expenseNumber}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100">{e.title}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">{e.category}</td>
                  <td className="p-3.5 text-slate-500">{e.supplierName || '-'}</td>
                  <td className="p-3.5 text-slate-500">{e.date}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 text-[10px]">
                      {e.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3.5 text-right text-purple-600 font-mono">
                    {formatCurrency(e.taxAmount)}
                  </td>
                  <td className="p-3.5 text-right font-extrabold text-rose-600 text-sm">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col my-auto text-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Log Expense</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Rent or Internet Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Rent & Lease">Rent & Lease</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Salaries & Wages">Salaries & Wages</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                    <option value="Travel & Food">Travel & Food</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tax Amount (GST)
                  </label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Debit/Credit Card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Supplier / Payee Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Airtel Broadband"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExpense}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
