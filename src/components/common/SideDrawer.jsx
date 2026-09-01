import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, User, LayoutGrid, Coffee, Cookie, ShoppingBag, Sparkles, 
  Wallet, PlusCircle, Settings, Check, ArrowRight, Receipt
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
    isWalletHistoryOpen,
    setIsWalletHistoryOpen,
    lang, 
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in font-sans">
      {/* Backdrop overlay */}
      <div 
        onClick={() => setIsSideDrawerOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out Drawer from Left */}
      <div className="absolute inset-y-0 left-0 max-w-full flex">
        <div className="w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 animate-slide-right transition-colors duration-300">
          
          {/* ============================================================== */}
          {/* 1. HEADER: CUSTOMER PROFILE (Clickable to open Settings!)      */}
          {/* ============================================================== */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 dark:from-slate-950/80 dark:via-emerald-950/30 dark:to-slate-950/80">
            <div 
              onClick={() => {
                setIsSideDrawerOpen(false);
                setIsSettingsOpen(true);
              }}
              className="flex items-center space-x-3 min-w-0 cursor-pointer group"
              title="Click to open Settings & Profile"
            >
              {/* Customer Profile Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border-2 border-emerald-600/40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition transform">
                  {customerProfile.avatar ? (
                    <img src={customerProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-emerald-700 to-emerald-500 text-white flex items-center justify-center font-black text-lg">
                      {customerProfile.fullName ? customerProfile.fullName.charAt(0).toUpperCase() : <User className="w-6 h-6 text-white" />}
                    </div>
                  )}
                </div>
                {customerProfile.isRegistered && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Customer Name & Status */}
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                    {customerProfile.fullName || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស (Guest)' : 'Guest Customer')}
                  </h3>
                  <Settings className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                  {customerProfile.phone || (lang === 'km' ? 'មិនទាន់ចុះឈ្មោះ' : 'No Phone Registered')}
                </p>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    customerProfile.isRegistered
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {customerProfile.isRegistered 
                      ? (lang === 'km' ? '⭐ សមាជិក V8' : '⭐ Member') 
                      : (lang === 'km' ? '👤 ភ្ញៀវទូទៅ' : '👤 Guest')}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsSideDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition flex-shrink-0"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ============================================================== */}
          {/* 2. SCROLLABLE BODY CONTENT: WALLET & CATEGORIES                */}
          {/* ============================================================== */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            
            {/* V8 Wallet Balance & Deposit */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-3xl p-4 sm:p-5 text-white shadow-md space-y-3.5 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-emerald-300" />
                  <span className="font-black text-xs sm:text-sm tracking-wide">
                    {lang === 'km' ? 'កាបូបលុយ V8 Wallet' : 'V8 Wallet Balance'}
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  customerProfile.isRegistered && customerProfile.phone
                    ? 'bg-white/20 border-white/20 text-white'
                    : 'bg-black/20 border-white/10 text-emerald-200'
                }`}>
                  {customerProfile.isRegistered && customerProfile.phone ? 'Active' : (lang === 'km' ? 'មិនទាន់ចូល' : 'Guest')}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight block">
                    ${(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-emerald-200 block">
                    ≈ {formatDualPrice(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).khr}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    if (customerProfile.isRegistered && customerProfile.phone) {
                      setIsDepositModalOpen(true);
                    } else {
                      setIsSideDrawerOpen(false);
                      setIsSettingsOpen(true);
                    }
                  }}
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 active:scale-95 text-emerald-800 font-black text-xs rounded-2xl flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>
                    {customerProfile.isRegistered && customerProfile.phone 
                      ? (lang === 'km' ? 'បញ្ចូលលុយ' : 'Deposit') 
                      : (lang === 'km' ? 'ចូលគណនី' : 'Login')}
                  </span>
                </button>
              </div>

              {/* View Wallet History Link */}
              <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    setIsWalletHistoryOpen(true);
                  }}
                  className="text-white hover:text-emerald-200 font-bold flex items-center space-x-1.5 transition text-[11px] cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{lang === 'km' ? '📜 មើលប្រវត្តិប្រតិបត្តិការ Wallet' : '📜 View Wallet History'}</span>
                </button>
              </div>
            </div>

            {/* Navigation Categories */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
                {lang === 'km' ? 'ប្រភេទទំនិញ (Categories)' : 'Categories'}
              </span>

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
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <span>{lang === 'km' ? cat.name_kh : cat.name_en}</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <button
              onClick={() => {
                setIsSideDrawerOpen(false);
                setIsSettingsOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-between transition shadow-xs cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition transform">
                  <Settings className="w-4 h-4" />
                </div>
                <span>{lang === 'km' ? 'ការកំណត់ & ប្រវត្តិរូប (Settings)' : 'Settings & Preferences'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition transform" />
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
