import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, BusinessProfile, SignUpData } from '../types';
import { db } from '../db/database';
import { seedInitialDataIfNeeded } from '../db/seedData';

interface AuthContextType {
  currentUser: User | null;
  businessProfile: BusinessProfile | null;
  allUsers: User[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (signUpData: SignUpData) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  refreshBusinessProfile: () => Promise<void>;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await seedInitialDataIfNeeded();
        const users = await db.users.toArray();
        setAllUsers(users);

        const savedUserId = localStorage.getItem('activeUserId');
        if (savedUserId) {
          const user = users.find((u) => u.id === savedUserId);
          if (user) {
            setCurrentUser(user);
          }
        }

        const biz = await db.businessProfile.toCollection().first();
        if (biz) setBusinessProfile(biz);
      } catch (err) {
        console.error('Failed to initialize AuthContext:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    const user = await db.users.where('email').equalsIgnoreCase(email.trim()).first();
    if (user && user.active) {
      // If password stored, verify matching
      if (user.password && password && user.password !== password) {
        return false;
      }
      setCurrentUser(user);
      localStorage.setItem('activeUserId', user.id);

      const biz = await db.businessProfile.toCollection().first();
      if (biz) setBusinessProfile(biz);
      return true;
    }
    return false;
  };

  const signup = async (data: SignUpData): Promise<void> => {
    const existing = await db.users.where('email').equalsIgnoreCase(data.email.trim()).first();
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const newUser: User = {
      id: userId,
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      role: 'admin',
      phone: data.phone,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await db.users.add(newUser);

    // Create business profile for new account
    const bizCount = await db.businessProfile.count();
    let biz: BusinessProfile;
    if (bizCount === 0) {
      biz = {
        id: 'biz_main',
        name: data.businessName.trim(),
        tagline: 'Quality Products & Professional Services',
        address: `${data.businessState}, India`,
        city: '',
        state: data.businessState,
        pincode: '',
        phone: data.phone || '',
        email: data.email.trim(),
        gstin: data.gstin?.trim().toUpperCase() || '',
        currency: 'INR',
        currencySymbol: '₹',
        invoicePrefix: 'INV-2026-',
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '50200011223344',
          ifscCode: 'HDFC0001234',
          branch: data.businessState,
          upiId: `${data.email.split('@')[0]}@upi`,
        },
        termsAndConditions:
          '1. Goods once sold are subject to standard warranty.\n2. Payment due within 15 days of invoice date.\n3. Subject to local state jurisdiction.',
        taxRegistrationType: data.gstin ? 'Regular' : 'Unregistered',
      };
      await db.businessProfile.add(biz);
    } else {
      const existingBiz = await db.businessProfile.toCollection().first();
      biz = existingBiz || {
        id: 'biz_main',
        name: data.businessName,
        address: data.businessState,
        city: '',
        state: data.businessState,
        pincode: '',
        phone: data.phone,
        email: data.email,
        gstin: data.gstin || '',
        currency: 'INR',
        currencySymbol: '₹',
        invoicePrefix: 'INV-2026-',
        bankDetails: {
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branch: '',
          upiId: '',
        },
        termsAndConditions: '',
        taxRegistrationType: 'Regular',
      };
    }

    setBusinessProfile(biz);
    setCurrentUser(newUser);
    localStorage.setItem('activeUserId', userId);

    const users = await db.users.toArray();
    setAllUsers(users);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('activeUserId');
  };

  const switchUser = async (userId: string) => {
    const user = await db.users.get(userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('activeUserId', userId);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'manager') {
      return requiredRole === 'manager' || requiredRole === 'staff';
    }
    return requiredRole === 'staff';
  };

  const refreshBusinessProfile = async () => {
    const biz = await db.businessProfile.toCollection().first();
    if (biz) setBusinessProfile(biz);
  };

  const updateBusinessProfile = async (data: Partial<BusinessProfile>) => {
    if (!businessProfile) return;
    const updated = { ...businessProfile, ...data };
    await db.businessProfile.put(updated);
    setBusinessProfile(updated);
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    await db.users.add(newUser);
    const users = await db.users.toArray();
    setAllUsers(users);
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    await db.users.update(id, data);
    const users = await db.users.toArray();
    setAllUsers(users);
    if (currentUser && currentUser.id === id) {
      setCurrentUser({ ...currentUser, ...data });
    }
  };

  const deleteUser = async (id: string) => {
    await db.users.delete(id);
    const users = await db.users.toArray();
    setAllUsers(users);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white font-sans">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-lg font-medium text-slate-300">Initializing BillPro Application...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        businessProfile,
        allUsers,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        switchUser,
        hasPermission,
        refreshBusinessProfile,
        updateBusinessProfile,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
