import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { InvoiceListView } from './components/invoices/InvoiceListView';
import { InvoiceBuilderModal } from './components/invoices/InvoiceBuilderModal';
import { InvoicePrintView } from './components/invoices/InvoicePrintView';
import { ProductManagementView } from './components/products/ProductManagementView';
import { CustomerManagementView } from './components/customers/CustomerManagementView';
import { PaymentManagementView } from './components/payments/PaymentManagementView';
import { ExpenseManagementView } from './components/expenses/ExpenseManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { db } from './db/database';
import { Invoice } from './types';

const MainAppContent: React.FC = () => {
  const { businessProfile } = useAuth();
  const { showToast } = useNotifications();
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals & Overlays
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [viewingPrintInvoice, setViewingPrintInvoice] = useState<Invoice | null>(null);

  // Keyboard Shortcuts (Cmd/Ctrl + K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleViewInvoicePrint = async (invoiceId: string) => {
    const inv = await db.invoices.get(invoiceId);
    if (inv) setViewingPrintInvoice(inv);
  };

  const handleSelectSearchResult = (type: string, id: string) => {
    if (type === 'invoice') handleViewInvoicePrint(id);
    else if (type === 'product') setActiveView('products');
    else if (type === 'customer') setActiveView('customers');
    else if (type === 'payment') setActiveView('payments');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar
          activeView={activeView}
          onOpenSearch={() => setShowSearchModal(true)}
          onQuickNewInvoice={() => {
            setEditingInvoiceId(null);
            setShowInvoiceBuilder(true);
          }}
          onQuickAddCustomer={() => setActiveView('customers')}
          onQuickAddProduct={() => setActiveView('products')}
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* View Router Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeView === 'dashboard' && (
            <DashboardView
              onNavigate={(view) => setActiveView(view)}
              onOpenInvoiceBuilder={() => {
                setEditingInvoiceId(null);
                setShowInvoiceBuilder(true);
              }}
              onOpenAddCustomer={() => setActiveView('customers')}
              onOpenAddProduct={() => setActiveView('products')}
              onViewInvoice={handleViewInvoicePrint}
            />
          )}

          {activeView === 'invoices' && (
            <InvoiceListView
              onOpenCreate={() => {
                setEditingInvoiceId(null);
                setShowInvoiceBuilder(true);
              }}
              onOpenEdit={(id) => {
                setEditingInvoiceId(id);
                setShowInvoiceBuilder(true);
              }}
              onViewPrint={handleViewInvoicePrint}
            />
          )}

          {activeView === 'products' && (
            <ProductManagementView
              onOpenCreate={() => setActiveView('products')}
              onOpenScanner={() => setShowScannerModal(true)}
            />
          )}

          {activeView === 'customers' && (
            <CustomerManagementView
              onOpenCreate={() => setActiveView('customers')}
              onViewCustomerInvoices={(id) => setActiveView('invoices')}
            />
          )}

          {activeView === 'payments' && <PaymentManagementView />}

          {activeView === 'expenses' && <ExpenseManagementView />}

          {activeView === 'reports' && <ReportsView />}

          {activeView === 'settings' && <SettingsView />}

          {activeView === 'audit' && <AuditLogsView />}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectResult={handleSelectSearchResult}
      />

      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanProduct={(prod) => {
          showToast(`Scanned: ${prod.name}`, 'success');
        }}
      />

      <InvoiceBuilderModal
        isOpen={showInvoiceBuilder}
        onClose={() => setShowInvoiceBuilder(false)}
        editingInvoiceId={editingInvoiceId}
        onSaved={() => setActiveView('invoices')}
        onOpenScanner={() => setShowScannerModal(true)}
      />

      {viewingPrintInvoice && businessProfile && (
        <InvoicePrintView
          invoice={viewingPrintInvoice}
          business={businessProfile}
          onClose={() => setViewingPrintInvoice(null)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <MainAppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
