import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_ORDERS, INITIAL_BANNERS, INITIAL_WALLET_TRANSACTIONS, INITIAL_REGISTERED_CUSTOMERS } from '../data/initialData';
import { translations } from '../data/translations';

const StoreContext = createContext(null);

const STORAGE_KEYS = {
  PRODUCTS: 'v8_mart_products_v1',
  ORDERS: 'v8_mart_orders_v1',
  CART: 'v8_mart_cart_v1',
  WISHLIST: 'v8_mart_wishlist_v1',
  BANNERS: 'v8_mart_banners_v1',
  EXPENSES: 'v8_mart_expenses_v1',
  LANG: 'v8_mart_lang_v1',
  CURRENCY: 'v8_mart_currency_v1',
  EXCHANGE_RATE: 'v8_mart_exchange_rate_v1',
  THEME: 'v8_mart_theme_v1',
  CUSTOMER_PROFILE: 'v8_mart_customer_profile_v1',
  REGISTERED_CUSTOMERS: 'v8_mart_registered_customers_v1',
  WALLET_TRANSACTIONS: 'v8_mart_wallet_transactions_v1',
  ADMIN_AUTH: 'v8_admin_auth',
  FONT_SIZE: 'v8_mart_font_size_v1',
  NOTIFICATIONS: 'v8_mart_notifications_v1',
  MEMBERS: 'v8_mart_members_v1',
  ACTIVE_MEMBER: 'v8_mart_active_member_v1'
};

const INITIAL_EXPENSES = [
  { id: 'EXP-101', title_km: 'ថង់វិចខ្ចប់ & ប្រអប់ដឹកទំនិញ', title_en: 'Packaging bags & boxes', amount: 3.20, category: 'packaging', date: '2026-08-10' },
  { id: 'EXP-102', title_km: 'ឧបត្ថម្ភសាំងដឹកជញ្ជូន (Delivery)', title_en: 'Delivery Fuel Subsidy', amount: 4.25, category: 'transport', date: '2026-08-10' }
];

const DEFAULT_EXCHANGE_RATE = 4000; // 1 USD = 4,000 KHR (Default standard as requested)

/**
 * Safely resolves relative or absolute static asset paths against Vite's configured base URL.
 * Handles './image prodacts/...', '/image prodacts/...', external URLs, and data URLs.
 */
export const resolveAssetUrl = (url) => {
  if (!url || typeof url !== 'string') return url || '';
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }
  const cleanPath = url.replace(/^\.?\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${cleanPath}`;
};

const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.includes('/admin') || hash.startsWith('#/admin') || hash === '#admin' || search.includes('admin');
};

export const StoreProvider = ({ children }) => {
  // 1. URL Path & Routing State
  const [currentPath, setCurrentPath] = useState(() => {
    return typeof window !== 'undefined' 
      ? (window.location.pathname + window.location.hash) 
      : '/';
  });

  const [isAdmin, setIsAdmin] = useState(checkIsAdminRoute);

  // 2. Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    const sessionAuth = sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    const localAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    return sessionAuth === 'true' || localAuth === 'true';
  });

  const [activeMember, setActiveMember] = useState(() => {
    if (typeof window === 'undefined') return null;
    const sessionMember = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_MEMBER);
    const localMember = localStorage.getItem(STORAGE_KEYS.ACTIVE_MEMBER);
    const memberStr = sessionMember || localMember;
    try {
      return memberStr ? JSON.parse(memberStr) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  const viewMode = checkIsAdminRoute() ? 'admin' : 'store';

  // 2. Theme State (Dark / Light)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved) return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 2.1 Font Size State ('small' | 'normal' | 'large' | 'xlarge')
  const [fontSize, setFontSizeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      if (saved && ['small', 'normal', 'large', 'xlarge'].includes(saved)) {
        return saved;
      }
    }
    return 'normal';
  });

  const applyFontSize = (size) => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-font-size', size || 'normal');
    // Ensure root fontSize is reset so header layout rem dimensions remain 100% stable
    document.documentElement.style.fontSize = '';
  };

  const setFontSize = (size) => {
    setFontSizeState(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
      applyFontSize(size);
    }
  };

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  // 3. Customer Profile & Registered CRM Customers State
  const [registeredCustomers, setRegisteredCustomers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_CUSTOMERS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error('Failed to parse registered customers', e);
        }
      }
    }
    return INITIAL_REGISTERED_CUSTOMERS || [];
  });

  // 3.1 Members / Staff Access Control State
  const [members, setMembers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(m => {
              if (m.roles && !m.permissions) {
                return {
                  id: m.id,
                  name: m.name,
                  phone: m.phone,
                  pin: m.pin,
                  permissions: {
                    overview: !!m.roles.supervisor,
                    inventory: !!(m.roles.staff || m.roles.supervisor),
                    orders: !!(m.roles.staff || m.roles.supervisor),
                    deliveries: !!(m.roles.delivery || m.roles.supervisor),
                    banners: !!m.roles.supervisor,
                    notifications: !!(m.roles.staff || m.roles.supervisor),
                    customers: !!m.roles.supervisor,
                    members: false
                  }
                };
              }
              return m;
            });
          }
        } catch (e) {
          console.error('Failed to parse members', e);
        }
      }
    }
    // Default demo members
    return [
      { 
        id: 'MEM-1', 
        name: 'Sopheap Staff', 
        phone: '012345678', 
        pin: '1111', 
        permissions: { overview: true, inventory: true, orders: true, deliveries: false, banners: false, notifications: true, customers: false, members: false } 
      },
      { 
        id: 'MEM-2', 
        name: 'Dara Delivery', 
        phone: '098765432', 
        pin: '2222', 
        permissions: { overview: false, inventory: false, orders: false, deliveries: true, banners: false, notifications: false, customers: false, members: false } 
      },
      { 
        id: 'MEM-3', 
        name: 'Sokha Supervisor', 
        phone: '077112233', 
        pin: '3333', 
        permissions: { overview: true, inventory: true, orders: true, deliveries: true, banners: true, notifications: true, customers: true, members: false } 
      }
    ];
  });

  const [customerProfile, setCustomerProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PROFILE);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            return {
              ...parsed,
              balance: parsed.isRegistered ? (parseFloat(parsed.balance) || 0) : 0.0
            };
          }
        } catch (e) {
          console.error('Failed to parse customer profile', e);
        }
      }
    }
    return {
      isRegistered: false,
      fullName: '',
      phone: '',
      avatar: '',
      address: '',
      googleMapsUrl: '',
      latitude: null,
      longitude: null,
      registeredAt: null,
      balance: 0.0
    };
  });

  const updateCustomerProfile = (newProfile) => {
    const cleanPhone = (newProfile.phone || '').trim();
    const cleanName = (newProfile.fullName || '').trim();

    // Check if this user exists in registered CRM database to restore their wallet balance!
    let existingCustomer = registeredCustomers.find(c => 
      (c.phone && cleanPhone && c.phone === cleanPhone) || 
      (c.fullName && cleanName && c.fullName === cleanName)
    );

    const savedBalance = existingCustomer && existingCustomer.wallet_balance !== undefined
      ? parseFloat(existingCustomer.wallet_balance)
      : (newProfile.balance !== undefined ? parseFloat(newProfile.balance) : (customerProfile.isRegistered && customerProfile.balance > 0 ? parseFloat(customerProfile.balance) : 15.0));

    const updated = {
      ...customerProfile,
      ...newProfile,
      isRegistered: true,
      balance: savedBalance,
      registeredAt: customerProfile.registeredAt || (existingCustomer ? existingCustomer.registeredAt : new Date().toISOString())
    };
    setCustomerProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updated));
    }

    // Auto-register / update into Central Database for Admin Customer Directory!
    if (cleanPhone || cleanName) {
      const customerRecord = {
        id: existingCustomer ? existingCustomer.id : `CUST-${cleanPhone ? cleanPhone.replace(/[^0-9]/g, '') : Date.now()}`,
        fullName: cleanName || (existingCustomer ? existingCustomer.fullName : 'អតិថិជនបានចុះឈ្មោះ'),
        phone: cleanPhone || (existingCustomer ? existingCustomer.phone : 'N/A'),
        avatar: newProfile.avatar || (existingCustomer ? existingCustomer.avatar : ''),
        address: (newProfile.address || (existingCustomer ? existingCustomer.address : '')).trim(),
        city: newProfile.city || (existingCustomer ? existingCustomer.city : 'Phnom Penh'),
        googleMapsUrl: newProfile.googleMapsUrl || (existingCustomer ? existingCustomer.googleMapsUrl : ''),
        latitude: newProfile.latitude || (existingCustomer ? existingCustomer.latitude : null),
        longitude: newProfile.longitude || (existingCustomer ? existingCustomer.longitude : null),
        wallet_balance: savedBalance,
        registeredAt: updated.registeredAt,
        lastUpdated: new Date().toISOString()
      };

      setRegisteredCustomers(prev => {
        const existingIdx = prev.findIndex(c => 
          (c.phone && cleanPhone && c.phone === cleanPhone) || 
          (c.fullName && cleanName && c.fullName === cleanName)
        );
        let updatedList;
        if (existingIdx >= 0) {
          updatedList = [...prev];
          updatedList[existingIdx] = { ...updatedList[existingIdx], ...customerRecord };
        } else {
          updatedList = [customerRecord, ...prev];
        }
        safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
        syncPushToServer({ registered_customers: updatedList });
        return updatedList;
      });
    }
  };

  const logoutCustomer = () => {
    // 1. Save current balance to registered customer list before clearing local session
    if (customerProfile.phone && customerProfile.isRegistered) {
      setRegisteredCustomers(prev => {
        const idx = prev.findIndex(c => c.phone === customerProfile.phone);
        if (idx >= 0) {
          const list = [...prev];
          list[idx] = { ...list[idx], wallet_balance: parseFloat(customerProfile.balance) || 0 };
          safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(list));
          syncPushToServer({ registered_customers: list });
          return list;
        }
        return prev;
      });
    }

    // 2. Reset guest profile with $0.00 wallet balance
    const emptyProfile = {
      isRegistered: false,
      fullName: '',
      phone: '',
      password: '',
      avatar: '',
      address: '',
      googleMapsUrl: '',
      latitude: null,
      longitude: null,
      registeredAt: null,
      balance: 0.0
    };
    setCustomerProfile(emptyProfile);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMER_PROFILE);
    }
  };

  // Customer Login with Phone and Password
  const loginCustomer = (phone, password) => {
    const cleanPhone = (phone || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanPhone) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter your phone number!', 'error');
      return { success: false, message: 'Phone required' };
    }
    if (!cleanPass) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខសម្ងាត់ Password!' : 'Please enter your password!', 'error');
      return { success: false, message: 'Password required' };
    }

    const found = registeredCustomers.find(c => (c.phone && c.phone.trim() === cleanPhone));
    if (!found) {
      showToast(
        lang === 'km'
          ? `❌ មិនទាន់មានគណនីសម្រាប់លេខ ${cleanPhone} ទេ! សូមចុះឈ្មោះថ្មី`
          : `❌ No account found for ${cleanPhone}! Please register.`,
        'error'
      );
      return { success: false, message: 'Account not found' };
    }

    // Check password (allow default '1234' if account didn't set password previously)
    const expectedPass = found.password || '1234';
    if (cleanPass !== expectedPass) {
      showToast(
        lang === 'km'
          ? '❌ លេខសម្ងាត់ Password មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត'
          : '❌ Incorrect Password! Please try again.',
        'error'
      );
      return { success: false, message: 'Incorrect password' };
    }

    const restored = {
      isRegistered: true,
      fullName: found.fullName || found.name || 'អតិថិជនបានចុះឈ្មោះ',
      phone: found.phone || cleanPhone,
      password: expectedPass,
      avatar: found.avatar || '',
      address: found.address || '',
      city: found.city || 'Phnom Penh',
      googleMapsUrl: found.googleMapsUrl || '',
      latitude: found.latitude || null,
      longitude: found.longitude || null,
      registeredAt: found.registeredAt || new Date().toISOString(),
      balance: found.wallet_balance !== undefined ? parseFloat(found.wallet_balance) : 15.0
    };

    setCustomerProfile(restored);
    safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(restored));

    showToast(
      lang === 'km'
        ? `🎉 ស្វាគមន៍ការចូលវិញ ${restored.fullName}! សមតុល្យ Wallet៖ $${restored.balance.toFixed(2)}`
        : `🎉 Welcome back ${restored.fullName}! Wallet Balance: $${restored.balance.toFixed(2)}`,
      'success'
    );
    return { success: true, profile: restored };
  };

  // Customer Register with Password
  const registerCustomer = (profileData) => {
    const cleanPhone = (profileData.phone || '').trim();
    const cleanName = (profileData.fullName || '').trim();
    const cleanPass = (profileData.password || '').trim();

    if (!cleanPhone) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!', 'error');
      return { success: false };
    }
    if (!cleanName) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលឈ្មោះអតិថិជន!' : 'Please enter full name!', 'error');
      return { success: false };
    }
    if (!cleanPass || cleanPass.length < 4) {
      showToast(lang === 'km' ? 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 4 ខ្ទង់!' : 'Password must be at least 4 characters!', 'error');
      return { success: false };
    }

    const existing = registeredCustomers.find(c => c.phone && c.phone.trim() === cleanPhone);
    if (existing) {
      showToast(
        lang === 'km'
          ? `⚠️ លេខទូរស័ព្ទ ${cleanPhone} ធ្លាប់បានចុះឈ្មោះរួចហើយ! សូមចូលគណនី (Login)`
          : `⚠️ Phone number ${cleanPhone} already registered! Please Login.`,
        'warning'
      );
      return { success: false, alreadyRegistered: true };
    }

    const newCustomer = {
      isRegistered: true,
      id: `CUST-${cleanPhone.replace(/[^0-9]/g, '')}`,
      fullName: cleanName,
      phone: cleanPhone,
      password: cleanPass,
      avatar: profileData.avatar || '',
      address: (profileData.address || '').trim(),
      city: profileData.city || 'Phnom Penh',
      googleMapsUrl: profileData.googleMapsUrl || '',
      latitude: profileData.latitude || null,
      longitude: profileData.longitude || null,
      registeredAt: new Date().toISOString(),
      wallet_balance: 0.0,
      balance: 0.0
    };

    setCustomerProfile(newCustomer);
    safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(newCustomer));

    setRegisteredCustomers(prev => {
      const updated = [newCustomer, ...prev];
      safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updated));
      syncPushToServer({ registered_customers: updated });
      return updated;
    });

    // Send Welcome SMS
    if (smsSettings.enabled) {
      const welcomeMsg = lang === 'km'
        ? `សួស្តី ${cleanName}! គណនី V8 Mini Mart របស់លោកអ្នកត្រូវបានបង្កើតជោគជ័យជាមួយលេខទូរស័ព្ទ ${cleanPhone}។`
        : `Hello ${cleanName}! Your V8 Mini Mart account has been successfully created with phone number ${cleanPhone}.`;
      sendSmsNotification(cleanPhone, welcomeMsg);
    }

    showToast(
      lang === 'km'
        ? `✅ បានបង្កើតគណនី និងលេខសម្ងាត់ការពារជោគជ័យ!`
        : `✅ Account created & password protected successfully!`,
      'success'
    );
    return { success: true, profile: newCustomer };
  };

  // Change Customer Password
  const changeCustomerPassword = (currentPass, newPass) => {
    if (!customerProfile.isRegistered || !customerProfile.phone) {
      showToast(lang === 'km' ? 'សូមចូលគណនីជាមុនសិន!' : 'Please login first!', 'error');
      return { success: false };
    }

    const currentExpected = customerProfile.password || '1234';
    if ((currentPass || '').trim() !== currentExpected) {
      showToast(lang === 'km' ? '❌ លេខសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ!' : '❌ Current password incorrect!', 'error');
      return { success: false };
    }

    if (!newPass || newPass.trim().length < 4) {
      showToast(lang === 'km' ? 'លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 4 ខ្ទង់!' : 'New password must be at least 4 characters!', 'error');
      return { success: false };
    }

    const updatedProfile = {
      ...customerProfile,
      password: newPass.trim()
    };
    setCustomerProfile(updatedProfile);
    safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updatedProfile));

    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => c.phone === customerProfile.phone);
      if (idx >= 0) {
        const list = [...prev];
        list[idx] = { ...list[idx], password: newPass.trim() };
        safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(list));
        syncPushToServer({ registered_customers: list });
        return list;
      }
      return prev;
    });

    showToast(
      lang === 'km'
        ? '🔒 បានប្តូរលេខសម្ងាត់ការពារគណនីជោគជ័យ!'
        : '🔒 Password updated successfully!',
      'success'
    );
    return { success: true };
  };

  // Customer Forgot Password Verification & Reset with Phone
  const resetCustomerPasswordWithPhone = (phone, newPassword) => {
    const cleanPhone = (phone || '').trim();
    const cleanPass = (newPassword || '').trim();

    if (!cleanPhone) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ!' : 'Please enter phone number!', 'error');
      return { success: false, message: 'Phone required' };
    }
    if (!cleanPass || cleanPass.length < 4) {
      showToast(lang === 'km' ? 'លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 4 ខ្ទង់!' : 'Password must be at least 4 characters!', 'error');
      return { success: false, message: 'Password too short' };
    }

    const foundIdx = registeredCustomers.findIndex(c => c.phone && c.phone.trim().replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, ''));
    if (foundIdx < 0) {
      showToast(
        lang === 'km'
          ? `❌ រកមិនឃើញគណនីសម្រាប់លេខ ${cleanPhone} ទេ! សូមពិនិត្យមើលលេខទូរស័ព្ទឡើងវិញ`
          : `❌ No registered account found for ${cleanPhone}!`,
        'error'
      );
      return { success: false, message: 'Account not found' };
    }

    const existing = registeredCustomers[foundIdx];
    const updatedCustomer = {
      ...existing,
      password: cleanPass,
      lastUpdated: new Date().toISOString()
    };

    const updatedList = [...registeredCustomers];
    updatedList[foundIdx] = updatedCustomer;
    setRegisteredCustomers(updatedList);
    safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
    syncPushToServer({ registered_customers: updatedList });

    // Auto-login restored customer profile with the new password
    const restored = {
      isRegistered: true,
      fullName: existing.fullName || existing.name || 'អតិថិជនបានចុះឈ្មោះ',
      phone: cleanPhone,
      password: cleanPass,
      avatar: existing.avatar || '',
      address: existing.address || '',
      city: existing.city || 'Phnom Penh',
      googleMapsUrl: existing.googleMapsUrl || '',
      latitude: existing.latitude || null,
      longitude: existing.longitude || null,
      registeredAt: existing.registeredAt || new Date().toISOString(),
      balance: existing.wallet_balance !== undefined ? parseFloat(existing.wallet_balance) : 15.0
    };

    setCustomerProfile(restored);
    safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(restored));

    showToast(
      lang === 'km'
        ? `✅ បានផ្ទៀងផ្ទាត់ និងផ្លាស់ប្តូរលេខសម្ងាត់ថ្មីសម្រាប់ ${restored.fullName} ជោគជ័យ!`
        : `✅ Password reset & verified successfully for ${restored.fullName}!`,
      'success'
    );
    return { success: true, profile: restored };
  };

  // Admin Reset Customer Password Action
  const adminResetCustomerPassword = (customerIdentifier, newPassword = '1234') => {
    const cleanPass = (newPassword || '1234').trim();
    let targetName = customerIdentifier;
    let isSuccess = false;

    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => 
        (c.id && c.id === customerIdentifier) || 
        (c.phone && c.phone.trim().replace(/\s+/g, '') === customerIdentifier.trim().replace(/\s+/g, '')) || 
        (c.fullName && c.fullName === customerIdentifier)
      );

      if (idx >= 0) {
        targetName = prev[idx].fullName || prev[idx].phone;
        isSuccess = true;
        const updatedList = [...prev];
        updatedList[idx] = {
          ...updatedList[idx],
          password: cleanPass,
          last_password_reset: {
            resetBy: 'Admin',
            date: new Date().toISOString()
          },
          lastUpdated: new Date().toISOString()
        };
        safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
        syncPushToServer({ registered_customers: updatedList });
        return updatedList;
      }
      return prev;
    });

    if (!isSuccess) {
      showToast(lang === 'km' ? 'រកមិនឃើញគណនីអតិថិជន!' : 'Customer not found!', 'error');
      return { success: false };
    }

    // If customer is currently active in session, update their profile password as well
    if (
      customerProfile.phone === customerIdentifier || 
      customerProfile.fullName === customerIdentifier ||
      customerProfile.id === customerIdentifier
    ) {
      const updatedProfile = {
        ...customerProfile,
        password: cleanPass
      };
      setCustomerProfile(updatedProfile);
      safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updatedProfile));
    }

    showToast(
      lang === 'km'
        ? `🔑 បាន Reset លេខសម្ងាត់សម្រាប់ ${targetName} ទៅជា "${cleanPass}" ជោគជ័យ!`
        : `🔑 Successfully reset password for ${targetName} to "${cleanPass}"!`,
      'success'
    );
    return { success: true, newPassword: cleanPass };
  };

  // Wallet History Modal State & Transactions List
  const [isWalletHistoryOpen, setIsWalletHistoryOpen] = useState(false);

  const [walletTransactions, setWalletTransactions] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.WALLET_TRANSACTIONS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error('Failed to parse wallet transactions', e);
        }
      }
    }
    return INITIAL_WALLET_TRANSACTIONS || [];
  });

  const logWalletTransaction = (txData) => {
    const newTx = {
      id: txData.id || `WTX-${Date.now()}`,
      customerPhone: txData.customerPhone || customerProfile.phone || '010828282',
      customerName: txData.customerName || customerProfile.fullName || 'Vibol',
      type: txData.type || 'deposit',
      amount: parseFloat(txData.amount) || 0,
      direction: txData.direction || (txData.type === 'purchase' ? 'debit' : 'credit'),
      balanceAfter: parseFloat(txData.balanceAfter) || 0,
      paymentMethod: txData.paymentMethod || 'aba_khqr',
      titleKh: txData.titleKh || 'ប្រតិបត្តិការ Wallet',
      titleEn: txData.titleEn || 'Wallet Transaction',
      description: txData.description || '',
      orderId: txData.orderId || null,
      date: txData.date || new Date().toISOString(),
      status: 'completed'
    };

    setWalletTransactions(prev => {
      const updated = [newTx, ...prev];
      safeSetItem(STORAGE_KEYS.WALLET_TRANSACTIONS, JSON.stringify(updated));
      syncPushToServer({ wallet_transactions: updated });
      return updated;
    });
    return newTx;
  };

  const depositCredit = (amount, method = 'aba_khqr', note = '') => {
    const numAmount = parseFloat(amount) || 0;
    const newBalance = (parseFloat(customerProfile.balance) || 0) + numAmount;
    const updated = {
      ...customerProfile,
      isRegistered: true,
      balance: newBalance
    };
    setCustomerProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updated));
    }
    if (customerProfile.phone) {
      setRegisteredCustomers(prev => {
        const idx = prev.findIndex(c => c.phone === customerProfile.phone);
        if (idx >= 0) {
          const list = [...prev];
          list[idx] = { ...list[idx], wallet_balance: newBalance };
          safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(list));
          syncPushToServer({ registered_customers: list });
          return list;
        }
        return prev;
      });
    }

    // Log transaction history
    logWalletTransaction({
      type: 'deposit',
      amount: numAmount,
      direction: 'credit',
      balanceAfter: newBalance,
      paymentMethod: method,
      titleKh: method === 'cash' ? 'ដាក់លុយចូល (សាច់ប្រាក់នៅហាង)' : 'ដាក់លុយចូល (ABA KHQR)',
      titleEn: method === 'cash' ? 'Cash Deposit at Mart' : 'Deposit via ABA KHQR',
      description: note || 'Recharged V8 Wallet credit',
      customerPhone: customerProfile.phone || '010828282',
      customerName: customerProfile.fullName || 'Vibol'
    });
  };

  const deductCredit = (amount, orderId = null, orderDetails = '') => {
    const numAmount = parseFloat(amount) || 0;
    const newBalance = Math.max(0, (parseFloat(customerProfile.balance) || 0) - numAmount);
    const updated = {
      ...customerProfile,
      balance: newBalance
    };
    setCustomerProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updated));
    }
    if (customerProfile.phone) {
      setRegisteredCustomers(prev => {
        const idx = prev.findIndex(c => c.phone === customerProfile.phone);
        if (idx >= 0) {
          const list = [...prev];
          list[idx] = { ...list[idx], wallet_balance: newBalance };
          safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(list));
          syncPushToServer({ registered_customers: list });
          return list;
        }
        return prev;
      });
    }

    // Log purchase transaction history
    logWalletTransaction({
      type: 'purchase',
      amount: numAmount,
      direction: 'debit',
      balanceAfter: newBalance,
      paymentMethod: 'v8_wallet',
      titleKh: `ទូទាត់ការបញ្ជាទិញ ${orderId ? `#${orderId}` : ''}`,
      titleEn: `Order Payment ${orderId ? `#${orderId}` : ''}`,
      description: orderDetails || 'Express Mart Grocery Items',
      orderId: orderId,
      customerPhone: customerProfile.phone || '010828282',
      customerName: customerProfile.fullName || 'Vibol'
    });

    return newBalance;
  };

  // Admin Customer Top Up Action
  const adminTopUpCustomerWallet = (customerIdentifier, amount, method = 'cash', note = '') => {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ!' : 'Please enter a valid amount!', 'error');
      return { success: false };
    }

    let updatedBalance = 0;
    let targetName = customerIdentifier;

    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => 
        (c.id && c.id === customerIdentifier) || 
        (c.phone && c.phone === customerIdentifier) || 
        (c.fullName && c.fullName === customerIdentifier)
      );

      let updatedList;
      if (idx >= 0) {
        const currentBal = parseFloat(prev[idx].wallet_balance !== undefined ? prev[idx].wallet_balance : 15.0) || 0;
        updatedBalance = currentBal + numAmount;
        targetName = prev[idx].fullName || prev[idx].phone;

        updatedList = [...prev];
        updatedList[idx] = {
          ...updatedList[idx],
          wallet_balance: updatedBalance,
          last_topup: {
            amount: numAmount,
            method,
            note,
            date: new Date().toISOString()
          }
        };
      } else {
        updatedBalance = 15.0 + numAmount;
        const newCust = {
          id: `CUST-${Date.now()}`,
          fullName: customerIdentifier,
          phone: customerIdentifier,
          wallet_balance: updatedBalance,
          registeredAt: new Date().toISOString(),
          last_topup: {
            amount: numAmount,
            method,
            note,
            date: new Date().toISOString()
          }
        };
        updatedList = [newCust, ...prev];
      }

      safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
      syncPushToServer({ registered_customers: updatedList });
      return updatedList;
    });

    // Update active session if it matches this customer
    if (
      customerProfile.phone === customerIdentifier || 
      customerProfile.fullName === customerIdentifier ||
      customerProfile.id === customerIdentifier ||
      customerIdentifier === 'current'
    ) {
      const activeBal = (parseFloat(customerProfile.balance) || 0) + numAmount;
      const updatedProfile = {
        ...customerProfile,
        balance: activeBal
      };
      setCustomerProfile(updatedProfile);
      safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updatedProfile));
    }

    // Log Admin Top Up in Wallet History
    logWalletTransaction({
      type: 'topup',
      amount: numAmount,
      direction: 'credit',
      balanceAfter: updatedBalance,
      paymentMethod: method,
      titleKh: `Admin បញ្ចូលទឹកប្រាក់ (${method === 'cash' ? 'សាច់ប្រាក់នៅហាង' : (method === 'bonus' ? 'ប្រាក់រង្វាន់' : 'ABA / ធនាគារ')})`,
      titleEn: `Admin Top Up (${method})`,
      description: note || 'Recharged by Mart Manager at store',
      customerPhone: customerIdentifier === 'current' ? (customerProfile.phone || '010828282') : customerIdentifier,
      customerName: targetName
    });

    showToast(
      lang === 'km'
        ? `🎉 បានបញ្ចូលទឹកប្រាក់ $${numAmount.toFixed(2)} ទៅកាន់ Wallet របស់ ${targetName} ជោគជ័យ!`
        : `🎉 Successfully topped up $${numAmount.toFixed(2)} for ${targetName}!`,
      'success'
    );

    return { success: true, newBalance: updatedBalance };
  };

  // Admin Customer Withdraw Action (ដកប្រាក់/ដកក្រេឌីតពី Wallet ភ្ញៀវ)
  const adminWithdrawCustomerWallet = (customerIdentifier, amount, method = 'cash', note = '') => {
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      showToast(lang === 'km' ? 'សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលត្រូវដកត្រឹមត្រូវ!' : 'Please enter a valid withdrawal amount!', 'error');
      return { success: false, message: 'Invalid amount' };
    }

    let updatedBalance = 0;
    let targetName = customerIdentifier;
    let isSuccess = false;

    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => 
        (c.id && c.id === customerIdentifier) || 
        (c.phone && c.phone === customerIdentifier) || 
        (c.fullName && c.fullName === customerIdentifier)
      );

      if (idx >= 0) {
        const currentBal = parseFloat(prev[idx].wallet_balance !== undefined ? prev[idx].wallet_balance : 15.0) || 0;
        if (numAmount > currentBal) {
          showToast(
            lang === 'km' 
              ? `❌ មិនអាចដកលើសពីសមតុល្យដែលមាន $${currentBal.toFixed(2)} បានទេ!` 
              : `❌ Cannot withdraw more than available balance ($${currentBal.toFixed(2)})!`, 
            'error'
          );
          return prev;
        }

        updatedBalance = Math.max(0, currentBal - numAmount);
        targetName = prev[idx].fullName || prev[idx].phone;
        isSuccess = true;

        const updatedList = [...prev];
        updatedList[idx] = {
          ...updatedList[idx],
          wallet_balance: updatedBalance,
          last_withdrawal: {
            amount: numAmount,
            method,
            note,
            date: new Date().toISOString()
          }
        };
        safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
        syncPushToServer({ registered_customers: updatedList });
        return updatedList;
      } else {
        showToast(lang === 'km' ? 'រកមិនឃើញគណនីអតិថិជននេះទេ!' : 'Customer not found!', 'error');
        return prev;
      }
    });

    if (!isSuccess) return { success: false };

    // Update active session if it matches this customer
    if (
      customerProfile.phone === customerIdentifier || 
      customerProfile.fullName === customerIdentifier ||
      customerProfile.id === customerIdentifier ||
      customerIdentifier === 'current'
    ) {
      const activeBal = Math.max(0, (parseFloat(customerProfile.balance) || 0) - numAmount);
      const updatedProfile = {
        ...customerProfile,
        balance: activeBal
      };
      setCustomerProfile(updatedProfile);
      safeSetItem(STORAGE_KEYS.CUSTOMER_PROFILE, JSON.stringify(updatedProfile));
    }

    // Log Admin Withdrawal in Wallet History
    const methodNames = {
      cash: lang === 'km' ? 'សាច់ប្រាក់' : 'Cash',
      bank: lang === 'km' ? 'ផ្ញើតាមធនាគារ' : 'Bank Transfer',
      adjustment: lang === 'km' ? 'កែសម្រួលសមតុល្យ' : 'Adjustment'
    };

    logWalletTransaction({
      type: 'withdraw',
      amount: numAmount,
      direction: 'debit',
      balanceAfter: updatedBalance,
      paymentMethod: method,
      titleKh: `Admin ដកប្រាក់ពី Wallet (${methodNames[method] || method})`,
      titleEn: `Admin Wallet Withdrawal (${method})`,
      description: note || 'Withdrawn / Deducted by Mart Admin',
      customerPhone: customerIdentifier === 'current' ? (customerProfile.phone || '010828282') : customerIdentifier,
      customerName: targetName
    });

    showToast(
      lang === 'km'
        ? `✅ បានដកទឹកប្រាក់ $${numAmount.toFixed(2)} ពី Wallet របស់ ${targetName} ជោគជ័យ!`
        : `✅ Successfully withdrew $${numAmount.toFixed(2)} from ${targetName}'s wallet!`,
      'success'
    );

    return { success: true, newBalance: updatedBalance };
  };

  // Admin Set Customer Tier (VIP, Silver, Regular, Auto)
  const adminSetCustomerTier = (customerIdentifier, tierId) => {
    let targetName = customerIdentifier;
    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => 
        (c.id && c.id === customerIdentifier) || 
        (c.phone && c.phone === customerIdentifier) || 
        (c.fullName && c.fullName === customerIdentifier)
      );

      let updatedList;
      if (idx >= 0) {
        targetName = prev[idx].fullName || prev[idx].phone;
        updatedList = [...prev];
        updatedList[idx] = {
          ...updatedList[idx],
          custom_tier: tierId === 'auto' ? null : tierId,
          lastUpdated: new Date().toISOString()
        };
      } else {
        targetName = customerIdentifier;
        const newCust = {
          id: `CUST-${Date.now()}`,
          fullName: customerIdentifier,
          phone: customerIdentifier,
          custom_tier: tierId === 'auto' ? null : tierId,
          registeredAt: new Date().toISOString()
        };
        updatedList = [newCust, ...prev];
      }

      safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
      syncPushToServer({ registered_customers: updatedList });
      return updatedList;
    });

    const tierLabels = {
      vip: lang === 'km' ? 'អតិថិជន VIP (Gold)' : 'VIP Gold',
      silver: lang === 'km' ? 'សមាជិក Silver' : 'Silver Member',
      regular: lang === 'km' ? 'សមាជិកទូទៅ (Regular)' : 'Regular Member',
      auto: lang === 'km' ? 'គណនាស្វ័យប្រវត្ត (Auto Tier)' : 'Auto Calculated'
    };

    showToast(
      lang === 'km'
        ? `👑 បានកំណត់កម្រិត "${tierLabels[tierId] || tierId}" សម្រាប់ ${targetName} ជោគជ័យ!`
        : `👑 Set tier "${tierLabels[tierId] || tierId}" for ${targetName}!`,
      'success'
    );
    return { success: true };
  };

  // Admin Update Customer Notes
  const adminUpdateCustomerNotes = (customerIdentifier, notes) => {
    setRegisteredCustomers(prev => {
      const idx = prev.findIndex(c => 
        (c.id && c.id === customerIdentifier) || 
        (c.phone && c.phone === customerIdentifier) || 
        (c.fullName && c.fullName === customerIdentifier)
      );
      if (idx >= 0) {
        const updatedList = [...prev];
        updatedList[idx] = {
          ...updatedList[idx],
          notes: notes,
          lastUpdated: new Date().toISOString()
        };
        safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(updatedList));
        syncPushToServer({ registered_customers: updatedList });
        return updatedList;
      }
      return prev;
    });
    showToast(lang === 'km' ? '📝 បានរក្សាទុកកំណត់ចំណាំអតិថិជន!' : '📝 Customer notes saved!', 'success');
  };

  // 4. Side Drawer Navigation State
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);


  // Listen to browser navigation (Back/Forward buttons)
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentPath(window.location.pathname + window.location.hash + window.location.search);
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateTo = (path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(window.location.pathname + window.location.hash + window.location.search);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const setViewMode = (mode) => {
    if (mode === 'admin') {
      navigateTo('/admin');
    } else {
      navigateTo('/');
    }
  };

  const adminLogin = (pin, remember = false) => {
    if (pin === '1234' || pin === 'admin' || pin === 'v8mart') {
      setIsAdminAuthenticated(true);
      setActiveMember(null); // Null activeMember means Super Admin
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_MEMBER);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_MEMBER);
      }
      return true;
    }
    return false;
  };

  const memberLogin = (phone, pin, remember = false) => {
    const cleanPhone = phone.replace(/\s+/g, '');
    const found = members.find(m => m.phone.replace(/\s+/g, '') === cleanPhone && m.pin === pin);
    if (found) {
      setIsAdminAuthenticated(true);
      setActiveMember(found);
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MEMBER, JSON.stringify(found));
      } else {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_MEMBER, JSON.stringify(found));
      }
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveMember(null);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_MEMBER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_MEMBER);
  };

  const addMember = (memberData) => {
    const newMember = {
      id: `MEM-${Date.now()}`,
      ...memberData
    };
    setMembers(prev => {
      const updated = [...prev, newMember];
      safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      syncPushToServer({ members: updated });
      return updated;
    });
  };

  const updateMember = (updatedMember) => {
    setMembers(prev => {
      const updated = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      syncPushToServer({ members: updated });
      return updated;
    });
  };

  const deleteMember = (memberId) => {
    setMembers(prev => {
      const updated = prev.filter(m => m.id !== memberId);
      safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      syncPushToServer({ members: updated });
      return updated;
    });
  };

  // 4. Language, Currency & Dynamic Exchange Rate State
  const [lang, setLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LANG) || 'km';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'USD';
  });

  const [exchangeRate, setExchangeRateState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE);
    return saved ? parseInt(saved, 10) : DEFAULT_EXCHANGE_RATE;
  });

  const setExchangeRate = (newRate) => {
    const rateNum = Math.max(1000, parseInt(newRate, 10) || DEFAULT_EXCHANGE_RATE);
    setExchangeRateState(rateNum);
    localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, rateNum.toString());
  };

// Safe LocalStorage setter to prevent QuotaExceededError from crashing on mobile
const safeSetItem = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`LocalStorage write failed for key "${key}":`, err);
  }
};

  // 5. Products State (with migration for cost_price and image path resolution)
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(p => ({
            ...p,
            images: Array.isArray(p.images) ? p.images.map(resolveAssetUrl) : [],
            cost_price: p.cost_price !== undefined ? parseFloat(p.cost_price) : parseFloat((p.price * 0.7).toFixed(2))
          }));
        }
      } catch (e) {
        console.error('Failed to parse products', e);
      }
    }
    return INITIAL_PRODUCTS.map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images.map(resolveAssetUrl) : []
    }));
  });

  const [categories] = useState(INITIAL_CATEGORIES);

  // 3. Orders State (with migration for cost_price in items and delivery image resolution)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(o => ({
            ...o,
            delivery_evidence_image: o.delivery_evidence_image ? resolveAssetUrl(o.delivery_evidence_image) : o.delivery_evidence_image,
            order_items: (o.order_items || []).map(it => {
              let cost = it.cost_price !== undefined ? parseFloat(it.cost_price) : parseFloat(((it.unit_price || 0) * 0.7).toFixed(2));
              if (cost > 50 || cost > (parseFloat(it.unit_price) || 0) * 1.5) {
                cost = parseFloat((cost / DEFAULT_EXCHANGE_RATE).toFixed(4));
              }
              return {
                ...it,
                product_image: it.product_image ? resolveAssetUrl(it.product_image) : it.product_image,
                cost_price: cost
              };
            })
          }));
        }
      } catch (e) {
        console.error('Failed to parse orders', e);
      }
    }
    return INITIAL_ORDERS.map(o => ({
      ...o,
      delivery_evidence_image: o.delivery_evidence_image ? resolveAssetUrl(o.delivery_evidence_image) : o.delivery_evidence_image,
      order_items: (o.order_items || []).map(it => ({
        ...it,
        product_image: it.product_image ? resolveAssetUrl(it.product_image) : it.product_image
      }))
    }));
  });

  // 4. Cart State
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    return [];
  });

  // 5. Wishlist State
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse wishlist', e);
      }
    }
    return [];
  });

  // 6. Banners State (Admin Uploadable & Managed)
  const [banners, setBanners] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANNERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(b => ({
            ...b,
            image: b.image ? resolveAssetUrl(b.image) : b.image,
            title_kh: (b.title_kh || '').replace(/[\uFFFD]+/g, 'ពិសេស'),
            tag_kh: (b.tag_kh || '').replace(/[\uFFFD]+/g, 'ងាយស្រួល')
          }));
        }
      } catch (e) {
        console.error('Failed to parse banners', e);
      }
    }
    return INITIAL_BANNERS.map(b => ({
      ...b,
      image: b.image ? resolveAssetUrl(b.image) : b.image
    }));
  });

  // 6.5 Expenses State (Store Operating Costs & Packaging)
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse expenses', e);
      }
    }
    return INITIAL_EXPENSES;
  });

  // 6.7 Notifications State
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse notifications', e);
      }
    }
    return [
      {
        id: 'NOTIF-1',
        type: 'info',
        title_kh: 'ស្វាគមន៍មកកាន់ V8 Mini Mart',
        title_en: 'Welcome to V8 Mini Mart',
        message_kh: 'សូមរីករាយជាមួយការទិញទំនិញអនឡាញទាន់ចិត្ត និងសេវាកម្មដឹកជញ្ជូនឥតគិតថ្លៃក្នុងបុរី The Flora!',
        message_en: 'Enjoy instant online shopping and free delivery service within Borey The Flora!',
        date: new Date().toISOString()
      }
    ];
  });

  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    const saved = localStorage.getItem('v8_mart_read_notifications_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const addNotification = (notifData) => {
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      type: notifData.type || 'info',
      title_kh: notifData.title_kh || '',
      title_en: notifData.title_en || '',
      message_kh: notifData.message_kh || '',
      message_en: notifData.message_en || '',
      date: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(
      lang === 'km' ? 'បានផ្ញើការជូនដំណឹងថ្មីជោគជ័យ' : 'New notification pushed successfully',
      'success'
    );
    return newNotif;
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast(
      lang === 'km' ? 'បានលុបការជូនដំណឹង' : 'Notification deleted',
      'info'
    );
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(allIds);
    localStorage.setItem('v8_mart_read_notifications_v1', JSON.stringify(allIds));
  };

  // SMS Settings State
  const [smsSettings, setSmsSettings] = useState(() => {
    const saved = localStorage.getItem('v8_mart_sms_settings_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse SMS settings', e);
      }
    }
    return {
      enabled: false,
      url: '',
      authHeader: '',
      senderId: 'V8MiniMart'
    };
  });

  const updateSmsSettings = (newSettings) => {
    const updated = { ...smsSettings, ...newSettings };
    setSmsSettings(updated);
    safeSetItem('v8_mart_sms_settings_v1', JSON.stringify(updated));
    syncPushToServer({ smsSettings: updated });
  };

  const sendSmsNotification = async (phoneNumber, message) => {
    if (!smsSettings.enabled || !smsSettings.url) {
      console.log(`[SMS Simulation] To: ${phoneNumber} | Message: ${message}`);
      return { success: false, reason: 'SMS settings disabled or URL not configured' };
    }

    try {
      let cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (smsSettings.authHeader) {
        headers['Authorization'] = smsSettings.authHeader;
      }

      const payload = {
        to: cleanPhone,
        recipient: cleanPhone,
        phone: cleanPhone,
        message: message,
        text: message,
        sender: smsSettings.senderId || 'V8MiniMart',
        sender_id: smsSettings.senderId || 'V8MiniMart',
        from: smsSettings.senderId || 'V8MiniMart'
      };

      console.log(`[SMS Request] URL: ${smsSettings.url} | To: ${cleanPhone}`);
      const res = await fetch(smsSettings.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log(`[SMS Success] Sent to ${cleanPhone}`);
        return { success: true };
      } else {
        const errorText = await res.text();
        console.warn(`[SMS Failure] Status: ${res.status} | Details: ${errorText}`);
        return { success: false, status: res.status, error: errorText };
      }
    } catch (error) {
      console.error('[SMS Error] Exception:', error);
      return { success: false, error: error.message };
    }
  };

  // 7. UI Modals and Search State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingActiveTab, setTrackingActiveTab] = useState('active'); // 'active' | 'history'
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // =========================================================================
  // REAL-TIME MULTI-DEVICE SYNCHRONIZATION ENGINE (Mobile Phone <-> PC)
  // =========================================================================
  const lastServerSync = useRef(0);
  const isSyncingFromServer = useRef(false);
  const isInitialHydrated = useRef(false);

  // Function to pull latest state from central backend server
  const syncPullFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/db');
      if (!res.ok) return;
      const data = await res.json();

      if (data && !data.empty && data.lastUpdated) {
        if (!isInitialHydrated.current || data.lastUpdated > lastServerSync.current) {
          isSyncingFromServer.current = true;
          lastServerSync.current = data.lastUpdated;

          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
            safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
          }
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
            safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
          }
          if (Array.isArray(data.banners)) {
            setBanners(data.banners);
            safeSetItem(STORAGE_KEYS.BANNERS, JSON.stringify(data.banners));
          }
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
            safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(data.notifications));
          }
          if (data.smsSettings) {
            setSmsSettings(data.smsSettings);
            safeSetItem('v8_mart_sms_settings_v1', JSON.stringify(data.smsSettings));
          }
          if (Array.isArray(data.expenses)) {
            setExpenses(data.expenses);
            safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
          }
          if (Array.isArray(data.registered_customers)) {
            setRegisteredCustomers(data.registered_customers);
            safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(data.registered_customers));
          }
          if (Array.isArray(data.members)) {
            setMembers(data.members);
            safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.members));
          }
          if (data.exchangeRate) {
            setExchangeRateState(parseInt(data.exchangeRate, 10));
            safeSetItem(STORAGE_KEYS.EXCHANGE_RATE, data.exchangeRate.toString());
          }
          isInitialHydrated.current = true;
          setTimeout(() => {
            isSyncingFromServer.current = false;
          }, 150);
        }
      } else if (data && data.empty && !isInitialHydrated.current) {
        // First run on server: seed with initial state
        isInitialHydrated.current = true;
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products,
            orders,
            banners,
            expenses,
            exchangeRate,
            registered_customers: registeredCustomers,
            notifications,
            smsSettings,
            members
          })
        }).then(r => r.json()).then(saved => {
          if (saved && saved.lastUpdated) {
            lastServerSync.current = saved.lastUpdated;
          }
        }).catch(err => console.warn('Seeding /api/db failed:', err));
      }
    } catch (err) {
      // Backend not available or offline
    }
  }, [products, orders, banners, expenses, exchangeRate, registeredCustomers, notifications, smsSettings, members]);

  // Push updates to server whenever state changes from user action
  const syncPushToServer = useCallback((overrideData = {}) => {
    if (isSyncingFromServer.current) return;
    const payload = {
      products,
      orders,
      banners,
      expenses,
      exchangeRate,
      registered_customers: registeredCustomers,
      notifications,
      smsSettings,
      members,
      ...overrideData
    };

    fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()).then(res => {
      if (res && res.lastUpdated) {
        lastServerSync.current = res.lastUpdated;
      }
    }).catch(err => console.warn('POST /api/db failed:', err));
  }, [products, orders, banners, expenses, exchangeRate, registeredCustomers, notifications, members]);

  // Initial pull and periodic sync polling (every 2.5 seconds)
  useEffect(() => {
    syncPullFromServer();

    const interval = setInterval(syncPullFromServer, 2500);

    const handleFocus = () => syncPullFromServer();
    const handleVisibilityChange = () => {
      if (!document.hidden) syncPullFromServer();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncPullFromServer]);

  // Persist State to LocalStorage & Server safely
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    syncPushToServer({ products });
  }, [products]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    syncPushToServer({ orders });
  }, [orders]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.BANNERS, JSON.stringify(banners));
    syncPushToServer({ banners });
  }, [banners]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    syncPushToServer({ expenses });
  }, [expenses]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    syncPushToServer({ notifications });
  }, [notifications]);

  useEffect(() => {
    safeSetItem('v8_mart_sms_settings_v1', JSON.stringify(smsSettings));
    syncPushToServer({ smsSettings });
  }, [smsSettings]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.REGISTERED_CUSTOMERS, JSON.stringify(registeredCustomers));
    syncPushToServer({ registered_customers: registeredCustomers });
  }, [registeredCustomers]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    syncPushToServer({ members });
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Translations Helper (Language switch ONLY changes text translations, NOT currency)
  const t = translations[lang] || translations.km;

  // Currency Formatter with support for per-product currency, storefront header toggle, and live exchange rate
  const formatPrice = (priceVal, itemCurrency = null) => {
    const num = parseFloat(priceVal) || 0;
    const isProductInKHR = itemCurrency === 'KHR';
    
    const usdVal = isProductInKHR ? (num / exchangeRate) : num;
    const khrVal = isProductInKHR ? num : Math.round(num * exchangeRate);

    if (currency === 'KHR') {
      return `${Math.round(khrVal).toLocaleString()} ៛`;
    }
    return `$${usdVal.toFixed(2)}`;
  };

  const formatDualPrice = (priceVal, itemCurrency = null) => {
    const num = parseFloat(priceVal) || 0;
    const isProductInKHR = itemCurrency === 'KHR';
    
    const usdVal = isProductInKHR ? (num / exchangeRate) : num;
    const khrVal = isProductInKHR ? num : Math.round(num * exchangeRate);

    const usdStr = `$${usdVal.toFixed(2)}`;
    const khrStr = `${Math.round(khrVal).toLocaleString()} ៛`;

    if (currency === 'KHR') {
      return { usd: usdStr, khr: khrStr, primary: khrStr, secondary: usdStr };
    } else {
      return { usd: usdStr, khr: khrStr, primary: usdStr, secondary: khrStr };
    }
  };

  // Cart Management
  const addToCart = (product, quantity = 1) => {
    // Check available stock
    const currentProduct = products.find(p => p.id === product.id) || product;
    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    const existingQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const targetQty = existingQty + quantity;

    if (currentProduct.stock_quantity < targetQty) {
      showToast(
        lang === 'km' 
          ? `ស្តុកមិនគ្រប់គ្រាន់ទេ! នៅសល់តែ ${currentProduct.stock_quantity} ប៉ុណ្ណោះ`
          : `Insufficient stock! Only ${currentProduct.stock_quantity} left`,
        'error'
      );
      return false;
    }

    // Normalize unit price to USD base for cart calculation
    const isKHR = product.currency === 'KHR';
    const normalizedUnitPrice = isKHR 
      ? parseFloat((product.price / exchangeRate).toFixed(4))
      : parseFloat(product.price);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = targetQty;
      setCart(updatedCart);
    } else {
      setCart(prev => [
        ...prev,
        {
          id: `CART-${Date.now()}-${product.id}`,
          product_id: product.id,
          product_title_en: product.title_en,
          product_title_kh: product.title_kh,
          product_image: product.images[0],
          sku: product.sku,
          currency: product.currency || 'USD',
          display_price: product.price,
          unit_price: normalizedUnitPrice,
          cost_price: isKHR ? parseFloat((product.cost_price / exchangeRate).toFixed(4)) : parseFloat(product.cost_price),
          quantity: quantity
        }
      ]);
    }
    showToast(
      lang === 'km' 
        ? `បានដាក់ "${lang === 'km' ? product.title_kh : product.title_en}" ចូលកន្ត្រក`
        : `Added "${product.title_en}" to cart!`,
      'success'
    );
    return true;
  };

  const updateCartQuantity = (productId, delta) => {
    const currentProduct = products.find(p => p.id === productId);
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (currentProduct && newQty > currentProduct.stock_quantity) {
            showToast(
              lang === 'km'
                ? `ស្តុកអតិបរមាគឺ ${currentProduct.stock_quantity}`
                : `Maximum available stock is ${currentProduct.stock_quantity}`,
              'error'
            );
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
    showToast(lang === 'km' ? 'បានលុបទំនិញពីកន្ត្រក' : 'Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (product) => {
    const exists = wishlist.some(item => item.id === product.id);
    if (exists) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      showToast(lang === 'km' ? 'បានដកចេញពីទំនិញពេញចិត្ត' : 'Removed from wishlist', 'info');
    } else {
      setWishlist(prev => [...prev, product]);
      showToast(lang === 'km' ? 'បានបន្ថែមទៅទំនិញពេញចិត្ត' : 'Added to wishlist ❤️', 'success');
    }
  };

  // Cart Calculations & Borey The Flora Free Delivery (6,000 KHR if outside)
  const STANDARD_DELIVERY_KHR = 6000; // 6,000 KHR standard shipping fee for outside Borey The Flora
  const [isInBoreyTheFlora, setIsInBoreyTheFlora] = useState(true);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = cart.length === 0 ? 0 : (isInBoreyTheFlora ? 0 : (STANDARD_DELIVERY_KHR / exchangeRate));
  const cartTotal = cartSubtotal + shippingFee;

  // =========================================================================
  // CORE INVENTORY LOGIC: CHECKOUT (Stock Deduction)
  // =========================================================================
  const checkoutOrder = (customerData, paymentMethod = 'khqr') => {
    if (cart.length === 0) {
      return { success: false, message: 'Cart is empty' };
    }

    // Step 1: Validate stock for all cart items atomically
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        return {
          success: false,
          message: lang === 'km' ? `ទំនិញមិនមានក្នុងប្រព័ន្ធ` : `Product not found: ${item.product_title_en}`
        };
      }
      if (product.stock_quantity < item.quantity) {
        return {
          success: false,
          message: lang === 'km'
            ? `ទំនិញ "${product.title_kh}" មានស្តុកតែ ${product.stock_quantity} មិនគ្រប់គ្រាន់សម្រាប់កុម្ម៉ង់ ${item.quantity} ទេ!`
            : `Product "${product.title_en}" only has ${product.stock_quantity} left in stock. Cannot checkout ${item.quantity}.`
        };
      }
    }

    // Step 2: Deduct stock and increment sold_count for each product
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.product_id === product.id);
      if (cartItem) {
        const newStock = product.stock_quantity - cartItem.quantity;
        const newSold = (product.sold_count || 0) + cartItem.quantity;
        return {
          ...product,
          stock_quantity: Math.max(0, newStock),
          sold_count: newSold
        };
      }
      return product;
    });

    // Step 3: Create Order Record
    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      customer_name: customerData.name || 'Valued Customer',
      customer_phone: customerData.phone || '012 345 678',
      shipping_address: customerData.address || 'Street 2004, Phnom Penh',
      city_province: customerData.city || 'Phnom Penh',
      notes: customerData.notes || '',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
      subtotal: Number(cartSubtotal.toFixed(2)),
      shipping_fee: Number(shippingFee.toFixed(2)),
      total_amount: Number(cartTotal.toFixed(2)),
      is_in_borey_the_flora: isInBoreyTheFlora,
      delivery_remarks: isInBoreyTheFlora 
        ? 'ដឹកជញ្ជូនឥតគិតថ្លៃ (ក្នុងបុរី The Flora)' 
        : 'សេវាដឹកជញ្ជូន 6,000 ៛ (ក្រៅបុរី The Flora)',
      status: paymentMethod === 'cod' ? 'pending' : 'paid',
      created_at: new Date().toISOString(),
      order_items: cart.map((item, idx) => {
        const prod = products.find(p => p.id === item.product_id);
        return {
          id: `ITEM-${orderId}-${idx + 1}`,
          product_id: item.product_id,
          product_name: lang === 'km' ? item.product_title_kh : item.product_title_en,
          product_image: item.product_image,
          sku: item.sku,
          quantity: item.quantity,
          cost_price: item.cost_price !== undefined 
            ? item.cost_price 
            : (prod && prod.cost_price !== undefined 
                ? (prod.currency === 'KHR' ? parseFloat((prod.cost_price / exchangeRate).toFixed(4)) : prod.cost_price)
                : parseFloat(((item.unit_price || 0) * 0.7).toFixed(2))),
          unit_price: item.unit_price,
          total_price: Number((item.unit_price * item.quantity).toFixed(2))
        };
      })
    };

    // Apply updates
    setProducts(updatedProducts);
    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // Send Order Confirmation SMS
    if (smsSettings.enabled && newOrder.customer_phone) {
      const formattedTotal = formatPrice(newOrder.total_amount);
      const smsMsg = lang === 'km'
        ? `V8 Mini Mart: ការបញ្ជាទិញលេខ ${newOrder.id} របស់លោកអ្នកទទួលបានជោគជ័យ! សរុប៖ ${formattedTotal}។ អរគុណសម្រាប់ការទិញទំនិញ!`
        : `V8 Mini Mart: Your order ${newOrder.id} has been placed successfully! Total: ${formattedTotal}. Thank you for shopping with us!`;
      sendSmsNotification(newOrder.customer_phone, smsMsg);
    }

    return {
      success: true,
      order: newOrder
    };
  };

  // =========================================================================
  // CORE INVENTORY LOGIC: CANCEL ORDER (Stock Restoration)
  // =========================================================================
  const updateOrderStatus = (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const previousStatus = targetOrder.status;

    // Case 1: Order is being CANCELLED -> Return stock back to inventory!
    if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      setProducts(prevProducts => {
        return prevProducts.map(product => {
          const item = targetOrder.order_items.find(it => it.product_id === product.id);
          if (item) {
            // Restore stock_quantity and reduce sold_count
            return {
              ...product,
              stock_quantity: product.stock_quantity + item.quantity,
              sold_count: Math.max(0, (product.sold_count || 0) - item.quantity)
            };
          }
          return product;
        });
      });

      showToast(
        lang === 'km'
          ? `ការបញ្ជាទិញ ${orderId} ត្រូវបានបោះបង់! ចំនួនស្តុកត្រូវបានបូកត្រឡប់ចូលឃ្លាំងវិញដោយស្វ័យប្រវត្តិ។`
          : `Order ${orderId} cancelled! Stock has been automatically restored to inventory.`,
        'warning'
      );
    } 
    // Case 2: Order was CANCELLED and is being restored back to active -> Deduct stock again
    else if (previousStatus === 'cancelled' && newStatus !== 'cancelled') {
      setProducts(prevProducts => {
        return prevProducts.map(product => {
          const item = targetOrder.order_items.find(it => it.product_id === product.id);
          if (item) {
            return {
              ...product,
              stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
              sold_count: (product.sold_count || 0) + item.quantity
            };
          }
          return product;
        });
      });

      showToast(
        lang === 'km'
          ? `ការបញ្ជាទិញ ${orderId} ត្រូវបានបើកដំណើរការឡើងវិញ ហើយស្តុកត្រូវបានកាត់រំលោះ។`
          : `Order ${orderId} reactivated and stock re-allocated.`,
        'info'
      );
    } else {
      showToast(
        lang === 'km' 
          ? `បានប្តូរស្ថានភាព Order ${orderId} ទៅជា "${newStatus.toUpperCase()}"`
          : `Order ${orderId} status updated to "${newStatus.toUpperCase()}"`,
        'success'
      );
    }

    // Update order state
    setOrders(prevOrders => {
      return prevOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: newStatus,
            payment_status: newStatus === 'paid' || newStatus === 'shipped' || newStatus === 'completed' 
              ? 'paid' 
              : (newStatus === 'cancelled' ? 'cancelled' : o.payment_status)
          };
        }
        return o;
      });
    });

    // Send SMS Notification for Status Update
    if (smsSettings.enabled && targetOrder && targetOrder.customer_phone) {
      let smsMsg = '';
      if (newStatus === 'shipped') {
        smsMsg = lang === 'km'
          ? `V8 Mini Mart: ការបញ្ជាទិញលេខ ${orderId} របស់លោកអ្នកកំពុងដឹកជញ្ជូន! អ្នកដឹកនឹងទូរស័ព្ទទៅលោកអ្នកក្នុងពេលបន្តិចទៀតនេះ។`
          : `V8 Mini Mart: Your order ${orderId} is being shipped! The delivery driver will call you shortly.`;
      } else if (newStatus === 'completed') {
        smsMsg = lang === 'km'
          ? `V8 Mini Mart: ការបញ្ជាទិញលេខ ${orderId} របស់លោកអ្នកត្រូវបានបញ្ចប់ជោគជ័យ! សូមអរគុណច្រើន!`
          : `V8 Mini Mart: Your order ${orderId} has been successfully delivered! Thank you very much!`;
      } else if (newStatus === 'cancelled') {
        smsMsg = lang === 'km'
          ? `V8 Mini Mart: ការបញ្ជាទិញលេខ ${orderId} របស់លោកអ្នកត្រូវបានបោះបង់។`
          : `V8 Mini Mart: Your order ${orderId} has been cancelled.`;
      }
      if (smsMsg) {
        sendSmsNotification(targetOrder.customer_phone, smsMsg);
      }
    }
  };

  // Delivery Confirmation Handler (Customer or Driver confirms receipt of goods)
  const confirmOrderDelivery = (orderId, confirmedBy = 'customer', evidenceImage = null) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return { success: false, message: 'Order not found' };

    setOrders(prevOrders => {
      const updated = prevOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'completed',
            delivery_status: 'delivered',
            delivered_at: new Date().toISOString(),
            delivery_confirmed_by: confirmedBy,
            delivery_evidence_image: evidenceImage || o.delivery_evidence_image || null,
            delivery_evidence_time: evidenceImage ? new Date().toISOString() : o.delivery_evidence_time || new Date().toISOString(),
            payment_status: 'paid'
          };
        }
        return o;
      });
      syncPushToServer({ orders: updated });
      return updated;
    });

    showToast(
      lang === 'km'
        ? `✅ បានបញ្ជាក់ថាបានទទួលទំនិញ ${orderId} រួចរាល់! អរគុណសម្រាប់ការគាំទ្រ V8 Mini Mart 🎉`
        : `✅ Order ${orderId} delivery confirmed successfully! Thank you for shopping with V8 Mini Mart 🎉`,
      'success'
    );
    return { success: true };
  };

  // Dedicated Delivery Evidence Photo Upload (Admin / Driver / Customer)
  const uploadDeliveryEvidence = async (orderId, evidenceImage) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return { success: false, message: 'Order not found' };

    let finalImageUrl = evidenceImage;

    // If base64 image, upload to server to save directly in "image delivery" folder
    if (typeof evidenceImage === 'string' && evidenceImage.startsWith('data:image')) {
      try {
        const res = await fetch('/api/upload-delivery-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: evidenceImage,
            fileName: `delivery_${orderId}_${Date.now()}`
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            finalImageUrl = data.url;
          }
        }
      } catch (err) {
        console.error('Failed to upload delivery evidence image to disk:', err);
      }
    }

    setOrders(prevOrders => {
      const updated = prevOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            delivery_evidence_image: finalImageUrl,
            delivery_evidence_time: new Date().toISOString()
          };
        }
        return o;
      });
      syncPushToServer({ orders: updated });
      return updated;
    });

    showToast(
      lang === 'km'
        ? `📸 បានរក្សាទុករូបភាពភស្តុតាងប្រគល់ទំនិញ ${orderId} ក្នុង Folder "image delivery" រួចរាល់!`
        : `📸 Proof of delivery photo saved to "image delivery" for ${orderId}!`,
      'success'
    );
    return { success: true, url: finalImageUrl };
  };

  // Admin Direct Product Actions
  const addProduct = (newProduct) => {
    const productRecord = {
      ...newProduct,
      id: `PRD-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`,
      cost_price: parseFloat(newProduct.cost_price) || 0,
      price: parseFloat(newProduct.price) || 0,
      rating: 5.0,
      review_count: 1,
      sold_count: 0,
      low_stock_threshold: newProduct.low_stock_threshold || 5,
      created_at: new Date().toISOString()
    };
    setProducts(prev => [productRecord, ...prev]);
    showToast(
      lang === 'km' ? `បានបន្ថែមទំនិញ "${productRecord.title_kh || productRecord.title_en}" ជោគជ័យ` : `Product added successfully!`,
      'success'
    );
    return productRecord;
  };

  const editProduct = (updatedProduct) => {
    const cleanedProduct = {
      ...updatedProduct,
      cost_price: parseFloat(updatedProduct.cost_price) || 0,
      price: parseFloat(updatedProduct.price) || 0,
    };
    setProducts(prev => prev.map(p => p.id === cleanedProduct.id ? cleanedProduct : p));
    showToast(
      lang === 'km' ? `បានកែប្រែទិន្នន័យទំនិញជោគជ័យ` : `Product details updated!`,
      'success'
    );
  };

  const deleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    showToast(
      lang === 'km' ? `បានលុបទំនិញចេញពីប្រព័ន្ធ` : `Product deleted from inventory`,
      'info'
    );
  };

  const adjustStock = (productId, delta) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock_quantity + delta);
        return { ...p, stock_quantity: newStock };
      }
      return p;
    }));
  };

  // Banner Management (Admin Only)
  const addBanner = (bannerData) => {
    const newBanner = {
      id: `BAN-${Date.now()}`,
      active: true,
      ...bannerData
    };
    setBanners(prev => [newBanner, ...prev]);
    showToast(
      lang === 'km' ? 'បានបន្ថែមផ្ទាំងផ្សព្វផ្សាយថ្មីជោគជ័យ' : 'New banner added successfully',
      'success'
    );
    return newBanner;
  };

  const updateBanner = (bannerId, updatedData) => {
    setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, ...updatedData } : b));
    showToast(
      lang === 'km' ? 'បានកែប្រែផ្ទាំងផ្សព្វផ្សាយជោគជ័យ' : 'Banner updated successfully',
      'success'
    );
  };

  const deleteBanner = (bannerId) => {
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    showToast(
      lang === 'km' ? 'បានលុបផ្ទាំងផ្សព្វផ្សាយ' : 'Banner deleted',
      'info'
    );
  };

  const toggleBannerStatus = (bannerId) => {
    setBanners(prev => prev.map(b => {
      if (b.id === bannerId) {
        const updated = !b.active;
        showToast(
          lang === 'km' 
            ? (updated ? 'បានបើកផ្ទាំងផ្សព្វផ្សាយ' : 'បានបិទផ្ទាំងផ្សព្វផ្សាយ')
            : (updated ? 'Banner activated' : 'Banner deactivated'),
          'info'
        );
        return { ...b, active: updated };
      }
      return b;
    }));
  };

  // Expense Actions (Admin)
  const addExpense = (expense) => {
    const newExp = {
      ...expense,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      amount: parseFloat(expense.amount) || 0,
      date: expense.date || new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [newExp, ...prev]);
    showToast(lang === 'km' ? '✅ បានកត់ត្រាការចំណាយថ្មី' : '✅ Expense recorded');
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    showToast(lang === 'km' ? '🗑️ បានលុបការចំណាយ' : '🗑️ Expense removed');
  };

  // Reset to factory demo data if needed
  const resetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setBanners(INITIAL_BANNERS);
    setExpenses(INITIAL_EXPENSES);
    setCart([]);
    setWishlist([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.BANNERS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.WISHLIST);
    showToast(lang === 'km' ? 'បានកំណត់ទិន្នន័យឡើងវិញ' : 'Reset to default demo data', 'info');
  };

  // Computed Metrics (Live Financial & Inventory Analytics)
  const lowStockProducts = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5));
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
  
  // 1. Total Revenue (ចំណូលសរុបពីការលក់)
  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'paid' || o.status === 'shipped').length;

  // 2. Cost of Goods Sold - COGS (ថ្លៃដើមទំនិញលក់បាន)
  const totalCostOfGoodsSold = nonCancelledOrders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((itSum, it) => {
      let cost = parseFloat(it.cost_price) !== undefined && !isNaN(parseFloat(it.cost_price))
        ? parseFloat(it.cost_price)
        : (parseFloat(it.unit_price) * 0.7);
      if (cost > 50 || cost > (parseFloat(it.unit_price) || 0) * 1.5) {
        cost = cost / exchangeRate;
      }
      return itSum + (cost * (it.quantity || 0));
    }, 0);
  }, 0);

  // 3. Expenses & Discounts (ចំណាយផ្សេងៗ & បញ្ចុះតម្លៃ)
  const totalDiscountsGiven = nonCancelledOrders.reduce((sum, o) => {
    const itemDiscounts = (o.order_items || []).reduce((itSum, it) => {
      const orig = parseFloat(it.original_price) || 0;
      const unit = parseFloat(it.unit_price) || 0;
      const disc = orig > unit ? (orig - unit) : 0;
      return itSum + (disc * (it.quantity || 0));
    }, 0);
    return sum + itemDiscounts + (parseFloat(o.discount_amount) || 0);
  }, 0);

  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalExpensesAndDiscounts = totalDiscountsGiven + totalOperatingExpenses;

  // 4. Net Profit Realized (ចំណេញសុទ្ធ)
  const grossProfit = Math.max(0, totalRevenue - totalCostOfGoodsSold);
  const totalRealizedProfit = Math.max(0, grossProfit - totalExpensesAndDiscounts);
  const overallProfitMargin = totalRevenue > 0 ? (totalRealizedProfit / totalRevenue) * 100 : 0;

  // 5. Inventory Cost & Potential Profit (តម្លៃស្តុក & ចំណេញរំពឹងទុក)
  const totalCostValue = products.reduce((sum, p) => {
    const isKHR = p.currency === 'KHR';
    const cost = parseFloat(p.cost_price) || (parseFloat(p.price) * 0.7);
    const costUsd = isKHR ? (cost / exchangeRate) : cost;
    return sum + (costUsd * (p.stock_quantity || 0));
  }, 0);
  const totalInventoryValue = products.reduce((sum, p) => {
    const isKHR = p.currency === 'KHR';
    const price = parseFloat(p.price) || 0;
    const priceUsd = isKHR ? (price / exchangeRate) : price;
    return sum + (priceUsd * (p.stock_quantity || 0));
  }, 0);
  const totalEstimatedStockProfit = Math.max(0, totalInventoryValue - totalCostValue);

  return (
    <StoreContext.Provider
      value={{
        // Lang & Currency & Exchange Rate
        lang,
        setLang,
        currency,
        setCurrency,
        exchangeRate,
        setExchangeRate,
        t,
        formatPrice,
        formatDualPrice,
        viewMode,
        setViewMode,
        currentPath,
        navigateTo,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
        resolveAssetUrl,

        // Data
        products,
        categories,
        orders,
        banners,
        expenses,
        addExpense,
        deleteExpense,
        notifications,
        readNotificationIds,
        addNotification,
        deleteNotification,
        markAllNotificationsAsRead,
        smsSettings,
        updateSmsSettings,
        sendSmsNotification,
        cart,
        wishlist,

        // Banner Actions (Admin)
        addBanner,
        updateBanner,
        deleteBanner,
        toggleBannerStatus,

        // Cart Actions
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
        shippingFee,
        cartTotal,
        isInBoreyTheFlora,
        setIsInBoreyTheFlora,
        STANDARD_DELIVERY_KHR,
        toggleWishlist,

        // Inventory & Order Actions
        checkoutOrder,
        updateOrderStatus,
        addProduct,
        editProduct,
        deleteProduct,
        adjustStock,
        resetDemoData,

        // 5 Core Financial & Inventory Analytics (Enterprise Dashboard)
        lowStockProducts,
        outOfStockProducts,
        totalRevenue,
        totalOrdersCount,
        activeOrdersCount,
        totalCostOfGoodsSold,
        totalDiscountsGiven,
        totalOperatingExpenses,
        totalExpensesAndDiscounts,
        totalRealizedProfit,
        overallProfitMargin,
        totalCostValue,
        totalInventoryValue,
        totalEstimatedStockProfit,

        // Customer Profile State
        customerProfile,
        registeredCustomers,
        walletTransactions,

        // Member Management & Role Access
        members,
        activeMember,
        addMember,
        updateMember,
        deleteMember,
        memberLogin,
        isWalletHistoryOpen,
        setIsWalletHistoryOpen,
        logWalletTransaction,
        updateCustomerProfile,
        loginCustomer,
        registerCustomer,
        changeCustomerPassword,
        resetCustomerPasswordWithPhone,
        adminResetCustomerPassword,
        logoutCustomer,
        depositCredit,
        deductCredit,
        adminTopUpCustomerWallet,
        adminWithdrawCustomerWallet,
        adminSetCustomerTier,
        adminUpdateCustomerNotes,

        // UI & Theme State
        theme,
        setTheme,
        toggleTheme,
        fontSize,
        setFontSize,
        isSideDrawerOpen,
        setIsSideDrawerOpen,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSearchModalOpen,
        setIsSearchModalOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isTrackingOpen,
        setIsTrackingOpen,
        trackingActiveTab,
        setTrackingActiveTab,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        confirmOrderDelivery,
        uploadDeliveryEvidence,
        quickViewProduct,
        setQuickViewProduct,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        toastMessage,
        showToast
      }}
    >
      {children}
    </StoreContext.Provider>
  );



};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
