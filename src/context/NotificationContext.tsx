import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  addNotification: (title: string, message: string, type: AppNotification['type']) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notifications = useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray(), []) || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = async (id: string) => {
    await db.notifications.update(id, { read: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await db.notifications.update(n.id, { read: true });
    }
  };

  const clearNotifications = async () => {
    await db.notifications.clear();
  };

  const addNotification = async (title: string, message: string, type: AppNotification['type']) => {
    const newNotif: AppNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await db.notifications.add(newNotif);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        removeToast,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addNotification,
      }}
    >
      {children}
      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-lg shadow-xl border text-sm font-medium transition-all transform translate-y-0 duration-200 max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-500'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 hover:opacity-80 font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
