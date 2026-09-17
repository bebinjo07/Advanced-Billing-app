import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, BusinessProfile } from '../types';
import { db } from '../db/database';
import { seedInitialDataIfNeeded } from '../db/seedData';

interface AuthContextType {
  currentUser: User | null;
  businessProfile: BusinessProfile | null;
  allUsers: User[];
  login: (email: string) => Promise<boolean>;
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
        if (users.length > 0) {
          // Default login as Admin
          const admin = users.find((u) => u.role === 'admin') || users[0];
          setCurrentUser(admin);
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

  const login = async (email: string): Promise<boolean> => {
    const user = await db.users.where('email').equalsIgnoreCase(email).first();
    if (user && user.active) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = async (userId: string) => {
    const user = await db.users.get(userId);
    if (user) setCurrentUser(user);
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
          <p className="text-lg font-medium text-slate-300">Loading BillPro GST Application...</p>
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
        login,
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
