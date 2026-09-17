import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Plus,
  User as UserIcon,
  LogOut,
  Shield,
  Check,
  Building,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onQuickNewInvoice: () => void;
  onQuickAddCustomer: () => void;
  onQuickAddProduct: () => void;
  onToggleSidebarMobile: () => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onQuickNewInvoice,
  onQuickAddCustomer,
  onQuickAddProduct,
  onToggleSidebarMobile,
}) => {
  const { currentUser, businessProfile, allUsers, switchUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-4 md:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Toggle & Brand/Search Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebarMobile}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 text-xs w-64 transition"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Search invoices, SKU, customers...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Action</span>
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickNewInvoice();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200"
              >
                + Create Invoice
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickAddCustomer();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200"
              >
                + Add Customer
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickAddProduct();
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200"
              >
                + Add Product
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse"></span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs ${
                        !n.read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {n.title}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-emerald-500"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser?.name.charAt(0)}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser?.name}
              </div>
              <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {currentUser?.role}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <div className="font-bold text-slate-800 dark:text-slate-100">{currentUser?.name}</div>
                <div className="text-slate-400 text-[11px]">{currentUser?.email}</div>
                <div className="mt-1 flex items-center space-x-1 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-3 h-3" />
                  <span>Role: {currentUser?.role}</span>
                </div>
              </div>

              {/* Role Switcher Demo */}
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Role / User:
              </div>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u.id);
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center space-x-2">
                    <span className="capitalize font-medium">{u.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 uppercase">
                      {u.role}
                    </span>
                  </div>
                  {currentUser?.id === u.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))}

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
