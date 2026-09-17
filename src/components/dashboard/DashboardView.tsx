import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Package,
  Landmark,
  Plus,
  ArrowUpRight,
  Eye,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { formatCurrency } from '../../utils/numberToWords';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenInvoiceBuilder: () => void;
  onOpenAddCustomer: () => void;
  onOpenAddProduct: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenInvoiceBuilder,
  onOpenAddCustomer,
  onOpenAddProduct,
  onViewInvoice,
}) => {
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // Metrics Calculations
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let totalSales = 0;
    let todaySales = 0;
    let monthlySales = 0;
    let totalTaxCollected = 0;
    let paidInvoicesCount = 0;
    let pendingInvoicesCount = 0;
    let overdueInvoicesCount = 0;
    let outstandingAmount = 0;

    invoices.forEach((inv) => {
      if (inv.paymentStatus !== 'Cancelled') {
        totalSales += inv.grandTotal;
        totalTaxCollected += inv.totalTax;
        outstandingAmount += inv.balanceDue;

        const invDate = new Date(inv.invoiceDate);
        if (inv.invoiceDate === todayStr) {
          todaySales += inv.grandTotal;
        }
        if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) {
          monthlySales += inv.grandTotal;
        }

        if (inv.paymentStatus === 'Paid') paidInvoicesCount++;
        else if (inv.paymentStatus === 'Pending') pendingInvoicesCount++;
        else if (inv.paymentStatus === 'Overdue') overdueInvoicesCount++;
        else if (inv.paymentStatus === 'Partially Paid') pendingInvoicesCount++;
      }
    });

    return {
      totalSales,
      todaySales,
      monthlySales,
      totalInvoices: invoices.length,
      paidInvoicesCount,
      pendingInvoicesCount,
      overdueInvoicesCount,
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalTaxCollected,
      outstandingAmount,
    };
  }, [invoices, customers, products]);

  // Chart Data: Sales Trend
  const salesTrendData = useMemo(() => {
    const monthlyMap: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed default zeros
    months.forEach((m) => (monthlyMap[m] = 0));

    invoices.forEach((inv) => {
      if (inv.paymentStatus !== 'Cancelled') {
        const d = new Date(inv.invoiceDate);
        const mName = months[d.getMonth()];
        monthlyMap[mName] += inv.grandTotal;
      }
    });

    return months.map((m) => ({ month: m, Sales: monthlyMap[m] }));
  }, [invoices]);

  // Chart Data: Sales by Category
  const categorySalesData = useMemo(() => {
    const catMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const p = products.find((prod) => prod.id === item.productId);
        const catName = p ? p.category : 'General';
        catMap[catName] = (catMap[catName] || 0) + item.totalAmount;
      });
    });

    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
    return Object.keys(catMap).map((cat, idx) => ({
      name: cat,
      value: catMap[cat],
      color: colors[idx % colors.length],
    }));
  }, [invoices, products]);

  // Chart Data: Payment Methods
  const paymentMethodData = useMemo(() => {
    const pMap: Record<string, number> = {};
    payments.forEach((p) => {
      pMap[p.paymentMethod] = (pMap[p.paymentMethod] || 0) + p.amount;
    });
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899'];
    return Object.keys(pMap).map((m, idx) => ({
      name: m,
      value: pMap[m],
      color: colors[idx % colors.length],
    }));
  }, [payments]);

  // Chart Data: Top Selling Products
  const topProductsData = useMemo(() => {
    const pMap: Record<string, { name: string; qty: number; total: number }> = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!pMap[item.productName]) {
          pMap[item.productName] = { name: item.productName, qty: 0, total: 0 };
        }
        pMap[item.productName].qty += item.quantity;
        pMap[item.productName].total += item.totalAmount;
      });
    });

    return Object.values(pMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockLevel);
  }, [products]);

  // Recent Invoices
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time business performance overview, GST summaries & quick operations
          </p>
        </div>

        {/* Quick Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenInvoiceBuilder}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Invoice</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Users className="w-4 h-4" />
            <span>+ Customer</span>
          </button>
          <button
            onClick={onOpenAddProduct}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Package className="w-4 h-4" />
            <span>+ Product</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {formatCurrency(metrics.totalSales)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Lifetime aggregate
          </div>
        </div>

        {/* Today Sales */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {formatCurrency(metrics.todaySales)}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
            For current date
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Monthly Sales</span>
            <Landmark className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {formatCurrency(metrics.monthlySales)}
          </div>
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            Current calendar month
          </div>
        </div>

        {/* Total Tax Collected */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">GST Collected</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {formatCurrency(metrics.totalTaxCollected)}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mt-1">
            CGST + SGST + IGST
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Outstanding</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-lg md:text-xl font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency(metrics.outstandingAmount)}
          </div>
          <div className="text-[10px] text-rose-500 font-medium mt-1">Uncollected receivables</div>
        </div>

        {/* Total Invoices Count */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Invoices</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-100">
            {metrics.totalInvoices}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            {metrics.paidInvoicesCount} Paid / {metrics.overdueInvoicesCount} Overdue
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Sales Trend Analytics</h3>
              <p className="text-xs text-slate-400">Monthly revenue projection</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">Sales by Category</h3>
          <p className="text-xs text-slate-400 mb-3">Revenue share across departments</p>
          <div className="h-56 w-full flex items-center justify-center">
            {categorySalesData.length === 0 ? (
              <div className="text-xs text-slate-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorySalesData} innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                    {categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {categorySalesData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Top Selling Products & Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">Top-Selling Products</h3>
          <p className="text-xs text-slate-400 mb-4">By total sales value</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Total Sales']} />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Payment Methods Breakdown</h3>
              <p className="text-xs text-slate-400">Cash, UPI, Card, NetBanking collections</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center"
            >
              View Payments <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="space-y-3">
            {paymentMethodData.map((pm) => (
              <div key={pm.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span>{pm.name}</span>
                  <span>{formatCurrency(pm.value)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (pm.value / (metrics.totalSales || 1)) * 100)}%`,
                      backgroundColor: pm.color,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Invoices & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Recent Invoices</h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center"
            >
              View All Invoices <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      {inv.customerName}
                    </td>
                    <td className="p-3 text-slate-500">{inv.invoiceDate}</td>
                    <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : inv.paymentStatus === 'Overdue'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onViewInvoice(inv.id)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Low Stock Warning</h3>
            </div>
            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold rounded-full">
              {lowStockProducts.length} Items
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-64">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">All products adequately stocked</div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400">SKU: {p.sku}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      {p.currentStock} {p.unit}
                    </span>
                    <div className="text-[9px] text-slate-400">Min: {p.minStockLevel}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="mt-3 w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Manage Inventory
          </button>
        </div>
      </div>
    </div>
  );
};
