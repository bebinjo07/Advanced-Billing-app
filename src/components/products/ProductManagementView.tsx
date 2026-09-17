import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  ArrowUpDown,
  History,
  X,
  CheckCircle,
  Scan,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Product, Category, Supplier } from '../../types';
import { formatCurrency } from '../../utils/numberToWords';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { syncProductToNeon } from '../../db/neonSync';

interface ProductManagementViewProps {
  onOpenCreate: () => void;
  onOpenScanner: () => void;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  onOpenCreate,
  onOpenScanner,
}) => {
  const { showToast } = useNotifications();
  const { currentUser } = useAuth();

  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [stockChangeQty, setStockChangeQty] = useState<number>(0);
  const [stockChangeType, setStockChangeType] = useState<'Stock In' | 'Stock Out'>('Stock In');
  const [stockNotes, setStockNotes] = useState('');

  // Add / Edit Product Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodHsn, setProdHsn] = useState('8471');
  const [prodCategory, setProdCategory] = useState('Laptops & Computers');
  const [prodPurchasePrice, setProdPurchasePrice] = useState(0);
  const [prodSellingPrice, setProdSellingPrice] = useState(0);
  const [prodGstRate, setProdGstRate] = useState(18);
  const [prodStock, setProdStock] = useState(10);
  const [prodMinStock, setProdMinStock] = useState(3);
  const [prodUnit, setProdUnit] = useState('pcs');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.hsnSac.includes(searchQuery);

      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const openNewModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku('PROD-' + Math.floor(1000 + Math.random() * 9000));
    setProdBarcode('89012345' + Math.floor(1000 + Math.random() * 9000));
    setProdHsn('8471');
    setProdCategory(categories[0]?.name || 'Laptops & Computers');
    setProdPurchasePrice(1000);
    setProdSellingPrice(1500);
    setProdGstRate(18);
    setProdStock(20);
    setProdMinStock(5);
    setProdUnit('pcs');
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdBarcode(p.barcode);
    setProdHsn(p.hsnSac);
    setProdCategory(p.category);
    setProdPurchasePrice(p.purchasePrice);
    setProdSellingPrice(p.sellingPrice);
    setProdGstRate(p.gstRate);
    setProdStock(p.currentStock);
    setProdMinStock(p.minStockLevel);
    setProdUnit(p.unit);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!prodName.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    const pData: Product = {
      id: editingProduct ? editingProduct.id : 'prod_' + Math.random().toString(36).substring(2, 9),
      name: prodName.trim(),
      sku: prodSku.trim(),
      barcode: prodBarcode.trim(),
      hsnSac: prodHsn.trim(),
      category: prodCategory,
      purchasePrice: prodPurchasePrice,
      sellingPrice: prodSellingPrice,
      gstRate: prodGstRate,
      currentStock: prodStock,
      minStockLevel: prodMinStock,
      unit: prodUnit,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    await db.products.put(pData);
    syncProductToNeon(pData).catch(console.error);
    showToast(`Product ${pData.name} saved successfully!`, 'success');
    setShowProductModal(false);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Delete product "${name}"?`)) {
      await db.products.delete(id);
      showToast(`Product ${name} deleted`, 'info');
    }
  };

  const handleApplyStockAdjustment = async () => {
    if (!stockAdjustProduct || stockChangeQty <= 0) return;

    const qtyChange = stockChangeType === 'Stock In' ? stockChangeQty : -stockChangeQty;
    const newStock = Math.max(0, stockAdjustProduct.currentStock + qtyChange);

    await db.products.update(stockAdjustProduct.id, { currentStock: newStock });

    await db.inventoryTransactions.add({
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      productId: stockAdjustProduct.id,
      productName: stockAdjustProduct.name,
      type: stockChangeType,
      quantityChange: qtyChange,
      previousStock: stockAdjustProduct.currentStock,
      newStock: newStock,
      notes: stockNotes || `Manual ${stockChangeType}`,
      date: new Date().toISOString(),
    });

    showToast(`Stock updated for ${stockAdjustProduct.name}`, 'success');
    setStockAdjustProduct(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Product & Inventory Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track product catalog, SKUs, barcode labels, stock levels & low stock alerts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <Scan className="w-4 h-4 text-emerald-500" />
            <span>Scan Barcode</span>
          </button>
          <button
            onClick={openNewModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, SKU, barcode, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-medium"
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">SKU / Barcode</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">HSN/SAC</th>
                <th className="p-3.5 text-right">Purchase</th>
                <th className="p-3.5 text-right">Selling Price</th>
                <th className="p-3.5 text-center">GST %</th>
                <th className="p-3.5 text-center">Current Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredProducts.map((p) => {
                const isLowStock = p.currentStock <= p.minStockLevel;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                      {p.name}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      <div>{p.sku}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {p.category}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{p.hsnSac || '-'}</td>
                    <td className="p-3.5 text-right text-slate-500">{formatCurrency(p.purchasePrice)}</td>
                    <td className="p-3.5 text-right font-extrabold text-slate-800 dark:text-slate-100">
                      {formatCurrency(p.sellingPrice)}
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-600">{p.gstRate}%</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          p.currentStock === 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => {
                          setStockAdjustProduct(p);
                          setStockChangeQty(10);
                          setStockNotes('Stock In shipment');
                        }}
                        title="Stock In / Out Adjustment"
                        className="p-1 rounded text-slate-400 hover:text-emerald-600"
                      >
                        <ArrowUpDown className="w-4 h-4 text-emerald-500" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit Product"
                        className="p-1 rounded text-slate-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        title="Delete Product"
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col my-auto text-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    HSN/SAC Code *
                  </label>
                  <input
                    type="text"
                    value={prodHsn}
                    onChange={(e) => setProdHsn(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    value={prodPurchasePrice}
                    onChange={(e) => setProdPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    GST Rate % *
                  </label>
                  <select
                    value={prodGstRate}
                    onChange={(e) => setProdGstRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-center"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-center"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col my-auto text-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                Stock Adjustment — {stockAdjustProduct.name}
              </h3>
              <button onClick={() => setStockAdjustProduct(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg flex justify-between">
                <span>Current Stock:</span>
                <span className="font-bold text-emerald-600">
                  {stockAdjustProduct.currentStock} {stockAdjustProduct.unit}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Adjustment Type
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setStockChangeType('Stock In')}
                    className={`flex-1 py-2 rounded-lg font-bold ${
                      stockChangeType === 'Stock In'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    + Stock In (Add)
                  </button>
                  <button
                    onClick={() => setStockChangeType('Stock Out')}
                    className={`flex-1 py-2 rounded-lg font-bold ${
                      stockChangeType === 'Stock Out'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    - Stock Out (Remove)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockChangeQty}
                  onChange={(e) => setStockChangeQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="e.g. Supplier Shipment #9921"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStockAdjustProduct(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyStockAdjustment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
