import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { 
  Users, DollarSign, ShoppingBag, MapPin, Award, Crown, 
  Sparkles, Phone, MessageSquare, Search, Filter, 
  ArrowUpDown, ChevronRight, ChevronLeft, Calendar, 
  Clock, Eye, ExternalLink, RefreshCw, X, TrendingUp, 
  CheckCircle, Package, ArrowUpRight, UserCheck, ShieldCheck, Mail, Navigation,
  Wallet, PlusCircle, MinusCircle, CreditCard, Activity, Smartphone, Globe,
  FileText, Save, Printer, ArrowDownCircle, Info, ChevronDown, KeyRound, Lock, Copy, Check, Send
} from 'lucide-react';

export const CustomerAnalytics = () => {
  const { 
    orders = [], 
    registeredCustomers = [], 
    walletTransactions = [],
    customerProfile,
    adminTopUpCustomerWallet,
    adminWithdrawCustomerWallet,
    adminSetCustomerTier,
    adminUpdateCustomerNotes,
    adminResetCustomerPassword,
    formatPrice, 
    formatDualPrice, 
    exchangeRate = 4000, 
    lang 
  } = useStore();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState('all'); // 'all' | 'online' | 'vip' | 'silver' | 'regular'
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('totalSpend_desc'); // 'totalSpend_desc' | 'totalSpend_asc' | 'orders_desc' | 'recent_desc' | 'name_asc'
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Customer Detail Tracking Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTrackingTab, setActiveTrackingTab] = useState('overview'); // 'overview' | 'orders' | 'wallet' | 'tracking'
  const [customerNoteText, setCustomerNoteText] = useState('');

  // Wallet Management Modal State (Top Up & Withdraw)
  const [walletModalCustomer, setWalletModalCustomer] = useState(null);
  const [walletModalTab, setWalletModalTab] = useState('topup'); // 'topup' | 'withdraw'
  const [walletAmount, setWalletAmount] = useState('');
  const [walletMethod, setWalletMethod] = useState('cash'); // 'cash' | 'aba' | 'bonus' | 'adjustment'
  const [walletNote, setWalletNote] = useState('');

  // Admin Reset Customer Password Modal State
  const [resetPassCustomer, setResetPassCustomer] = useState(null);
  const [adminNewPass, setAdminNewPass] = useState('1234');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [isCopiedPass, setIsCopiedPass] = useState(false);

  // 1. Customer Auto-Tiering & Manual Override Calculator
  // VIP: Total Spend >= $100 OR Orders >= 4 OR Wallet Balance >= $50 OR custom_tier === 'vip'
  // Silver: Total Spend >= $35 OR Orders >= 2 OR Wallet Balance >= $20 OR custom_tier === 'silver'
  // Regular: Everything else OR custom_tier === 'regular'
  const getCustomerTier = (totalSpend, orderCount, walletBalance = 0, customTier = null) => {
    if (customTier === 'vip') {
      return {
        id: 'vip',
        name_en: 'VIP Gold (Manual)',
        name_kh: 'អតិថិជន VIP (កំណត់ដោយ Admin)',
        short_kh: 'អតិថិជន VIP',
        short_en: 'VIP Gold',
        isManual: true,
        icon: Crown,
        badgeClass: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/20 font-black',
        borderClass: 'border-amber-400 dark:border-amber-500',
        pillBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      };
    }
    if (customTier === 'silver') {
      return {
        id: 'silver',
        name_en: 'Silver Member (Manual)',
        name_kh: 'សមាជិក Silver (កំណត់ដោយ Admin)',
        short_kh: 'សមាជិក Silver',
        short_en: 'Silver Member',
        isManual: true,
        icon: Award,
        badgeClass: 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-xs font-black',
        borderClass: 'border-slate-300 dark:border-slate-600',
        pillBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
      };
    }
    if (customTier === 'regular') {
      return {
        id: 'regular',
        name_en: 'Regular Member (Manual)',
        name_kh: 'សមាជិកទូទៅ (កំណត់ដោយ Admin)',
        short_kh: 'សមាជិកទូទៅ',
        short_en: 'Regular',
        isManual: true,
        icon: Users,
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-bold',
        borderClass: 'border-emerald-200 dark:border-emerald-800',
        pillBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      };
    }

    // Auto calculation
    if (totalSpend >= 100 || orderCount >= 4 || walletBalance >= 50) {
      return {
        id: 'vip',
        name_en: 'VIP Gold',
        name_kh: 'អតិថិជន VIP',
        short_kh: 'អតិថិជន VIP',
        short_en: 'VIP Gold',
        isManual: false,
        icon: Crown,
        badgeClass: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/20 font-black',
        borderClass: 'border-amber-400 dark:border-amber-500',
        pillBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      };
    }
    if (totalSpend >= 35 || orderCount >= 2 || walletBalance >= 20) {
      return {
        id: 'silver',
        name_en: 'Silver Member',
        name_kh: 'សមាជិក Silver',
        short_kh: 'សមាជិក Silver',
        short_en: 'Silver Member',
        isManual: false,
        icon: Award,
        badgeClass: 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-xs font-black',
        borderClass: 'border-slate-300 dark:border-slate-600',
        pillBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
      };
    }
    return {
      id: 'regular',
      name_en: 'Regular Member',
      name_kh: 'អតិថិជនទូទៅ',
      short_kh: 'អតិថិជនទូទៅ',
      short_en: 'Regular',
      isManual: false,
      icon: Users,
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-bold',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      pillBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    };
  };

  // 2. Aggregate Customers from Registered Users AND Order Records with Active/Online tracking
  const customerList = useMemo(() => {
    const customerMap = {};

    // First Pass: Add all registered app customers
    registeredCustomers.forEach(reg => {
      const phoneClean = (reg.phone || '').trim();
      const nameClean = (reg.fullName || reg.name || '').trim();
      const key = phoneClean || nameClean || reg.id;
      if (!key) return;

      const isCurrentActiveSession = Boolean(
        customerProfile && 
        customerProfile.isRegistered && 
        (customerProfile.phone === phoneClean || customerProfile.fullName === nameClean)
      );

      const isOnline = Boolean(
        reg.is_online || 
        isCurrentActiveSession || 
        (reg.last_active_at && (Date.now() - new Date(reg.last_active_at).getTime()) < 15 * 60 * 1000)
      );

      customerMap[key] = {
        id: reg.id || key,
        name: nameClean || (lang === 'km' ? 'អតិថិជនបានចុះឈ្មោះ' : 'Registered Member'),
        phone: phoneClean || 'N/A',
        avatar: reg.avatar || '',
        city: reg.city || (lang === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh'),
        address: reg.address || (lang === 'km' ? 'មិនមានអាសយដ្ឋាន' : 'No address specified'),
        googleMapsUrl: reg.googleMapsUrl || (reg.latitude && reg.longitude ? `https://www.google.com/maps?q=${reg.latitude},${reg.longitude}` : ''),
        latitude: reg.latitude || null,
        longitude: reg.longitude || null,
        wallet_balance: reg.wallet_balance !== undefined 
          ? parseFloat(reg.wallet_balance) 
          : (isCurrentActiveSession ? (parseFloat(customerProfile.balance) || 15.0) : 15.0),
        last_topup: reg.last_topup || null,
        last_withdrawal: reg.last_withdrawal || null,
        custom_tier: reg.custom_tier || null,
        notes: reg.notes || '',
        login_device: reg.login_device || (isCurrentActiveSession ? 'Mobile Web App • Chrome' : 'Web Browser (Safari / Chrome)'),
        login_ip: reg.login_ip || '103.14.24.18 (Phnom Penh, KH)',
        is_online: isOnline,
        last_active_at: reg.last_active_at || (isOnline ? new Date().toISOString() : (reg.registeredAt || new Date().toISOString())),
        orderCount: 0,
        totalSpend: 0,
        isAppRegistered: true,
        firstOrderDate: null,
        lastOrderDate: reg.registeredAt || new Date().toISOString(),
        registeredAt: reg.registeredAt || new Date().toISOString(),
        ordersList: []
      };
    });

    // Second Pass: Merge orders
    orders.forEach(order => {
      const phoneClean = (order.customer_phone || '').trim();
      const nameClean = (order.customer_name || '').trim();
      const key = phoneClean || nameClean || order.id;

      if (!customerMap[key]) {
        const isCurrentActiveSession = Boolean(
          customerProfile && 
          customerProfile.isRegistered && 
          (customerProfile.phone === phoneClean || customerProfile.fullName === nameClean)
        );

        customerMap[key] = {
          id: key,
          name: nameClean || (lang === 'km' ? 'អតិថិជនគ្មានឈ្មោះ' : 'Customer'),
          phone: phoneClean || 'N/A',
          avatar: '',
          city: order.city_province || (lang === 'km' ? 'រាជធានីភ្នំពេញ' : 'Phnom Penh'),
          address: order.shipping_address || (lang === 'km' ? 'មិនមានអាសយដ្ឋាន' : 'No address specified'),
          googleMapsUrl: '',
          latitude: null,
          longitude: null,
          wallet_balance: isCurrentActiveSession ? (parseFloat(customerProfile.balance) || 15.0) : 15.0,
          last_topup: null,
          last_withdrawal: null,
          custom_tier: null,
          notes: '',
          login_device: 'Web Shopper (Desktop / Mobile)',
          login_ip: '103.14.24.99 (Phnom Penh, KH)',
          is_online: isCurrentActiveSession,
          last_active_at: order.created_at || new Date().toISOString(),
          orderCount: 0,
          totalSpend: 0,
          isAppRegistered: false,
          firstOrderDate: order.created_at || new Date().toISOString(),
          lastOrderDate: order.created_at || new Date().toISOString(),
          registeredAt: order.created_at || new Date().toISOString(),
          ordersList: []
        };
      }

      const cust = customerMap[key];
      cust.orderCount += 1;
      cust.ordersList.push(order);

      // Track spend for non-cancelled orders
      if (order.status !== 'cancelled') {
        cust.totalSpend += parseFloat(order.total_amount) || 0;
      }

      // Track order dates
      const orderDate = new Date(order.created_at || Date.now());
      if (!cust.firstOrderDate || new Date(cust.firstOrderDate) > orderDate) {
        cust.firstOrderDate = order.created_at;
      }
      if (new Date(cust.lastOrderDate) <= orderDate) {
        cust.lastOrderDate = order.created_at;
        if (!cust.isAppRegistered) {
          cust.address = order.shipping_address || cust.address;
          cust.city = order.city_province || cust.city;
        }
      }
    });

    return Object.values(customerMap).map(c => {
      const tier = getCustomerTier(c.totalSpend, c.orderCount, c.wallet_balance, c.custom_tier);
      const avgOrderValue = c.orderCount > 0 ? (c.totalSpend / c.orderCount) : 0;
      
      // Calculate days since last active
      const lastDate = new Date(c.last_active_at || c.lastOrderDate);
      const now = new Date();
      const diffTime = Math.abs(now - lastDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      return {
        ...c,
        tier,
        avgOrderValue,
        diffDays,
        diffMinutes,
        avatarChar: (c.name || 'C').charAt(0).toUpperCase()
      };
    });
  }, [orders, registeredCustomers, customerProfile, lang]);

  // 3. Compute CRM KPI Summaries
  const kpis = useMemo(() => {
    const totalCustomers = customerList.length;
    if (totalCustomers === 0) {
      return {
        totalCustomers: 0,
        onlineCount: 0,
        vipCount: 0,
        vipPct: 0,
        repeatRate: 0,
        avgLtv: 0,
        totalRevenue: 0
      };
    }

    const onlineCount = customerList.filter(c => c.is_online).length;
    const vipCount = customerList.filter(c => c.tier.id === 'vip' || c.tier.id === 'silver').length;
    const repeatCount = customerList.filter(c => c.orderCount > 1).length;
    const totalRevenue = customerList.reduce((acc, c) => acc + c.totalSpend, 0);
    const avgLtv = totalRevenue / totalCustomers;
    const repeatRate = Math.round((repeatCount / totalCustomers) * 100);
    const vipPct = Math.round((vipCount / totalCustomers) * 100);

    return {
      totalCustomers,
      onlineCount,
      vipCount,
      vipPct,
      repeatRate,
      avgLtv,
      totalRevenue
    };
  }, [customerList]);

  // 4. Filter & Search & Sort Customers
  const filteredCustomers = useMemo(() => {
    let result = [...customerList];

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (c.id && c.id.toLowerCase().includes(q))
      );
    }

    // Tier / Status Filter
    if (selectedTier === 'online') {
      result = result.filter(c => c.is_online);
    } else if (selectedTier !== 'all') {
      result = result.filter(c => c.tier && c.tier.id === selectedTier);
    }

    // Location Filter
    if (selectedLocation !== 'all') {
      result = result.filter(c => (c.city || '').toLowerCase().includes(selectedLocation.toLowerCase()));
    }

    // Sort Logic
    result.sort((a, b) => {
      if (sortBy === 'totalSpend_desc') return b.totalSpend - a.totalSpend;
      if (sortBy === 'totalSpend_asc') return a.totalSpend - b.totalSpend;
      if (sortBy === 'orders_desc') return b.orderCount - a.orderCount;
      if (sortBy === 'wallet_desc') return b.wallet_balance - a.wallet_balance;
      if (sortBy === 'recent_desc') return new Date(b.last_active_at) - new Date(a.last_active_at);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [customerList, searchTerm, selectedTier, selectedLocation, sortBy]);

  // 5. Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper date & time formatters
  const formatDateStr = (dateIso) => {
    if (!dateIso) return 'N/A';
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTimeStr = (dateIso) => {
    if (!dateIso) return 'N/A';
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString(lang === 'km' ? 'km-KH' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastActive = (customer) => {
    if (customer.is_online) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{lang === 'km' ? '🟢 Online (កំពុងប្រើ)' : '🟢 Active Online'}</span>
        </span>
      );
    }
    if (customer.diffMinutes < 60) {
      return (
        <span className="text-[10px] text-slate-500 font-medium">
          {lang === 'km' ? `${customer.diffMinutes} នាទីមុន` : `${customer.diffMinutes}m ago`}
        </span>
      );
    }
    if (customer.diffDays === 0) return <span className="text-[10px] text-slate-500 font-medium">{lang === 'km' ? 'ថ្ងៃនេះ (Today)' : 'Today'}</span>;
    if (customer.diffDays === 1) return <span className="text-[10px] text-slate-500 font-medium">{lang === 'km' ? 'ម្សិលមិញ' : 'Yesterday'}</span>;
    if (customer.diffDays < 30) return <span className="text-[10px] text-slate-500 font-medium">{lang === 'km' ? `${customer.diffDays} ថ្ងៃមុន` : `${customer.diffDays}d ago`}</span>;
    const months = Math.floor(customer.diffDays / 30);
    return <span className="text-[10px] text-slate-500 font-medium">{lang === 'km' ? `${months} ខែមុន` : `${months}mo ago`}</span>;
  };

  // Filter customer specific wallet transactions
  const customerWalletTx = useMemo(() => {
    if (!selectedCustomer) return [];
    const phone = selectedCustomer.phone;
    const name = selectedCustomer.name;
    return walletTransactions.filter(tx => 
      (phone && tx.customerPhone && tx.customerPhone === phone) ||
      (name && tx.customerName && tx.customerName.toLowerCase() === name.toLowerCase())
    );
  }, [selectedCustomer, walletTransactions]);

  // Frequently purchased items for selected customer
  const favoriteProducts = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.ordersList) return [];
    const itemMap = {};
    selectedCustomer.ordersList.forEach(ord => {
      (ord.order_items || []).forEach(item => {
        const pId = item.product_id || item.product_name;
        if (!itemMap[pId]) {
          itemMap[pId] = {
            id: pId,
            name: item.product_name || item.title || 'Product',
            image: item.product_image || item.image || '',
            count: 0,
            totalSpend: 0
          };
        }
        itemMap[pId].count += item.quantity || 1;
        itemMap[pId].totalSpend += parseFloat(item.total_price || (item.unit_price * (item.quantity || 1))) || 0;
      });
    });
    return Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 4);
  }, [selectedCustomer]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ============================================================== */}
      {/* 1. HEADER TITLE & QUICK ACTIONS                                */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>{lang === 'km' ? 'បញ្ជីអតិថិជន & ការវិភាគទិញ (Customer CRM & Insights)' : 'Customer Directory & Purchasing Insights'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'km' ? 'តាមដានស្ថានភាព Online/Active, កំណត់កម្រិត VIP/Silver, ដក/បញ្ចូល Wallet និងព័ត៌មានលម្អិត' : 'Track live online accounts, manage VIP/Silver tiers, deposit/withdraw wallet, and 360° tracking'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {kpis.onlineCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center space-x-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{kpis.onlineCount} {lang === 'km' ? 'កំពុង Online' : 'Online Now'}</span>
            </span>
          )}
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{customerList.length} {lang === 'km' ? 'អតិថិជនសរុប' : 'Total Registered'}</span>
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. 4-KPI PURCHASING INSIGHTS CARDS                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Customers & Online Live Badge */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {lang === 'km' ? '👥 អតិថិជនសរុប' : 'Total Customers'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono flex items-baseline space-x-2">
              <span>{kpis.totalCustomers}</span>
              {kpis.onlineCount > 0 && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ({kpis.onlineCount} online)
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 mt-0.5">
              <Activity className="w-3 h-3" />
              <span>{lang === 'km' ? 'គណនី Active & Orders' : 'Active Members & Orders'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: VIP & Silver Customers */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
              {lang === 'km' ? '👑 សមាជិក VIP & Silver' : 'VIP & Silver Members'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-300 font-mono">
              {kpis.vipCount} <span className="text-xs font-bold text-amber-600">({kpis.vipPct}%)</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'km' ? 'ទិញចាប់ពី $35 ឬ ២ ដងឡើង' : 'Spent >$35 or >=2 orders'}
            </div>
          </div>
        </div>

        {/* Card 3: Repeat Customer Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {lang === 'km' ? '🔄 អត្រាត្រឡប់មកទិញវិញ' : 'Repeat Buyer Rate'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
              {kpis.repeatRate}%
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
              {lang === 'km' ? 'អតិថិជនទិញចាប់ពី ២ ដង' : 'Customers with >=2 orders'}
            </div>
          </div>
        </div>

        {/* Card 4: Average Spend per Customer (AOV / LTV) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {lang === 'km' ? '💰 ចំណាយមធ្យមម្នាក់ (LTV)' : 'Average Spent (LTV)'}
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
              ${kpis.avgLtv.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ≈ {Math.round(kpis.avgLtv * exchangeRate).toLocaleString()} ៛ / {lang === 'km' ? 'ម្នាក់' : 'shopper'}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FILTER, SEARCH & SORT TOOLBAR                               */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Status / Tier Tabs (All / Online / VIP / Silver / Regular) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label_kh: 'ទាំងអស់', label_en: 'All Customers', count: customerList.length },
            { id: 'online', label_kh: '🟢 Online (កំពុងប្រើ)', label_en: '🟢 Active Online', count: customerList.filter(c => c.is_online).length },
            { id: 'vip', label_kh: '👑 VIP Gold', label_en: '👑 VIP Gold', count: customerList.filter(c => c.tier.id === 'vip').length },
            { id: 'silver', label_kh: '🥈 Silver', label_en: '🥈 Silver', count: customerList.filter(c => c.tier.id === 'silver').length },
            { id: 'regular', label_kh: '🥉 ទូទៅ (Regular)', label_en: '🥉 Regular', count: customerList.filter(c => c.tier.id === 'regular').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTier(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center space-x-1.5 cursor-pointer ${
                selectedTier === tab.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{lang === 'km' ? tab.label_kh : tab.label_en}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTier === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Location, and Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={lang === 'km' ? 'ស្វែងរកតាម ឈ្មោះ, លេខទូរស័ព្ទ, ទីតាំង, Account ID...' : 'Search by name, phone, city, account ID...'}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">{lang === 'km' ? '📍 គ្រប់ទីតាំង (All Locations)' : '📍 All Locations'}</option>
              <option value="Phnom Penh">{lang === 'km' ? 'រាជធានីភ្នំពេញ (Phnom Penh)' : 'Phnom Penh'}</option>
              <option value="Siem Reap">{lang === 'km' ? 'ខេត្តសៀមរាប (Siem Reap)' : 'Siem Reap'}</option>
              <option value="Battambang">{lang === 'km' ? 'ខេត្តបាត់ដំបង (Battambang)' : 'Battambang'}</option>
              <option value="Kandal">{lang === 'km' ? 'ខេត្តកណ្តាល (Kandal)' : 'Kandal'}</option>
              <option value="Kampot">{lang === 'km' ? 'ខេត្តកំពត (Kampot)' : 'Kampot'}</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="totalSpend_desc">{lang === 'km' ? '💎 ទិញច្រើនជាងគេ (Top Spenders)' : '💎 Top Spenders'}</option>
              <option value="orders_desc">{lang === 'km' ? '📦 ចំនួន Order ច្រើនជាងគេ (Most Orders)' : '📦 Most Orders'}</option>
              <option value="wallet_desc">{lang === 'km' ? '💳 សមតុល្យ Wallet ច្រើនជាងគេ' : '💳 Highest Wallet'}</option>
              <option value="recent_desc">{lang === 'km' ? '🕒 សកម្មភាពថ្មីៗ (Recently Active)' : '🕒 Recently Active'}</option>
              <option value="name_asc">{lang === 'km' ? '🔤 ឈ្មោះ (A-Z)' : '🔤 Name (A-Z)'}</option>
              <option value="totalSpend_asc">{lang === 'km' ? '💵 ចំណាយទាបទៅខ្ពស់' : '💵 Lowest Spent'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. CUSTOMER DIRECTORY LIST (MOBILE CARDS & DESKTOP TABLE)      */}
      {/* ============================================================== */}
      
      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center text-slate-400 border border-slate-200 dark:border-slate-800">
            {lang === 'km' ? 'មិនមានអតិថិជនដែលត្រូវនឹងការស្វែងរក' : 'No customers found'}
          </div>
        ) : (
          paginatedCustomers.map((c) => {
            const TierIcon = c.tier.icon;
            return (
              <div 
                key={c.id} 
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                {/* Row 1: Avatar with Live Online Dot, Name, Tier Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800 flex-shrink-0 overflow-hidden shadow-xs">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          c.avatarChar
                        )}
                      </div>
                      {/* Active Online Pulse Dot */}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        c.is_online ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30' : 'bg-slate-300 dark:bg-slate-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white">
                          {c.name}
                        </h3>
                        {c.isAppRegistered && (
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                            App
                          </span>
                        )}
                        {c.is_online ? (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            <span>Online</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400">
                            {formatLastActive(c)}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {c.phone}
                      </span>
                    </div>
                  </div>

                  {/* Tier Badge with quick edit */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(c);
                      setActiveTrackingTab('overview');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center space-x-1 ${c.tier.badgeClass}`}
                  >
                    <TierIcon className="w-3 h-3" />
                    <span>{lang === 'km' ? c.tier.short_kh : c.tier.short_en}</span>
                  </button>
                </div>

                {/* Row 2: Spend & Orders stats & Wallet */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'km' ? 'កាបូប Wallet' : 'Wallet'}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ${(c.wallet_balance !== undefined ? c.wallet_balance : 15.0).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'km' ? 'ចំណាយសរុប' : 'Total Spent'}
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono">
                      ${c.totalSpend.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {lang === 'km' ? 'ចំនួន Orders' : 'Orders'}
                    </span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {c.orderCount}
                    </span>
                  </div>
                </div>

                {/* Row 3: Location & Register Date */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1 truncate max-w-[60%]">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{c.city} - {c.address}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lang === 'km' ? 'ចុះឈ្មោះ៖ ' : 'Reg: '}{formatDateStr(c.registeredAt)}
                  </span>
                </div>

                {/* Row 4: Wallet Deposit & Withdraw Action + Tracking View */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1.5">
                    {/* Wallet Management Button (Deposit / Withdraw) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWalletModalCustomer(c);
                        setWalletModalTab('topup');
                        setWalletAmount('');
                        setWalletNote('');
                        setWalletMethod('cash');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-2xs transition cursor-pointer"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{lang === 'km' ? 'បញ្ចូល/ដកលុយ' : 'Wallet ±'}</span>
                    </button>

                    {/* Reset Password Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetPassCustomer(c);
                        setAdminNewPass('1234');
                        setShowAdminPass(false);
                        setIsCopiedPass(false);
                      }}
                      className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center transition cursor-pointer"
                      title={lang === 'km' ? 'Reset លេខសម្ងាត់ Password' : 'Reset Password'}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {c.phone && c.phone !== 'N/A' && (
                      <>
                        <a
                          href={`tel:${c.phone}`}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold flex items-center"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://t.me/+855${c.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center"
                          title="Telegram"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerNoteText(c.notes || '');
                      setActiveTrackingTab('overview');
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{lang === 'km' ? 'តាមដាន (Track)' : 'Tracking'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-4 px-4 font-bold">
                  {lang === 'km' ? 'អតិថិជន & ស្ថានភាព (Customer / Status)' : 'Customer & Status'}
                </th>
                <th className="py-4 px-4 font-bold">
                  {lang === 'km' ? 'លេខទូរស័ព្ទ (Phone)' : 'Phone Number'}
                </th>
                <th className="py-4 px-4 font-bold">
                  {lang === 'km' ? 'ទីតាំង & ថ្ងៃចុះឈ្មោះ (Location / Reg)' : 'Location / Reg Date'}
                </th>
                <th className="py-4 px-4 font-bold text-center">
                  {lang === 'km' ? 'ការបញ្ជាទិញ (Orders)' : 'Orders'}
                </th>
                <th className="py-4 px-4 font-bold text-right">
                  {lang === 'km' ? 'ចំណាយសរុប (Total Spent)' : 'Total Spent'}
                </th>
                <th className="py-4 px-4 font-bold text-center">
                  {lang === 'km' ? 'កាបូប Wallet' : 'Wallet Balance'}
                </th>
                <th className="py-4 px-4 font-bold text-center">
                  {lang === 'km' ? 'កម្រិត (Tier)' : 'Loyalty Tier'}
                </th>
                <th className="py-4 px-4 font-bold text-right">
                  {lang === 'km' ? 'សកម្មភាព (Actions)' : 'Actions'}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    {lang === 'km' ? 'មិនមានអតិថិជនដែលត្រូវនឹងការស្វែងរក' : 'No customers match your search filters.'}
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c) => {
                  const TierIcon = c.tier.icon;
                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerNoteText(c.notes || '');
                        setActiveTrackingTab('overview');
                      }}
                    >
                      {/* Customer Name, Avatar with Online Dot */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs border border-indigo-200 dark:border-indigo-800 flex-shrink-0 overflow-hidden shadow-xs">
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                              ) : (
                                c.avatarChar
                              )}
                            </div>
                            {/* Live Online Badge */}
                            <span 
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                c.is_online ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30' : 'bg-slate-300 dark:bg-slate-600'
                              }`} 
                              title={c.is_online ? 'Online (Active Now)' : `Last active: ${formatDateStr(c.last_active_at)}`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold block text-slate-900 dark:text-white">
                                {c.name}
                              </span>
                              {c.isAppRegistered && (
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                  App
                                </span>
                              )}
                              {c.is_online ? (
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-normal">
                                  {formatLastActive(c)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {c.id.substring(0, 14)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone with Quick Contact Icon */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <span>{c.phone}</span>
                          {c.phone && c.phone !== 'N/A' && (
                            <a 
                              href={`tel:${c.phone}`} 
                              title="Call Customer" 
                              className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded-md"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Location & Registration Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{c.city}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          📅 Reg: {formatDateStr(c.registeredAt)}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
                          {c.orderCount}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                          ${c.totalSpend.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ≈ {Math.round(c.totalSpend * exchangeRate).toLocaleString()} ៛
                        </div>
                      </td>

                      {/* Wallet Balance */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-block">
                          ${(c.wallet_balance !== undefined ? c.wallet_balance : 15.0).toFixed(2)}
                        </div>
                      </td>

                      {/* Tier Badge with manual tier selector */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block group">
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-xl text-[10px] inline-flex items-center space-x-1 ${c.tier.badgeClass} cursor-pointer`}
                            title={lang === 'km' ? 'ចុចដើម្បីប្តូរកម្រិត VIP / Silver / Member' : 'Click to change customer tier'}
                          >
                            <TierIcon className="w-3 h-3" />
                            <span>{lang === 'km' ? c.tier.short_kh : c.tier.short_en}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-70 ml-0.5" />
                          </button>

                          {/* Quick Tier Dropdown */}
                          <div className="hidden group-hover:block group-focus-within:block absolute left-1/2 -translate-x-1/2 top-full mt-1 w-44 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 text-left">
                            <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {lang === 'km' ? 'កំណត់កម្រិតភ្ញៀវ (Tier)' : 'Assign Tier'}
                            </div>
                            {[
                              { id: 'vip', name_km: '👑 VIP Gold', name_en: 'VIP Gold' },
                              { id: 'silver', name_km: '🥈 Silver Member', name_en: 'Silver Member' },
                              { id: 'regular', name_km: '🥉 សមាជិកទូទៅ (Regular)', name_en: 'Regular Member' },
                              { id: 'auto', name_km: '⚙️ គណនាស្វ័យប្រវត្ត (Auto)', name_en: 'Auto Calculate' }
                            ].map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => adminSetCustomerTier(c.id || c.phone, item.id)}
                                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between ${
                                  (c.custom_tier === item.id || (!c.custom_tier && item.id === 'auto')) ? 'font-black text-emerald-600' : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span>{lang === 'km' ? item.name_km : item.name_en}</span>
                                {(c.custom_tier === item.id || (!c.custom_tier && item.id === 'auto')) && (
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Actions (Wallet Top Up / Withdraw & 360 Tracking) */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Wallet Deposit & Withdraw Button */}
                          <button
                            onClick={() => {
                              setWalletModalCustomer(c);
                              setWalletModalTab('topup');
                              setWalletAmount('');
                              setWalletNote('');
                              setWalletMethod('cash');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
                            title="Deposit or Withdraw Customer Wallet"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>{lang === 'km' ? 'បញ្ចូល/ដកលុយ' : 'Wallet ±'}</span>
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResetPassCustomer(c);
                              setAdminNewPass('1234');
                              setShowAdminPass(false);
                              setIsCopiedPass(false);
                            }}
                            className="p-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center transition cursor-pointer"
                            title={lang === 'km' ? 'Reset លេខសម្ងាត់ Password' : 'Reset Password'}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Tracking Detail View Button */}
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerNoteText(c.notes || '');
                              setActiveTrackingTab('overview');
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition shadow-xs cursor-pointer"
                            title="Track Customer Account 360°"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{lang === 'km' ? 'តាមដាន' : 'Track'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. PAGINATION & TOTAL COUNT FOOTER                             */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 dark:text-slate-400 font-medium">
          {lang === 'km' 
            ? `បង្ហាញ ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredCustomers.length)} នៃ ${filteredCustomers.length} អតិថិជន` 
            : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of ${filteredCustomers.length} customers`}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  currentPage === page
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. ENTERPRISE CUSTOMER 360° TRACKING MODAL                     */}
      {/* ============================================================== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-scale-up">
            
            {/* Modal Header: Avatar, Name, Online Status, Account ID, Tier Switcher */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-slate-50 via-indigo-50/30 to-emerald-50/30 dark:from-slate-850 dark:via-slate-850 dark:to-slate-800">
              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-indigo-600/30 overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 flex-shrink-0">
                    {selectedCustomer.avatar ? (
                      <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                    ) : (
                      selectedCustomer.avatarChar
                    )}
                  </div>
                  <span 
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                      selectedCustomer.is_online ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30' : 'bg-slate-400'
                    }`} 
                    title={selectedCustomer.is_online ? 'Online (Active)' : 'Offline'}
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {selectedCustomer.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black inline-flex items-center space-x-1 ${selectedCustomer.tier.badgeClass}`}>
                      <span>{lang === 'km' ? selectedCustomer.tier.name_kh : selectedCustomer.tier.name_en}</span>
                    </span>
                    {selectedCustomer.is_online ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>{lang === 'km' ? '🟢 Online (សកម្ម)' : '🟢 Online'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {lang === 'km' ? '⚪ Offline (ក្រៅបណ្ដាញ)' : '⚪ Offline'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedCustomer.phone}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">ID: {selectedCustomer.id}</span>
                    <span>•</span>
                    <span>{selectedCustomer.city}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs (Overview / Orders / Wallet Ledger / Device Tracking) */}
            <div className="flex items-center space-x-1 px-5 pt-3 bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
              {[
                { id: 'overview', label_kh: '📊 ទិដ្ឋភាព & ស្ថិតិ', label_en: '📊 Overview & Stats' },
                { id: 'orders', label_kh: `📦 ប្រវត្តិទិញ (${selectedCustomer.ordersList.length})`, label_en: `📦 Orders (${selectedCustomer.ordersList.length})` },
                { id: 'wallet', label_kh: `💳 ប្រវត្តិ Wallet (${customerWalletTx.length})`, label_en: `💳 Wallet Ledger (${customerWalletTx.length})` },
                { id: 'tracking', label_kh: '📝 កំណត់ចំណាំ & Tracking', label_en: '📝 Notes & Tracking' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTrackingTab(tab.id)}
                  className={`px-3.5 py-2 rounded-t-xl text-xs font-black transition border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTrackingTab === tab.id
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {lang === 'km' ? tab.label_kh : tab.label_en}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 max-h-[calc(92vh-180px)]">
              
              {/* TAB 1: OVERVIEW & CRM STATS */}
              {activeTrackingTab === 'overview' && (
                <div className="space-y-4">
                  {/* Customer V8 Wallet Card with Both Top Up and Withdraw triggers */}
                  <div className="p-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl text-white shadow-md shadow-emerald-900/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                        <Wallet className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <span className="text-[11px] text-emerald-200 font-bold block uppercase tracking-wider">
                          {lang === 'km' ? 'សមតុល្យកាបូបលុយ V8 Wallet' : 'Customer V8 Wallet Balance'}
                        </span>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-black font-mono">
                            ${(selectedCustomer.wallet_balance !== undefined ? selectedCustomer.wallet_balance : 15.0).toFixed(2)}
                          </span>
                          <span className="text-xs text-emerald-200 font-normal font-mono">
                            ≈ {Math.round((selectedCustomer.wallet_balance !== undefined ? selectedCustomer.wallet_balance : 15.0) * exchangeRate).toLocaleString()} ៛
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setWalletModalCustomer(selectedCustomer);
                          setWalletModalTab('topup');
                          setWalletAmount('');
                          setWalletNote('');
                          setWalletMethod('cash');
                        }}
                        className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-900 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-700" />
                        <span>{lang === 'km' ? 'បញ្ចូលលុយ' : 'Top Up'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setWalletModalCustomer(selectedCustomer);
                          setWalletModalTab('withdraw');
                          setWalletAmount('');
                          setWalletNote('');
                          setWalletMethod('cash');
                        }}
                        className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-950 border border-emerald-600/40 active:scale-95 text-white rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm transition cursor-pointer"
                      >
                        <MinusCircle className="w-4 h-4 text-rose-400" />
                        <span>{lang === 'km' ? 'ដកប្រាក់' : 'Withdraw'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tier Override & Management Bar */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {lang === 'km' ? 'កម្រិតសមាជិកភាព Loyalty Tier' : 'Loyalty Tier Level'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {selectedCustomer.custom_tier ? (lang === 'km' ? 'កំណត់ដោយ Admin (Manual)' : 'Admin Override') : (lang === 'km' ? 'គណនាស្វ័យប្រវត្តតាមការទិញ' : 'Auto based on spend')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap">
                      {[
                        { id: 'vip', name: '👑 VIP Gold' },
                        { id: 'silver', name: '🥈 Silver' },
                        { id: 'regular', name: '🥉 ទូទៅ' },
                        { id: 'auto', name: '⚙️ Auto' }
                      ].map(tItem => (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => {
                            adminSetCustomerTier(selectedCustomer.id || selectedCustomer.phone, tItem.id);
                            setSelectedCustomer(prev => ({
                              ...prev,
                              custom_tier: tItem.id === 'auto' ? null : tItem.id,
                              tier: getCustomerTier(prev.totalSpend, prev.orderCount, prev.wallet_balance, tItem.id === 'auto' ? null : tItem.id)
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            (selectedCustomer.custom_tier === tItem.id || (!selectedCustomer.custom_tier && tItem.id === 'auto'))
                              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {tItem.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3 Metrics Overview Cards */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">
                        {lang === 'km' ? 'ចំណាយសរុប (LTV)' : 'Lifetime Spend'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ${selectedCustomer.totalSpend.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        ≈ {Math.round(selectedCustomer.totalSpend * exchangeRate).toLocaleString()} ៛
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">
                        {lang === 'km' ? 'ចំនួន Orders' : 'Total Orders'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                        {selectedCustomer.orderCount}
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        {selectedCustomer.orderCount > 1 ? (lang === 'km' ? 'អតិថិជនត្រឡប់' : 'Repeat Buyer') : (lang === 'km' ? 'ទិញលើកទី១' : 'First Order')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">
                        {lang === 'km' ? 'មធ្យម/Order (AOV)' : 'Avg Order Value'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        ${selectedCustomer.avgOrderValue.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        ≈ {Math.round(selectedCustomer.avgOrderValue * exchangeRate).toLocaleString()} ៛
                      </span>
                    </div>
                  </div>

                  {/* Customer Tracking Details (Registration Date, Last Active, Device, Address) */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'km' ? 'ព័ត៌មានគណនី & កាលបរិច្ឆេទចុះឈ្មោះ (Tracking Information)' : 'Account & Registration Tracking'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span>{lang === 'km' ? 'កាលបរិច្ឆេទចុះឈ្មោះ (Register Date)' : 'Registration Date'}</span>
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {formatDateTimeStr(selectedCustomer.registeredAt)}
                        </p>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                          <Activity className="w-3 h-3 text-emerald-500" />
                          <span>{lang === 'km' ? 'សកម្មភាពចុងក្រោយ (Last Active)' : 'Last Activity'}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {formatDateTimeStr(selectedCustomer.last_active_at)}
                          </p>
                          {formatLastActive(selectedCustomer)}
                        </div>
                      </div>
                    </div>

                    {/* Address & Google Maps GPS */}
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{lang === 'km' ? 'អាសយដ្ឋានដឹកជញ្ជូន (Delivery Address)' : 'Delivery Address'}</span>
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {selectedCustomer.address} ({selectedCustomer.city})
                      </p>
                      {selectedCustomer.googleMapsUrl && (
                        <a 
                          href={selectedCustomer.googleMapsUrl}
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800"
                        >
                          <Navigation className="w-3 h-3 text-emerald-600" />
                          <span>{lang === 'km' ? '📍 បើកមើលផែនទី GPS (Google Maps)' : '📍 Open in Google Maps'}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}
                    </div>

                    {/* Account Security & Reset Password Box */}
                    <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                            {lang === 'km' ? 'សុវត្ថិភាពគណនី (Account Security)' : 'Account Security & Password'}
                          </span>
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            {lang === 'km' ? 'លេខសម្ងាត់ Password ត្រូវបានការពារ' : 'Password protected'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPassCustomer(selectedCustomer);
                          setAdminNewPass('1234');
                          setShowAdminPass(false);
                          setIsCopiedPass(false);
                        }}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>{lang === 'km' ? 'Reset Password' : 'Reset Password'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Top Favorite Purchased Items */}
                  {favoriteProducts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lang === 'km' ? 'ទំនិញដែលចូលចិត្តទិញញឹកញាប់ (Favorite Items)' : 'Frequently Purchased Items'}</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {favoriteProducts.map(fp => (
                          <div key={fp.id} className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block truncate" title={fp.name}>
                              {fp.name}
                            </span>
                            <div className="flex items-center justify-center space-x-1 text-[11px] text-indigo-600 font-mono font-bold">
                              <span>ទិញ {fp.count} ដង</span>
                              <span>(${fp.totalSpend.toFixed(2)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Contact Bar */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 flex items-center justify-center space-x-1.5 font-black text-xs transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'km' ? '📞 ខលផ្ទាល់ (Call)' : '📞 Call Now'}</span>
                    </a>

                    <a
                      href={`https://t.me/+855${selectedCustomer.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-100 flex items-center justify-center space-x-1.5 font-black text-xs transition"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>{lang === 'km' ? '💬 Telegram' : '💬 Telegram'}</span>
                    </a>

                    <a
                      href={`sms:${selectedCustomer.phone}`}
                      className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-100 flex items-center justify-center space-x-1.5 font-black text-xs transition"
                    >
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>{lang === 'km' ? '✉️ ផ្ញើ SMS' : '✉️ Send SMS'}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDER HISTORY */}
              {activeTrackingTab === 'orders' && (
                <div className="space-y-3">
                  {selectedCustomer.ordersList.length === 0 ? (
                    <div className="p-8 bg-slate-50 dark:bg-slate-850 rounded-2xl text-center text-slate-400 text-xs">
                      {lang === 'km' ? 'មិនទាន់មានប្រវត្តិបញ្ជាទិញនៅឡើយទេ' : 'No order history found for this customer.'}
                    </div>
                  ) : (
                    selectedCustomer.ordersList.map(order => (
                      <div 
                        key={order.id} 
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{order.id}</span>
                            <span className="text-[10px] text-slate-400">{formatDateTimeStr(order.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {order.status}
                            </span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                              ${(order.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Items Preview */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                            {order.order_items.map((item, itIdx) => (
                              <div key={itIdx} className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                                <span className="truncate max-w-[70%]">{item.product_name} x {item.quantity}</span>
                                <span className="font-mono text-slate-500">${(item.total_price || 0).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: WALLET LEDGER */}
              {activeTrackingTab === 'wallet' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                        {lang === 'km' ? 'សមតុល្យបច្ចុប្បន្ន' : 'Current Balance'}
                      </span>
                      <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                        ${(selectedCustomer.wallet_balance !== undefined ? selectedCustomer.wallet_balance : 15.0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => {
                          setWalletModalCustomer(selectedCustomer);
                          setWalletModalTab('topup');
                          setWalletAmount('');
                          setWalletNote('');
                          setWalletMethod('cash');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center space-x-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'បញ្ចូលលុយ' : 'Top Up'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setWalletModalCustomer(selectedCustomer);
                          setWalletModalTab('withdraw');
                          setWalletAmount('');
                          setWalletNote('');
                          setWalletMethod('cash');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center space-x-1"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'ដកប្រាក់' : 'Withdraw'}</span>
                      </button>
                    </div>
                  </div>

                  {customerWalletTx.length === 0 ? (
                    <div className="p-8 bg-slate-50 dark:bg-slate-850 rounded-2xl text-center text-slate-400 text-xs">
                      {lang === 'km' ? 'មិនទាន់មានប្រតិបត្តិការ Wallet សម្រាប់អតិថិជននេះទេ' : 'No wallet transactions recorded yet.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerWalletTx.map(tx => (
                        <div 
                          key={tx.id} 
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              tx.direction === 'credit' 
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' 
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700'
                            }`}>
                              {tx.direction === 'credit' ? '+' : '-'}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {lang === 'km' ? tx.titleKh : tx.titleEn}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDateTimeStr(tx.date)} {tx.description && `• ${tx.description}`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span className={`font-black text-xs block ${
                              tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {tx.direction === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Bal: ${tx.balanceAfter.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: NOTES & DEVICE TRACKING */}
              {activeTrackingTab === 'tracking' && (
                <div className="space-y-4 text-xs">
                  {/* Device & Connection Details */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span>{lang === 'km' ? 'ព័ត៌មានឧបករណ៍ & បណ្ដាញ (Device & Network Tracking)' : 'Device & Platform Tracking'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'km' ? 'ឧបករណ៍ប្រើប្រាស់ (Device)' : 'Device Model'}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedCustomer.login_device}</span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{lang === 'km' ? 'អាសយដ្ឋាន IP & តំបន់' : 'IP & Region'}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedCustomer.login_ip}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Internal CRM Notes */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>{lang === 'km' ? 'កំណត់ចំណាំខាងក្នុង (Admin Internal Notes)' : 'Internal Notes'}</span>
                    </h4>
                    <textarea
                      rows="3"
                      value={customerNoteText}
                      onChange={(e) => setCustomerNoteText(e.target.value)}
                      placeholder={lang === 'km' ? 'បញ្ចូលកំណត់ចំណាំអំពីភ្ញៀវនេះ (ឧទាហរណ៍៖ ចំណូលចិត្តទំនិញ, សេវាដឹកជញ្ជូន, អតិថិជនពិសេស...)' : 'Write internal admin remarks for this customer...'}
                      className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => adminUpdateCustomerNotes(selectedCustomer.id || selectedCustomer.phone, customerNoteText)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-2xs transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'រក្សាទុកកំណត់ចំណាំ' : 'Save Note'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {lang === 'km' ? 'V8 Mini Mart Enterprise CRM' : 'V8 CRM System'}
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {lang === 'km' ? 'បិទផ្ទាំង' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. ADMIN WALLET DEPOSIT & WITHDRAW MODAL (បញ្ចូល & ដកប្រាក់)    */}
      {/* ============================================================== */}
      {walletModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            
            {/* Header with Top Up & Withdraw Mode Switcher */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-850">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                    walletModalTab === 'topup' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {walletModalTab === 'topup' 
                        ? (lang === 'km' ? 'បញ្ចូលទឹកប្រាក់ (Top Up Wallet)' : 'Deposit Wallet Credit') 
                        : (lang === 'km' ? 'ដកទឹកប្រាក់ (Withdraw Credit)' : 'Withdraw Wallet Credit')}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'km' ? 'គ្រប់គ្រងសមតុល្យកាបូបលុយអតិថិជន' : 'Admin Wallet Management'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setWalletModalCustomer(null)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-2xs transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2 Tabs: Top Up vs Withdraw */}
              <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setWalletModalTab('topup');
                    setWalletAmount('');
                    setWalletMethod('cash');
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    walletModalTab === 'topup'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? '📥 បញ្ចូលលុយ (Deposit)' : '📥 Deposit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWalletModalTab('withdraw');
                    setWalletAmount('');
                    setWalletMethod('cash');
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    walletModalTab === 'withdraw'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? '📤 ដកប្រាក់ (Withdraw)' : '📤 Withdraw'}</span>
                </button>
              </div>
            </div>

            {/* Content Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(walletAmount);
                if (!amt || amt <= 0) return;

                if (walletModalTab === 'topup') {
                  adminTopUpCustomerWallet(walletModalCustomer.id || walletModalCustomer.phone, amt, walletMethod, walletNote);
                  try {
                    confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
                  } catch (err) { console.error(err); }
                } else {
                  // Withdraw logic
                  const res = adminWithdrawCustomerWallet(walletModalCustomer.id || walletModalCustomer.phone, amt, walletMethod, walletNote);
                  if (!res.success) return;
                }

                setWalletModalCustomer(null);
              }} 
              className="p-5 space-y-4 text-xs"
            >
              {/* Customer Info Pill & Current Balance */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
                    {walletModalCustomer.avatarChar || 'C'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{walletModalCustomer.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">{walletModalCustomer.phone}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">{lang === 'km' ? 'សមតុល្យបច្ចុប្បន្ន' : 'Current Balance'}</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    ${(walletModalCustomer.wallet_balance !== undefined ? walletModalCustomer.wallet_balance : 15.0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {walletModalTab === 'topup' 
                    ? (lang === 'km' ? 'ចំនួនទឹកប្រាក់ត្រូវបញ្ចូល ($ USD) *' : 'Amount to Top Up ($ USD) *')
                    : (lang === 'km' ? 'ចំនួនទឹកប្រាក់ត្រូវដកចេញ ($ USD) *' : 'Amount to Withdraw ($ USD) *')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                    $
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    max={walletModalTab === 'withdraw' ? (walletModalCustomer.wallet_balance || 0) : undefined}
                    required
                    placeholder="0.00"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="w-full pl-8 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-black text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    USD
                  </div>
                </div>
                {walletAmount && parseFloat(walletAmount) > 0 && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    ≈ {Math.round(parseFloat(walletAmount) * exchangeRate).toLocaleString()} ៛ (KHR)
                  </p>
                )}
                {walletModalTab === 'withdraw' && parseFloat(walletAmount) > (walletModalCustomer.wallet_balance || 0) && (
                  <p className="text-[11px] text-rose-600 font-bold">
                    {lang === 'km' ? '⚠️ មិនអាចដកលើសសមតុល្យដែលមានបានទេ!' : '⚠️ Cannot exceed available balance!'}
                  </p>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {lang === 'km' ? 'ជ្រើសរើសទឹកប្រាក់លឿន (Quick Amount)' : 'Quick Presets'}
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {walletModalTab === 'topup' ? (
                    [5, 10, 20, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setWalletAmount(val.toString())}
                        className={`py-1.5 rounded-xl font-mono font-black text-xs border transition cursor-pointer ${
                          parseFloat(walletAmount) === val 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        +${val}
                      </button>
                    ))
                  ) : (
                    [
                      { label: '$5', val: 5 },
                      { label: '$10', val: 10 },
                      { label: '$20', val: 20 },
                      { label: '$50', val: 50 },
                      { label: 'All', val: walletModalCustomer.wallet_balance || 0 }
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setWalletAmount(item.val.toString())}
                        className={`py-1.5 rounded-xl font-mono font-black text-xs border transition cursor-pointer ${
                          parseFloat(walletAmount) === item.val 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Payment Channel / Withdrawal Reason */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {walletModalTab === 'topup'
                    ? (lang === 'km' ? 'ប្រភពទទួលប្រាក់ (Top Up Channel)' : 'Deposit Channel')
                    : (lang === 'km' ? 'វិធីសាស្ត្រដកប្រាក់ / មូលហេតុ (Withdrawal Reason)' : 'Withdrawal Method')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(walletModalTab === 'topup' ? [
                    { id: 'cash', label_km: '💵 សាច់ប្រាក់', label_en: 'Cash', desc: 'Mart Counter' },
                    { id: 'aba', label_km: '📱 ABA / Bank', label_en: 'ABA KHQR', desc: 'Bank Transfer' },
                    { id: 'bonus', label_km: '🎁 ប្រាក់រង្វាន់', label_en: 'Bonus', desc: 'Promo Credit' }
                  ] : [
                    { id: 'cash', label_km: '💵 សាច់ប្រាក់សុទ្ធ', label_en: 'Cash Refund', desc: 'Mart Counter' },
                    { id: 'bank', label_km: '📱 ផ្ទេរទៅ ABA', label_en: 'Bank Transfer', desc: 'Bank Payout' },
                    { id: 'adjustment', label_km: '🔄 កែសម្រួល', label_en: 'Adjustment', desc: 'System Fix' }
                  ]).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setWalletMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        walletMethod === m.id
                          ? (walletModalTab === 'topup' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300 font-bold shadow-xs')
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="block font-bold text-xs">{lang === 'km' ? m.label_km : m.label_en}</span>
                      <span className="block text-[9px] opacity-70 mt-0.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Remarks */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'កំណត់សម្គាល់ (Optional Note)' : 'Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={walletModalTab === 'topup' 
                    ? (lang === 'km' ? 'ឧទាហរណ៍៖ ភ្ញៀវបង់លុយសុទ្ធនៅហាង...' : 'e.g., Paid cash at counter')
                    : (lang === 'km' ? 'ឧទាហរណ៍៖ សងប្រាក់វិញតាម ABA ឬដកប្រាក់សុទ្ធ...' : 'e.g., Cash refund or payout')}
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setWalletModalCustomer(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={
                    !walletAmount || 
                    parseFloat(walletAmount) <= 0 || 
                    (walletModalTab === 'withdraw' && parseFloat(walletAmount) > (walletModalCustomer.wallet_balance || 0))
                  }
                  className={`py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black shadow-md active:scale-95 transition flex items-center space-x-1.5 cursor-pointer ${
                    walletModalTab === 'topup' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {walletModalTab === 'topup' 
                      ? (lang === 'km' ? '✅ បញ្ចូលទឹកប្រាក់ឥឡូវនេះ' : 'Confirm Deposit')
                      : (lang === 'km' ? '📤 បញ្ជាក់ការដកប្រាក់' : 'Confirm Withdrawal')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. ADMIN RESET CUSTOMER PASSWORD MODAL                        */}
      {/* ============================================================== */}
      {resetPassCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'km' ? 'កំណត់លេខសម្ងាត់ Password ឡើងវិញ' : 'Reset Customer Password'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'km' ? 'Admin Password Recovery Control' : 'Admin Security Override'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetPassCustomer(null)}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-2xs transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!adminNewPass || adminNewPass.length < 4) {
                  showToast(lang === 'km' ? 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 4 ខ្ទង់!' : 'Password must be at least 4 chars!', 'error');
                  return;
                }
                adminResetCustomerPassword(resetPassCustomer.id || resetPassCustomer.phone, adminNewPass);
                try {
                  confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
                } catch (err) { console.error(err); }
                setResetPassCustomer(null);
              }} 
              className="p-5 space-y-4 text-xs"
            >
              {/* Customer Info Pill */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
                    {resetPassCustomer.avatarChar || 'C'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{resetPassCustomer.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">{resetPassCustomer.phone}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  ID: {resetPassCustomer.id.substring(0, 12)}
                </span>
              </div>

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'km' ? 'លេខសម្ងាត់ថ្មីត្រូវកំណត់ (New Password / PIN) *' : 'New Password / PIN *'}
                </label>
                <div className="relative">
                  <input
                    type={showAdminPass ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={adminNewPass}
                    onChange={(e) => setAdminNewPass(e.target.value)}
                    placeholder="1234"
                    className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-black text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    {showAdminPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Quick Password Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {lang === 'km' ? 'ជ្រើសរើសលេខសម្ងាត់លឿន (Quick Presets)' : 'Quick Password Presets'}
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '1234', desc: lang === 'km' ? 'លំនាំដើម' : 'Default' },
                    { label: '8888', desc: lang === 'km' ? 'ហេង' : 'Lucky' },
                    { label: '0000', desc: lang === 'km' ? 'ងាយចាំ' : 'Simple' },
                    { label: Math.floor(1000 + Math.random() * 9000).toString(), desc: lang === 'km' ? 'ចៃដន្យ' : 'Random' }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setAdminNewPass(p.label)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        adminNewPass === p.label
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                      }`}
                    >
                      <span className="font-mono font-black text-xs block">{p.label}</span>
                      <span className="text-[9px] opacity-70 block">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Send Credentials / Notice */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'km' ? 'ការជូនដំណឹងដល់ភ្ញៀវ៖' : 'Customer Notice:'}</span>
                </p>
                <p className="opacity-90">
                  {lang === 'km' 
                    ? 'បន្ទាប់ពី Reset រួច លោកអ្នកអាចផ្ញើលេខសម្ងាត់ថ្មីនេះទៅកាន់ភ្ញៀវតាមទូរស័ព្ទ ឬ Telegram' 
                    : 'After reset, you can communicate the new password directly via phone or Telegram.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResetPassCustomer(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'km' ? '🔑 កំណត់លេខសម្ងាត់ថ្មី' : 'Confirm Reset Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
