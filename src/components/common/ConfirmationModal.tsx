import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <AlertTriangle
              className={`w-5 h-5 ${
                type === 'danger'
                  ? 'text-rose-500'
                  : type === 'warning'
                  ? 'text-amber-500'
                  : 'text-blue-500'
              }`}
            />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 text-sm text-slate-600 dark:text-slate-300">{message}</div>
        <div className="flex items-center justify-end space-x-3 px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
              type === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
