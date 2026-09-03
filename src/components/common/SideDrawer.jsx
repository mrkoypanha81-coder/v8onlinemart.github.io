import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, User, LayoutGrid, Coffee, Cookie, ShoppingBag, Sparkles, 
  Wallet, PlusCircle, LogIn, Settings, Check, ArrowRight, Receipt,
  Sun, Moon, Globe, ChevronRight, ShieldCheck, Zap
} from 'lucide-react';
import { DepositCreditModal } from '../storefront/DepositCreditModal';

const CATEGORY_ICONS = {
  all: LayoutGrid,
  beverages: Coffee,
  snacks: Cookie,
  grocery: ShoppingBag,
  personal_care: Sparkles
};

export const SideDrawer = () => {
  const { 
    isSideDrawerOpen, 
    setIsSideDrawerOpen, 
    setIsSettingsOpen,
    setIsWalletHistoryOpen,
    lang, 
    setLang,
    theme,
    toggleTheme,
    categories, 
    products, 
    selectedCategory, 
    setSelectedCategory, 
    customerProfile,
    setViewMode,
    formatDualPrice
  } = useStore();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  if (!isSideDrawerOpen) return null;

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setIsSideDrawerOpen(false);
    setViewMode('store');
    const el = document.getElementById('products-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isGuest = !customerProfile.isRegistered || !customerProfile.phone;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans">
      {/* Backdrop overlay with blur */}
      <div 
        onClick={() => setIsSideDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-out Drawer from Left */}
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-[85vw] sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800 animate-slide-right transition-colors duration-300 relative overflow-hidden">
          
          {/* Decorative ambient top glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* ============================================================== */}
          {/* 1. HEADER: CUSTOMER PROFILE & APP BRAND                        */}
          {/* ============================================================== */}
          <div className="relative p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900">
            <div className="flex items-center justify-between">
              
              {/* Profile Card Trigger */}
              <div 
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="flex items-center space-x-3.5 min-w-0 cursor-pointer group flex-1"
                title={lang === 'km' ? 'ចុចដើម្បីបើកការកំណត់ & ប្រវត្តិរូប' : 'Click to open Settings & Profile'}
              >
                {/* Avatar with Gradient Border */}
                <div className="relative flex-shrink-0">
                  <div className="w-13 h-13 rounded-2xl p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 shadow-md group-hover:scale-105 transition duration-300">
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center">
                      {customerProfile.avatar ? (
                        <img src={customerProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-inner">
                          {customerProfile.fullName ? customerProfile.fullName.charAt(0).toUpperCase() : <User className="w-6 h-6 text-white" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registered Verified Badge */}
                  {!isGuest && (
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Profile Name & Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white truncate leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {customerProfile.fullName || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស' : 'Guest Customer')}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    {customerProfile.phone || (lang === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'No Phone Registered')}
                  </p>

                  <div className="mt-1.5 flex items-center space-x-1.5">
                    <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                      !isGuest
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50'
                        : 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/50'
                    }`}>
                      <span>{!isGuest ? '⭐' : '👤'}</span>
                      <span>
                        {!isGuest 
                          ? (lang === 'km' ? 'សមាជិក V8' : 'V8 Member') 
                          : (lang === 'km' ? 'ភ្ញៀវទូទៅ' : 'Guest Member')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsSideDrawerOpen(false)}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-all active:scale-95 flex-shrink-0"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. SCROLLABLE BODY CONTENT: WALLET & CATEGORIES                */}
          {/* ============================================================== */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none">
            
            {/* V8 Luxury Wallet Digital Card */}
            <div className="relative rounded-3xl p-5 text-white shadow-xl glow-emerald overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border border-emerald-400/30 group transition-all duration-300">
              
              {/* Background Geometric & Metallic Shine */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_50%)] pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
              
              {/* Top Row: Card Title & Status Badge */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Wallet className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-100 block">
                      V8 Wallet
                    </span>
                    <span className="text-[10px] text-emerald-200/80 block font-medium">
                      {lang === 'km' ? 'កាបូបលុយអេឡិចត្រូនិក' : 'Digital Wallet'}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md border ${
                  !isGuest
                    ? 'bg-emerald-400/20 border-emerald-300/40 text-emerald-100 shadow-2xs'
                    : 'bg-black/30 border-white/15 text-emerald-200'
                }`}>
                  {!isGuest ? 'Active' : (lang === 'km' ? 'ភ្ញៀវ' : 'Guest')}
                </span>
              </div>
              
              {/* Balance Amount */}
              <div className="mt-4 relative z-10 flex items-end justify-between">
                <div>
                  <span className="text-xs text-emerald-200/90 font-medium block">
                    {lang === 'km' ? 'សមតុល្យទឹកប្រាក់' : 'Available Balance'}
                  </span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-3xl font-black tracking-tight font-sans text-white drop-shadow-sm">
                      ${(!isGuest ? (parseFloat(customerProfile.balance) || 0) : 0).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-200/80 block mt-0.5 font-medium">
                    ≈ {formatDualPrice(!isGuest ? (parseFloat(customerProfile.balance) || 0) : 0).khr}
                  </span>
                </div>
                
                {/* Deposit / Login Button */}
                <button
                  onClick={() => {
                    if (!isGuest) {
                      setIsDepositModalOpen(true);
                    } else {
                      setIsSideDrawerOpen(false);
                      setIsSettingsOpen(true);
                    }
                  }}
                  className="py-2.5 px-4 bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs rounded-2xl flex items-center space-x-1.5 shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  {!isGuest ? (
                    <>
                      <PlusCircle className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'km' ? 'បញ្ចូលលុយ' : 'Deposit'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'km' ? 'ចូលគណនី' : 'Login'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* View Wallet History Link */}
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    setIsWalletHistoryOpen(true);
                  }}
                  className="text-emerald-100 hover:text-white font-bold flex items-center space-x-2 transition text-xs group/link cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'km' ? 'មើលប្រវត្តិប្រតិបត្តិការ Wallet' : 'View Wallet History'}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover/link:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Utility Switchers (Language & Theme) inside Drawer */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Language Quick Toggle */}
              <button
                onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'km' ? 'ភាសា' : 'Language'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black uppercase">
                  {lang === 'km' ? 'ខ្មែរ' : 'EN'}
                </span>
              </button>

              {/* Theme Quick Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500" />
                  )}
                  <span>{lang === 'km' ? 'ពន្លឺ/ងងឹត' : 'Theme'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black capitalize">
                  {theme}
                </span>
              </button>
            </div>

            {/* Navigation Categories */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'km' ? 'ប្រភេទទំនិញ' : 'Categories'}</span>
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                  {products.length} {lang === 'km' ? 'មុខទំនិញ' : 'items'}
                </span>
              </div>

              {categories.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat.id] || LayoutGrid;
                const isSelected = selectedCategory === cat.id;
                const count = cat.id === 'all' 
                  ? products.length 
                  : products.filter(p => p.category_id === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 group relative ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10 dark:hover:bg-slate-800/80 hover:text-emerald-700 dark:hover:text-emerald-400'
                    }`}
                  >
                    {/* Active Left Pill Marker */}
                    {isSelected && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                    )}

                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl transition duration-200 ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-left">{lang === 'km' ? cat.name_kh : cat.name_en}</span>
                    </div>

                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black transition ${
                      isSelected 
                        ? 'bg-white/20 text-white backdrop-blur-md' 
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. FOOTER: SETTINGS SHORTCUT BUTTON                            */}
          {/* ============================================================== */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
            <button
              onClick={() => {
                setIsSideDrawerOpen(false);
                setIsSettingsOpen(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-between transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 group-hover:bg-emerald-500/20 transition transform">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {lang === 'km' ? 'ការកំណត់ & ប្រវត្តិរូប' : 'Settings & Profile'}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {lang === 'km' ? 'កំណត់គណនី, អាសយដ្ឋាន & ជម្រើស' : 'Account, address & preferences'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition transform" />
            </button>
          </div>

        </div>
      </div>

      {/* Recharge Wallet Credit Modal overlay */}
      <DepositCreditModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
    </div>
  );
};
