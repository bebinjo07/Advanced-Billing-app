import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  FileText,
  Shield,
  Download,
  Upload,
  CheckCircle,
  UserCheck,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getIndianStates, isValidGSTIN } from '../../utils/validators';
import { useNotifications } from '../../context/NotificationContext';
import { db } from '../../db/database';
import { UserRole } from '../../types';

export const SettingsView: React.FC = () => {
  const { businessProfile, updateBusinessProfile, allUsers, addUser, deleteUser, hasPermission } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'backup'>('profile');

  // Profile Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-2026-');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [terms, setTerms] = useState('');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('staff');

  useEffect(() => {
    if (businessProfile) {
      setName(businessProfile.name || '');
      setTagline(businessProfile.tagline || '');
      setAddress(businessProfile.address || '');
      setCity(businessProfile.city || '');
      setState(businessProfile.state || 'Karnataka');
      setPincode(businessProfile.pincode || '');
      setPhone(businessProfile.phone || '');
      setEmail(businessProfile.email || '');
      setGstin(businessProfile.gstin || '');
      setInvoicePrefix(businessProfile.invoicePrefix || 'INV-2026-');
      setBankName(businessProfile.bankDetails?.bankName || '');
      setAccountNumber(businessProfile.bankDetails?.accountNumber || '');
      setIfscCode(businessProfile.bankDetails?.ifscCode || '');
      setUpiId(businessProfile.bankDetails?.upiId || '');
      setTerms(businessProfile.termsAndConditions || '');
    }
  }, [businessProfile]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Business name is required', 'error');
      return;
    }
    if (gstin && !isValidGSTIN(gstin)) {
      showToast('Invalid GSTIN format', 'warning');
    }

    await updateBusinessProfile({
      name: name.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      city: city.trim(),
      state,
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      invoicePrefix: invoicePrefix.trim(),
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        branch: city,
        upiId: upiId.trim(),
      },
      termsAndConditions: terms,
    });

    showToast('Business profile updated successfully!', 'success');
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Name and email required', 'error');
      return;
    }
    await addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      active: true,
    });
    setNewUserName('');
    setNewUserEmail('');
    showToast('User created successfully!', 'success');
  };

  // Backup & Restore Database
  const handleExportBackup = async () => {
    const data = {
      users: await db.users.toArray(),
      businessProfile: await db.businessProfile.toArray(),
      customers: await db.customers.toArray(),
      products: await db.products.toArray(),
      categories: await db.categories.toArray(),
      suppliers: await db.suppliers.toArray(),
      invoices: await db.invoices.toArray(),
      payments: await db.payments.toArray(),
      expenses: await db.expenses.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BillPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Full Database JSON Backup exported', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Business Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure business details, GSTIN, invoice templates, user roles & backup database
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Business Profile & Tax</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>User Management & Roles</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Data Backup & Restore</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-xs max-w-3xl">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  GSTIN *
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold uppercase text-purple-600"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Business State *
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
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
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Bank & UPI Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Bank Account & UPI QR Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  UPI ID (for Invoice QR Code)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-emerald-600 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Standard Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Business Profile</span>
          </button>
        </div>
      )}

      {/* Tab 2: Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 text-xs max-w-3xl">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Add New System User</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="User Full Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
              <input
                type="email"
                placeholder="User Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
              >
                <option value="staff">Staff (Basic Billing)</option>
                <option value="manager">Manager (Billing + Products)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Existing Active Users</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {allUsers.map((u) => (
                <div key={u.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{u.name}</div>
                    <div className="text-slate-400">{u.email}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-0.5 rounded font-bold uppercase text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {u.role}
                    </span>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="text-rose-500 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Backup */}
      {activeTab === 'backup' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs max-w-xl">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Database Export & Backup</h3>
          <p className="text-slate-500">
            Export a full JSON dump of your invoices, customers, products, payments, and settings.
          </p>
          <button
            onClick={handleExportBackup}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Full JSON Database Dump</span>
          </button>
        </div>
      )}
    </div>
  );
};
