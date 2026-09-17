import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, BusinessProfile, SignUpData } from '../types';
import { db } from '../db/database';
import { sql, initNeonTables } from '../db/neonClient';

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
        // Initialize Neon PostgreSQL Cloud Tables
        await initNeonTables();

        // 1. Fetch Users from Neon PostgreSQL (with fallback to local db)
        try {
          const neonUsers = (await sql`SELECT * FROM users ORDER BY created_at ASC`) as any[];
          if (neonUsers && neonUsers.length > 0) {
            const formattedUsers: User[] = neonUsers.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              password: u.password,
              role: u.role,
              phone: u.phone,
              active: u.active,
              createdAt: u.created_at,
            }));
            setAllUsers(formattedUsers);
            await db.users.bulkPut(formattedUsers);
          } else {
            const localUsers = await db.users.toArray();
            setAllUsers(localUsers);
          }
        } catch (e) {
          const localUsers = await db.users.toArray();
          setAllUsers(localUsers);
        }

        // 2. Fetch Business Profile from Neon PostgreSQL
        try {
          const neonBiz = (await sql`SELECT * FROM business_profiles LIMIT 1`) as any[];
          if (neonBiz && neonBiz.length > 0) {
            const b = neonBiz[0];
            const profile: BusinessProfile = {
              id: b.id,
              name: b.name,
              tagline: b.tagline,
              logo: b.logo,
              address: b.address,
              city: b.city,
              state: b.state,
              pincode: b.pincode,
              phone: b.phone,
              email: b.email,
              website: b.website,
              gstin: b.gstin,
              pan: b.pan,
              currency: b.currency || 'INR',
              currencySymbol: b.currency_symbol || '₹',
              invoicePrefix: b.invoice_prefix || 'INV-2026-',
              bankDetails: b.bank_details || {
                bankName: 'HDFC Bank',
                accountNumber: '',
                ifscCode: '',
                branch: '',
                upiId: '',
              },
              termsAndConditions: b.terms_and_conditions || '',
              taxRegistrationType: b.tax_registration_type || 'Regular',
            };
            setBusinessProfile(profile);
            await db.businessProfile.put(profile);
          } else {
            const localBiz = await db.businessProfile.toCollection().first();
            if (localBiz) setBusinessProfile(localBiz);
          }
        } catch (e) {
          const localBiz = await db.businessProfile.toCollection().first();
          if (localBiz) setBusinessProfile(localBiz);
        }

        // Restore Session
        const savedUserId = localStorage.getItem('activeUserId');
        if (savedUserId) {
          const usersList = await db.users.toArray();
          const user = usersList.find((u) => u.id === savedUserId);
          if (user) setCurrentUser(user);
        }
      } catch (err) {
        console.error('Failed to initialize AuthContext:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    let user = await db.users.where('email').equalsIgnoreCase(email.trim()).first();

    if (!user) {
      // Query Neon DB
      try {
        const neonUser = (await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email.trim()}) LIMIT 1`) as any[];
        if (neonUser && neonUser.length > 0) {
          const u = neonUser[0];
          user = {
            id: u.id,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            phone: u.phone,
            active: u.active,
            createdAt: u.created_at,
          };
          await db.users.put(user);
        }
      } catch (e) {
        console.error('Neon DB Login query error:', e);
      }
    }

    if (user && user.active) {
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
    // Check if email exists in local db or Neon
    const existing = await db.users.where('email').equalsIgnoreCase(data.email.trim()).first();
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const userRole: UserRole = data.accountType === 'customer' ? 'customer' : 'admin';

    const newUser: User = {
      id: userId,
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      role: userRole,
      phone: data.phone,
      active: true,
      createdAt: new Date().toISOString(),
    };

    // Save User to Local DB
    await db.users.add(newUser);

    // If Customer Account, ensure Customer record exists in DB
    if (data.accountType === 'customer') {
      const existingCust = await db.customers.where('email').equalsIgnoreCase(data.email.trim()).first();
      if (!existingCust) {
        await db.customers.add({
          id: 'cust_' + Math.random().toString(36).substring(2, 9),
          name: data.name.trim(),
          customerCode: 'CUST-' + Math.floor(100 + Math.random() * 900),
          phone: data.phone || '',
          email: data.email.trim(),
          gstin: '',
          billingAddress: 'Karnataka, India',
          shippingAddress: 'Karnataka, India',
          city: '',
          state: 'Karnataka',
          pincode: '',
          totalPurchases: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Sync User to Neon PostgreSQL
    try {
      await sql`
        INSERT INTO users (id, name, email, password, role, phone, active)
        VALUES (${newUser.id}, ${newUser.name}, ${newUser.email}, ${newUser.password}, ${newUser.role}, ${newUser.phone}, TRUE)
        ON CONFLICT (email) DO NOTHING;
      `;
    } catch (e) {
      console.error('Neon DB User Insert Sync Error:', e);
    }

    // Business Profile setup
    const bizId = 'biz_main';
    const bizState = data.businessState || 'Karnataka';
    const bizName = data.businessName ? data.businessName.trim() : 'My Business Store';

    const biz: BusinessProfile = {
      id: bizId,
      name: bizName,
      tagline: 'Quality Products & Professional Services',
      address: `${bizState}, India`,
      city: '',
      state: bizState,
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
        branch: bizState,
        upiId: `${data.email.split('@')[0]}@upi`,
      },
      termsAndConditions:
        '1. Goods once sold are subject to standard warranty.\n2. Payment due within 15 days of invoice date.\n3. Subject to local state jurisdiction.',
      taxRegistrationType: data.gstin ? 'Regular' : 'Unregistered',
    };

    await db.businessProfile.put(biz);

    // Sync Business Profile to Neon PostgreSQL
    try {
      await sql`
        INSERT INTO business_profiles (id, name, tagline, address, city, state, phone, email, gstin, currency, currency_symbol, invoice_prefix, bank_details, terms_and_conditions, tax_registration_type)
        VALUES (${biz.id}, ${biz.name}, ${biz.tagline}, ${biz.address}, ${biz.city}, ${biz.state}, ${biz.phone}, ${biz.email}, ${biz.gstin}, ${biz.currency}, ${biz.currencySymbol}, ${biz.invoicePrefix}, ${JSON.stringify(biz.bankDetails)}, ${biz.termsAndConditions}, ${biz.taxRegistrationType})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, state = EXCLUDED.state, gstin = EXCLUDED.gstin;
      `;
    } catch (e) {
      console.error('Neon DB Business Insert Sync Error:', e);
    }

    setBusinessProfile(biz);
    setCurrentUser(newUser);
    localStorage.setItem('activeUserId', userId);

    const usersList = await db.users.toArray();
    setAllUsers(usersList);
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

    try {
      await sql`
        UPDATE business_profiles
        SET name = ${updated.name}, tagline = ${updated.tagline}, address = ${updated.address}, city = ${updated.city}, state = ${updated.state}, pincode = ${updated.pincode}, phone = ${updated.phone}, email = ${updated.email}, gstin = ${updated.gstin}, invoice_prefix = ${updated.invoicePrefix}, bank_details = ${JSON.stringify(updated.bankDetails)}, terms_and_conditions = ${updated.termsAndConditions}
        WHERE id = ${updated.id};
      `;
    } catch (e) {
      console.error('Neon DB Business Profile Update Sync Error:', e);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
    };
    await db.users.add(newUser);

    try {
      await sql`
        INSERT INTO users (id, name, email, password, role, phone, active)
        VALUES (${newUser.id}, ${newUser.name}, ${newUser.email}, ${newUser.password || ''}, ${newUser.role}, ${newUser.phone || ''}, TRUE);
      `;
    } catch (e) {
      console.error('Neon DB Add User Error:', e);
    }

    const usersList = await db.users.toArray();
    setAllUsers(usersList);
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    await db.users.update(id, data);
    const usersList = await db.users.toArray();
    setAllUsers(usersList);
    if (currentUser && currentUser.id === id) {
      setCurrentUser({ ...currentUser, ...data });
    }
  };

  const deleteUser = async (id: string) => {
    await db.users.delete(id);
    try {
      await sql`DELETE FROM users WHERE id = ${id};`;
    } catch (e) {
      console.error('Neon DB Delete User Error:', e);
    }
    const usersList = await db.users.toArray();
    setAllUsers(usersList);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white font-sans">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-lg font-medium text-slate-300">Connecting to Neon Cloud Database...</p>
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
