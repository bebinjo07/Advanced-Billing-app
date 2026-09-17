import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  ShieldAlert,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { businessProfile } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices & Billing', icon: FileText },
    { id: 'products', label: 'Products & Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Business Settings', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 border-r border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center space-x-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base tracking-wide flex items-center space-x-1">
              <span>BillPro</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                GST
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
              {businessProfile?.name || 'Enterprise Billing'}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
              </button>
            );
          })}
        </nav>

        {/* Footer / GST Badge */}
        <div className="p-4 m-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>GST Ready App</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Auto Intra & Inter-state CGST/SGST/IGST logic enabled.
          </p>
        </div>
      </aside>
    </>
  );
};
