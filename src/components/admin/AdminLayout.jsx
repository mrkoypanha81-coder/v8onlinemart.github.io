import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import v8Logo from '../../assets/iconv8mart.jpg';
import { 
  LayoutDashboard, Package, ShoppingCart, Users, 
  Store, Bell, Plus, Search, ChevronRight, AlertTriangle, 
  TrendingUp, Shield, LogOut, ExternalLink, Globe, DollarSign,
  Image as ImageIcon, Sparkles, Calendar, Clock, Truck, Settings, Type,
  Volume2, VolumeX, BellRing, X, QrCode, CreditCard
} from 'lucide-react';
import { AdminAuth } from './AdminAuth';
import { AdminOverview } from './AdminOverview';
import { InventoryTable } from './InventoryTable';
import { OrderManagement } from './OrderManagement';
import { CustomerAnalytics } from './CustomerAnalytics';
import { BannerManagement } from './BannerManagement';
import { DeliveryTracking } from './DeliveryTracking';
import { AdminSettingsModal } from './AdminSettingsModal';
import { NotificationManagement } from './NotificationManagement';
import { MemberManagement } from './MemberManagement';
import { PaymentManagement } from './PaymentManagement';

export const AdminLayout = () => {
  const { 
    isAdminAuthenticated,
    adminLogout,
    navigateTo,
    lowStockProducts, 
    orders, 
    products, 
    banners = [],
    activeMember,
    lang, 
    setLang,
    currency, 
    setCurrency,
    fontSize,
    setFontSize,
    newOrderAlert,
    dismissNewOrderAlert,
    orderAudioEnabled,
    toggleOrderAudioAlert
  } = useStore();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'inventory' | 'orders' | 'banners' | 'customers'
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // If not authenticated, render AdminAuth login screen
  if (!isAdminAuthenticated) {
    return <AdminAuth />;
  }

  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Calculate expiring soon products (< 30 days)
  const now = new Date();
  const expiringProducts = products.filter(p => {
    if (!p.expiry_date) return false;
    const exp = new Date(p.expiry_date);
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  const totalAlerts = lowStockProducts.length + expiringProducts.length;

  const NAV_ITEMS = [
    { 
      id: 'overview', 
      label_kh: 'ទិដ្ឋភាពរួម', 
      label_en: 'Overview', 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'inventory', 
      label_kh: 'ស្តុក & Expire', 
      label_en: 'Inventory', 
      icon: Package,
      badge: totalAlerts > 0 ? totalAlerts : null,
      badgeColor: 'bg-rose-500'
    },
    { 
      id: 'orders', 
      label_kh: 'ការបញ្ជាទិញ', 
      label_en: 'Orders', 
      icon: ShoppingCart,
      badge: pendingOrders > 0 ? pendingOrders : null,
      badgeColor: 'bg-orange-500'
    },
    { 
      id: 'deliveries', 
      label_kh: 'តាមដានការដឹក', 
      label_en: 'Delivery Tracker', 
      icon: Truck,
      badge: orders.filter(o => o.status === 'shipped').length > 0 ? orders.filter(o => o.status === 'shipped').length : null,
      badgeColor: 'bg-blue-600'
    },
    { 
      id: 'banners', 
      label_kh: 'ផ្ទាំងផ្សាយ', 
      label_en: 'Banners', 
      icon: ImageIcon,
      badge: banners.length > 0 ? banners.length : null,
      badgeColor: 'bg-emerald-600'
    },
    { 
      id: 'notifications', 
      label_kh: 'ការជូនដំណឹង', 
      label_en: 'Notifications', 
      icon: Bell,
      badge: null
    },
    { 
      id: 'customers', 
      label_kh: 'អតិថិជន', 
      label_en: 'Customers', 
      icon: Users,
      badge: null
    },
    { 
      id: 'members', 
      label_kh: 'សមាជិក / បុគ្គលិក', 
      label_en: 'Members', 
      icon: Shield,
      badge: null
    },
    { 
      id: 'payments', 
      label_kh: 'ទូទាត់ប្រាក់ & QR', 
      label_en: 'Payment Gateways', 
      icon: QrCode,
      badge: null
    },
    { 
      id: 'settings', 
      label_kh: 'ការកំណត់', 
      label_en: 'Settings', 
      icon: Settings,
      badge: null,
      isAction: true
    }
  ];

  const isSuperAdmin = activeMember === null;

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.id === 'settings') return true;
    if (isSuperAdmin) return true;

    const perms = activeMember.permissions || {};
    if (item.id === 'overview') return !!perms.overview;
    if (item.id === 'inventory') return !!perms.inventory;
    if (item.id === 'orders') return !!perms.orders;
    if (item.id === 'deliveries') return !!perms.deliveries;
    if (item.id === 'banners') return !!perms.banners;
    if (item.id === 'notifications') return !!perms.notifications;
    if (item.id === 'customers') return !!perms.customers;
    if (item.id === 'members') return !!perms.members;

    return false;
  });

  const getMemberRoleName = () => {
    if (isSuperAdmin) return 'Super Admin';
    const p = activeMember.permissions || {};
    if (p.members) return 'Supervisor';
    if (p.deliveries && !p.inventory && !p.orders) return 'Delivery Agent';
    if (p.inventory || p.orders) return 'Staff Member';
    return 'Staff / Member';
  };

  // Dynamically set default accessible tab for logged in members based on granular permissions
  useEffect(() => {
    if (activeMember) {
      const firstAllowed = filteredNavItems.find(item => item.id !== 'settings');
      if (firstAllowed) {
        setActiveTab(firstAllowed.id);
      }
    } else {
      setActiveTab('overview');
    }
  }, [activeMember]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* ============================================================== */}
      {/* 1. DESKTOP SIDEBAR (>= md)                                     */}
      {/* ============================================================== */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between flex-shrink-0 border-r border-slate-800 h-screen sticky top-0">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header / Brand Logo */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-emerald-500/30 bg-white flex items-center justify-center p-0.5">
                <img src={v8Logo} alt="V8 Merchant" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="font-black text-sm text-white tracking-wide leading-none">V8 MERCHANT</h2>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Management Suite
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="p-3 space-y-1.5 flex-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !item.isAction;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'settings') {
                      setIsAdminSettingsOpen(true);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white shadow-lg shadow-emerald-700/25 scale-[1.02]'
                      : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{lang === 'km' ? item.label_kh : item.label_en}</span>
                  </div>
                  {item.badge && (
                    <span className={`${item.badgeColor || 'bg-emerald-600'} text-white text-[10px] font-black px-2 py-0.5 rounded-full`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {/* Quick Settings Shortcut in Sidebar */}
          <button
            onClick={() => setIsAdminSettingsOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition border border-slate-700/80 cursor-pointer shadow-xs"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'km' ? '⚙️ កំណត់ទំហំអក្សរ & ពណ៌' : '⚙️ System Settings'}</span>
          </button>

          <button
            onClick={() => navigateTo('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 hover:from-orange-700 hover:to-orange-800 text-white text-xs font-black flex items-center justify-center space-x-2 transition shadow-md shadow-orange-700/25 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>{lang === 'km' ? '🌐 មើលវេបសាយភ្ញៀវ' : '🌐 View Storefront'}</span>
          </button>

          <button
            onClick={adminLogout}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 text-xs font-bold flex items-center justify-center space-x-2 transition border border-slate-700/60 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'ចាកចេញ (Lock)' : 'Lock / Logout'}</span>
          </button>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP BAR & HORIZONTAL TAB NAV (< md)                  */}
      {/* ============================================================== */}
      <div className="md:hidden bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        {/* Tier 1: Brand, Quick Actions & Live Store Link */}
        <div className="p-3 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-emerald-500/30 bg-white flex items-center justify-center p-0.5 flex-shrink-0">
              <img src={v8Logo} alt="V8" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-black text-xs text-white leading-none">V8 MERCHANT</h2>
              <span className="text-[9px] text-emerald-400 font-bold">Admin Suite</span>
            </div>
          </div>

          {/* Quick Mobile Controls */}
          <div className="flex items-center space-x-1.5">
            {/* Admin Settings Button */}
            <button
              onClick={() => setIsAdminSettingsOpen(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {/* View Live Store Shortcut */}
            <button
              onClick={() => navigateTo('/')}
              className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'Store' : 'Store'}</span>
            </button>

            {/* Language switch */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-[10px] font-bold border border-slate-700">
              <button
                onClick={() => setLang('km')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${lang === 'km' ? 'bg-emerald-700 text-white' : 'text-slate-400'}`}
              >
                ខ្មែរ
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${lang === 'en' ? 'bg-emerald-700 text-white' : 'text-slate-400'}`}
              >
                EN
              </button>
            </div>

            {/* Logout button */}
            <button
              onClick={adminLogout}
              className="p-1.5 bg-slate-800 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700 cursor-pointer"
              title="Lock Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tier 2: Sleek Horizontal Scrollable Navigation Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto p-2 scrollbar-none overscroll-x-contain touch-pan-x bg-slate-950/60">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !item.isAction;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'settings') {
                    setIsAdminSettingsOpen(true);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-500 scale-102'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lang === 'km' ? item.label_kh : item.label_en}</span>
                {item.badge && (
                  <span className={`${item.badgeColor || 'bg-emerald-600'} text-white text-[9px] font-black px-1.5 py-0.2 rounded-full`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN CONTENT AREA                                           */}
      {/* ============================================================== */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {/* Desktop Top Navbar Breadcrumb (>= md) */}
        <div className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <span>Admin Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-black uppercase tracking-wide">
              {filteredNavItems.find(n => n.id === activeTab)?.[lang === 'km' ? 'label_kh' : 'label_en']}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Order Audio Ringtone Toggle Button */}
            <button
              onClick={toggleOrderAudioAlert}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                orderAudioEnabled 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
              title={lang === 'km' ? 'សំឡេងជូនដំណឹងការបញ្ជាទិញ (Order Ringtone)' : 'Order Sound Notification'}
            >
              {orderAudioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>{lang === 'km' ? '🔔 សំឡេង (ON)' : '🔔 Ringtone ON'}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'km' ? '🔇 បិទសំឡេង' : '🔇 Muted'}</span>
                </>
              )}
            </button>

            {/* Setting Button in Desktop Header */}
            <button
              onClick={() => setIsAdminSettingsOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title={lang === 'km' ? 'កំណត់ទំហំអក្សរ & ប្រព័ន្ធ' : 'Font Size & System Settings'}
            >
              <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'km' ? 'ការកំណត់ (Settings)' : 'Settings'}</span>
            </button>

            {/* Language switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setLang('km')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${lang === 'km' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                ខ្មែរ
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${lang === 'en' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                EN
              </button>
            </div>

            {/* Currency switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${currency === 'USD' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('KHR')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${currency === 'KHR' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                KHR (៛)
              </button>
            </div>

            {/* Alert warnings */}
            {totalAlerts > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                className="flex items-center space-x-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-rose-100 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>{totalAlerts} {lang === 'km' ? 'មុខទំនិញត្រូវការពិនិត្យ' : 'alerts (Stock & Expiry)'}</span>
              </button>
            )}

            {/* User Profile */}
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200 dark:border-slate-700 select-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {isSuperAdmin ? 'M' : activeMember.name.trim()[0].toUpperCase()}
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block leading-tight">
                  {isSuperAdmin ? 'Mart Manager' : activeMember.name}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                  {getMemberRoleName()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Views */}
        <div className="p-3.5 sm:p-6 lg:p-8">
          {activeTab === 'overview' && <AdminOverview onNavigate={setActiveTab} />}
          {activeTab === 'inventory' && <InventoryTable />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'deliveries' && <DeliveryTracking />}
          {activeTab === 'banners' && <BannerManagement />}
          {activeTab === 'notifications' && <NotificationManagement />}
          {activeTab === 'customers' && <CustomerAnalytics />}
          {activeTab === 'members' && <MemberManagement />}
          {activeTab === 'payments' && <PaymentManagement />}
        </div>
      </main>

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
      />

      {/* ============================================================== */}
      {/* REAL-TIME NEW ORDER RINGTONE ALERT POPUP MODAL                 */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* UNIVERSAL REAL-TIME RINGTONE & POPUP ALERT SYSTEM              */}
      {/* ============================================================== */}
      {newOrderAlert && (() => {
        const alertType = newOrderAlert.type || 'order';
        const isOrder = alertType === 'order';
        const isStock = alertType === 'stock';
        const isDelivery = alertType === 'delivery';
        const isCustomer = alertType === 'customer';

        return (
          <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-bounce-short font-sans">
            <div className={`p-5 rounded-3xl shadow-2xl border-2 space-y-3 relative overflow-hidden backdrop-blur-md text-white ${
              isOrder ? 'bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 border-emerald-500/80' :
              isStock ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 border-rose-500/80' :
              isDelivery ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 border-blue-500/80' :
              'bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border-purple-500/80'
            }`}>
              
              {/* Animated Bell/Alert Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-2xl animate-pulse shadow-lg ${
                    isOrder ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50' :
                    isStock ? 'bg-rose-500 text-white shadow-rose-500/50' :
                    isDelivery ? 'bg-blue-500 text-white shadow-blue-500/50' :
                    'bg-purple-500 text-white shadow-purple-500/50'
                  }`}>
                    {isStock ? <AlertTriangle className="w-6 h-6 animate-bounce" /> :
                     isDelivery ? <Truck className="w-6 h-6 animate-bounce" /> :
                     isCustomer ? <Users className="w-6 h-6 animate-bounce" /> :
                     <BellRing className="w-6 h-6 animate-bounce" />}
                  </div>

                  <div>
                    <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border bg-white/10">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>
                        {isOrder ? (lang === 'km' ? '🔔 មានការបញ្ជាទិញថ្មី!' : '🔔 NEW ORDER RECEIVED!') :
                         isStock ? (lang === 'km' ? '⚠️ អាសន្នស្តុកទាប!' : '⚠️ LOW STOCK ALERT!') :
                         isDelivery ? (lang === 'km' ? '🚚 អាប់ដេតការដឹកជញ្ជូន!' : '🚚 DELIVERY UPDATED!') :
                         (lang === 'km' ? '👤 មានអតិថិជនថ្មី!' : '👤 NEW CUSTOMER!')}
                      </span>
                    </div>

                    <h4 className="font-mono font-black text-lg text-amber-300 mt-0.5">
                      {newOrderAlert.orderId || newOrderAlert.productTitle || newOrderAlert.customerName || 'ALERT'}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={dismissNewOrderAlert}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Brief Info Details */}
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                {isOrder && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">អតិថិជន:</span>
                      <span className="font-bold text-white">{newOrderAlert.customerName} ({newOrderAlert.customerPhone})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ចំនួនទំនិញ:</span>
                      <span className="font-bold text-white">{newOrderAlert.itemCount} items</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                      <span className="text-slate-300 font-bold">សរុប:</span>
                      <span className="font-mono font-black text-base text-emerald-400">
                        ${(parseFloat(newOrderAlert.totalAmount) || 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                {isStock && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ទំនិញ:</span>
                      <span className="font-bold text-rose-300">{newOrderAlert.productTitle}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                      <span className="text-slate-300 font-bold">ស្តុកនៅសល់:</span>
                      <span className="font-mono font-black text-base text-rose-400">
                        {newOrderAlert.stockQuantity} units
                      </span>
                    </div>
                  </>
                )}

                {isDelivery && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Order ID:</span>
                      <span className="font-mono font-bold text-blue-300">{newOrderAlert.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                      <span className="text-slate-300 font-bold">ស្ថានភាពដឹក:</span>
                      <span className="font-bold text-emerald-400 uppercase">
                        {newOrderAlert.status}
                      </span>
                    </div>
                  </>
                )}

                {isCustomer && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ឈ្មោះអតិថិជន:</span>
                      <span className="font-bold text-purple-300">{newOrderAlert.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                      <span className="text-slate-300 font-bold">លេខទូរស័ព្ទ:</span>
                      <span className="font-mono font-bold text-white">
                        {newOrderAlert.customerPhone}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={dismissNewOrderAlert}
                  className="py-2 px-4 rounded-xl text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  {lang === 'km' ? 'បោះបង់' : 'Dismiss'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    dismissNewOrderAlert();
                    if (isOrder) setActiveTab('orders');
                    else if (isStock) setActiveTab('inventory');
                    else if (isDelivery) setActiveTab('deliveries');
                    else if (isCustomer) setActiveTab('customers');
                  }}
                  className={`py-2 px-5 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer ${
                    isOrder ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/30' :
                    isStock ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' :
                    isDelivery ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30' :
                    'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/30'
                  }`}
                >
                  <span>
                    {isOrder ? (lang === 'km' ? '👁️ មើលការបញ្ជាទិញ' : 'View Order') :
                     isStock ? (lang === 'km' ? '👁️ ពិនិត្យស្តុក' : 'View Inventory') :
                     isDelivery ? (lang === 'km' ? '🚚 តាមដានការដឹក' : 'View Delivery') :
                     (lang === 'km' ? '👁️ មើលអតិថិជន' : 'View Customers')}
                  </span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};



