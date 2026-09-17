import React, { useState } from 'react';
import { Camera, X, Scan, CheckCircle } from 'lucide-react';
import { Product } from '../../types';
import { db } from '../../db/database';
import { useNotifications } from '../../context/NotificationContext';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanProduct: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanProduct,
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const { showToast } = useNotifications();

  if (!isOpen) return null;

  const handleSimulateScan = async (codeToSearch: string) => {
    const code = codeToSearch.trim();
    if (!code) return;

    const product = await db.products
      .filter((p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase())
      .first();

    if (product) {
      setScannedProduct(product);
      showToast(`Scanned product: ${product.name}`, 'success');
      onScanProduct(product);
    } else {
      setScannedProduct(null);
      showToast(`No product found with Barcode/SKU: ${code}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Barcode / QR Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Simulation View */}
        <div className="p-6 text-center space-y-4">
          <div className="relative w-full h-48 bg-slate-900 rounded-lg overflow-hidden flex flex-col items-center justify-center text-white border-2 border-dashed border-emerald-500/50">
            <Camera className="w-12 h-12 text-emerald-400 animate-pulse mb-2" />
            <span className="text-xs text-slate-400">Position barcode / QR code inside frame</span>
            <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-500 animate-ping"></div>
          </div>

          {/* Quick Scanner Input / Hardware Scanner Receiver */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Scan Input / Enter Barcode or SKU
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSimulateScan(scannedCode);
                }}
                placeholder="e.g. 890123456701 or DELL-XPS15-01"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleSimulateScan(scannedCode)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition"
              >
                Scan
              </button>
            </div>
          </div>

          {/* Sample Barcodes for Quick Testing */}
          <div className="pt-2 text-left">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Quick Test Codes:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['890123456701', '890123456702', '890123456703', 'LOGI-MX3S-BLK'].map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setScannedCode(code);
                    handleSimulateScan(code);
                  }}
                  className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-700 dark:text-slate-300 rounded font-mono transition"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Scanned Result */}
          {scannedProduct && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-left">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                    {scannedProduct.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Price: ₹{scannedProduct.sellingPrice} | Stock: {scannedProduct.currentStock}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
