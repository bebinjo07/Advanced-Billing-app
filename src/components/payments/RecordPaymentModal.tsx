import React, { useState } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { db } from '../../db/database';
import { Invoice, PaymentMethod, Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/numberToWords';

interface RecordPaymentModalProps {
  isOpen: boolean;
  invoice: Invoice;
  onClose: () => void;
  onRecorded: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  invoice,
  onClose,
  onRecorded,
}) => {
  const { currentUser } = useAuth();
  const { showToast, addNotification } = useNotifications();

  const [amount, setAmount] = useState<number>(invoice.balanceDue);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('Payment received against invoice');

  if (!isOpen) return null;

  const handleSavePayment = async () => {
    if (amount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    const count = await db.payments.count();
    const payNum = `PAY-2026-${(count + 1).toString().padStart(3, '0')}`;

    const newPayment: Payment = {
      id: 'pay_' + Math.random().toString(36).substring(2, 9),
      paymentNumber: payNum,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount,
      paymentMethod,
      paymentDate,
      transactionReference: transactionReference.trim(),
      notes,
      createdById: currentUser?.id || 'usr_admin',
      createdAt: new Date().toISOString(),
    };

    await db.payments.add(newPayment);

    // Update Invoice Payment Status & Amounts
    const newAmountPaid = invoice.amountPaid + amount;
    const newBalance = Math.max(0, invoice.grandTotal - newAmountPaid);

    let newStatus: Invoice['paymentStatus'] = 'Partially Paid';
    if (newAmountPaid >= invoice.grandTotal) {
      newStatus = 'Paid';
    }

    await db.invoices.update(invoice.id, {
      amountPaid: newAmountPaid,
      balanceDue: newBalance,
      paymentStatus: newStatus,
    });

    // Update Customer Paid & Balance
    if (invoice.customerId) {
      const cust = await db.customers.get(invoice.customerId);
      if (cust) {
        const updatedPaid = cust.totalPaid + amount;
        const updatedBalance = Math.max(0, cust.totalPurchases - updatedPaid);
        await db.customers.update(invoice.customerId, {
          totalPaid: updatedPaid,
          outstandingBalance: updatedBalance,
        });
      }
    }

    // Add Audit Log & Notification
    await db.auditLogs.add({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      userId: currentUser?.id || 'usr_admin',
      userName: currentUser?.name || 'Admin',
      action: `Recorded Payment ${payNum}`,
      module: 'Payment',
      details: `Received ₹${amount} via ${paymentMethod} for Invoice ${invoice.invoiceNumber}`,
      timestamp: new Date().toISOString(),
    });

    addNotification(
      'New Payment Received',
      `Payment of ₹${amount} received from ${invoice.customerName} (${paymentMethod}).`,
      'new_payment'
    );

    onRecorded();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col my-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Record Payment — {invoice.invoiceNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg flex justify-between items-center">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {invoice.customerName}
              </div>
              <div className="text-[10px] text-slate-400">Total: {formatCurrency(invoice.grandTotal)}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-rose-500">
                Balance Due: {formatCurrency(invoice.balanceDue)}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-emerald-600 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
              >
                <option value="UPI">UPI / QR</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Debit/Credit Card">Debit/Credit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-99881122 or UPI-992211"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePayment}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
