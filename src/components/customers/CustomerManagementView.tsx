import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  Trash2,
  X,
  CreditCard,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Customer, Invoice } from '../../types';
import { formatCurrency } from '../../utils/numberToWords';
import { getIndianStates, isValidGSTIN } from '../../utils/validators';
import { useNotifications } from '../../context/NotificationContext';

interface CustomerManagementViewProps {
  onOpenCreate: () => void;
  onViewCustomerInvoices: (customerId: string) => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  onOpenCreate,
  onViewCustomerInvoices,
}) => {
  const { showToast } = useNotifications();

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Karnataka');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.gstin ? c.gstin.toLowerCase().includes(searchQuery.toLowerCase()) : false)
      );
    });
  }, [customers, searchQuery]);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setGstin('');
    setAddress('');
    setState('Karnataka');
    setShowModal(true);
  };

  const openEditCustomerModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setGstin(c.gstin || '');
    setAddress(c.billingAddress);
    setState(c.state || 'Karnataka');
    setShowModal(true);
  };

  const handleSaveCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      showToast('Name and phone are required', 'error');
      return;
    }
    if (gstin && !isValidGSTIN(gstin)) {
      showToast('Invalid GSTIN format', 'warning');
    }

    const custData: Customer = {
      id: editingCustomer ? editingCustomer.id : 'cust_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      customerCode: editingCustomer
        ? editingCustomer.customerCode
        : 'CUST-' + Math.floor(100 + Math.random() * 900),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      billingAddress: address.trim() || `${state}, India`,
      shippingAddress: address.trim() || `${state}, India`,
      city: '',
      state,
      pincode: '',
      totalPurchases: editingCustomer ? editingCustomer.totalPurchases : 0,
      totalPaid: editingCustomer ? editingCustomer.totalPaid : 0,
      outstandingBalance: editingCustomer ? editingCustomer.outstandingBalance : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    await db.customers.put(custData);
    showToast(`Customer ${custData.name} saved!`, 'success');
    setShowModal(false);
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (window.confirm(`Delete customer "${name}"?`)) {
      await db.customers.delete(id);
      showToast(`Customer ${name} deleted`, 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Customer Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer accounts, verified GSTINs, purchase history & balances
          </p>
        </div>

        <button
          onClick={openNewCustomerModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, phone, email, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Contact Info</th>
                <th className="p-3.5">GSTIN</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5 text-right">Total Purchases</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Outstanding</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{c.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{c.customerCode}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                      <Mail className="w-3 h-3" />
                      <span>{c.email}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                    {c.gstin ? (
                      <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Unregistered</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">{c.state}</td>
                  <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-slate-100">
                    {formatCurrency(c.totalPurchases)}
                  </td>
                  <td className="p-3.5 text-right text-emerald-600 font-medium">
                    {formatCurrency(c.totalPaid)}
                  </td>
                  <td className="p-3.5 text-right font-bold text-rose-600">
                    {formatCurrency(c.outstandingBalance)}
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      title="View Invoice History Drawer"
                      className="p-1 rounded text-slate-400 hover:text-emerald-600"
                    >
                      <FileText className="w-4 h-4 text-emerald-500" />
                    </button>
                    <button
                      onClick={() => openEditCustomerModal(c)}
                      title="Edit Customer"
                      className="p-1 rounded text-slate-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.id, c.name)}
                      title="Delete Customer"
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
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

      {/* Customer Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col my-auto text-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. InnovateX Technologies"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@innovatex.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="29AAACI9988H1Z4"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    State *
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                  >
                    {getIndianStates().map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, Pincode"
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
                onClick={handleSaveCustomer}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col text-xs">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {selectedCustomer.name}
                </h3>
                <p className="text-[11px] text-slate-400">Customer Ledger & Invoices</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GSTIN:</span>
                  <span className="font-mono font-bold text-purple-600">
                    {selectedCustomer.gstin || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-2 font-bold">
                  <span>Outstanding Due:</span>
                  <span className="text-rose-600">
                    {formatCurrency(selectedCustomer.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                  Invoice History
                </h4>
                <div className="space-y-2">
                  {invoices
                    .filter((inv) => inv.customerId === selectedCustomer.id)
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-white dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            {inv.invoiceNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">Date: {inv.invoiceDate}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100">
                            {formatCurrency(inv.grandTotal)}
                          </div>
                          <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-semibold text-slate-600">
                            {inv.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
