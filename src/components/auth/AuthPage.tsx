import React, { useState } from 'react';
import {
  Zap,
  Mail,
  Lock,
  User as UserIcon,
  Building,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getIndianStates, isValidGSTIN, isValidEmail } from '../../utils/validators';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();

  const [accountType, setAccountType] = useState<'owner' | 'customer'>('owner');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessState, setBusinessState] = useState('Karnataka');
  const [gstin, setGstin] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const success = await login(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (!success) {
      setErrorMsg('Invalid email or password. Click "Create Account" if you do not have an account yet.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (accountType === 'owner' && !businessName.trim()) {
      setErrorMsg('Please enter your business / shop name.');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (accountType === 'owner' && gstin && !isValidGSTIN(gstin)) {
      setErrorMsg('Invalid GSTIN format. (e.g. 29AAACI9988H1Z4)');
      return;
    }

    setLoading(true);
    try {
      await signup({
        accountType,
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        businessName: accountType === 'owner' ? businessName.trim() : '',
        businessState: accountType === 'owner' ? businessState : 'Karnataka',
        gstin: accountType === 'owner' ? gstin.trim().toUpperCase() : '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Hero Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-800 p-8 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-wide">BillPro GST</span>
            </div>
            <p className="text-emerald-100 text-xs mt-2 font-medium">
              Separate Portals for Business Owners & Customers
            </p>
          </div>

          <div className="relative z-10 space-y-4 my-8">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-50">
                <span className="font-bold block">🏢 Business Owner & Admin Portal</span>
                Manage inventory, generate GST invoices, track expenses & view sales analytics.
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-50">
                <span className="font-bold block">👤 Customer Self-Service Portal</span>
                Customers can view purchase invoices, download PDFs & pay balance online.
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-emerald-200">
            © 2026 BillPro GST. All rights reserved.
          </div>
        </div>

        {/* Right Auth Portal */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          
          {/* Account Type Selector Tabs */}
          <div className="mb-6 space-y-2">
            <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Select Account Type:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setAccountType('owner');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  accountType === 'owner'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Business Owner / Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('customer');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  accountType === 'customer'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Customer Account</span>
              </button>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
            <h2 className="text-lg font-bold text-white">
              {isSignUp
                ? `Create ${accountType === 'owner' ? 'Owner' : 'Customer'} Account`
                : `${accountType === 'owner' ? 'Business Owner' : 'Customer'} Log In`}
            </h2>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
            >
              {isSignUp ? 'Already registered? Log In' : 'New? Create Account'}
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* SIGN IN FORM */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder={accountType === 'owner' ? 'admin@company.com' : 'customer@gmail.com'}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Logging in...</span>
                ) : (
                  <span>Log In as {accountType === 'owner' ? 'Business Owner' : 'Customer'}</span>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Register here
                  </button>
                </span>
              </div>
            </form>
          ) : (
            /* CREATE ACCOUNT / SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="rahul@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {accountType === 'owner' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Business / Shop Name *
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Traders"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Business State *
                      </label>
                      <select
                        value={businessState}
                        onChange={(e) => setBusinessState(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {getIndianStates().map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        GSTIN (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="29AAACI9988H1Z4"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Customer Phone */
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <span>
                    Create {accountType === 'owner' ? 'Business Owner' : 'Customer'} Account
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
