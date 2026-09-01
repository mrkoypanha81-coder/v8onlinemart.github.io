import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Home, Search, Heart, ShoppingBag, Sparkles, Truck, History
} from 'lucide-react';

export const MobileBottomNav = ({ onOpenWishlist }) => {
  const { 
    cartItemCount, 
    orders = [],
    customerProfile,
    activeTrackingOrderId,
    setIsCartOpen, 
    setIsSearchModalOpen,
    setIsTrackingOpen,
    setTrackingActiveTab,
    lang, 
    t,
    setSelectedCategory
  } = useStore();

  // Filter active orders belonging to this customer (by phone or active checkout tracking ID)
  const customerPhone = customerProfile?.phone?.replace(/\s+/g, '') || '';
  const myActiveOrders = orders.filter(o => {
    const isActive = o.status === 'pending' || o.status === 'paid' || o.status === 'shipped';
    if (!isActive) return false;

    if (activeTrackingOrderId && o.id === activeTrackingOrderId) {
      return true;
    }

    if (customerPhone) {
      const cleanPhone = (o.customer_phone || '').replace(/\s+/g, '');
      return cleanPhone === customerPhone;
    }

    return false;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-emerald-900/10 dark:border-slate-800 shadow-floating px-4 py-2 pb-3 flex items-center justify-around select-none transition-colors duration-300">
      {/* 1. Home Button */}
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setSelectedCategory('all');
        }}
        className="flex flex-col items-center justify-center p-1 rounded-xl text-emerald-800 dark:text-emerald-400 font-bold transition active:scale-95"
      >
        <Home className="w-6 h-6 stroke-[2.5]" />
        <span className="text-xs font-bold mt-1">{lang === 'km' ? 'ទំព័រដើម' : 'Home'}</span>
      </button>

      {/* 2. Search Button (Active & Fast Modal) */}
      <button
        onClick={() => setIsSearchModalOpen(true)}
        className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition active:scale-95"
      >
        <Search className="w-6 h-6 stroke-2 text-emerald-700 dark:text-emerald-400" />
        <span className="text-xs font-bold mt-1">{lang === 'km' ? 'ស្វែងរក' : 'Search'}</span>
      </button>

      {/* 3. Floating Center Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center justify-center -mt-6 relative group"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 via-orange-700 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-orange-700/35 group-active:scale-95 transition transform border-2 border-white dark:border-slate-800">
          <ShoppingBag className="w-7 h-7 stroke-[2.2]" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-bounce">
              {cartItemCount}
            </span>
          )}
        </div>
        <span className="text-xs font-black text-orange-700 dark:text-orange-400 mt-1">{lang === 'km' ? 'កន្ត្រក' : 'Cart'}</span>
      </button>

      {/* 4. Track Order Button (តាមដានទំនិញ) */}
      <button
        onClick={() => {
          setTrackingActiveTab('active');
          setIsTrackingOpen(true);
        }}
        className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 relative transition active:scale-95"
      >
        <div className="relative">
          <Truck className="w-6 h-6 stroke-2" />
          {myActiveOrders.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-orange-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
              {myActiveOrders.length}
            </span>
          )}
        </div>
        <span className="text-xs font-bold mt-1">{lang === 'km' ? 'តាមដានទំនិញ' : 'Track Order'}</span>
      </button>

      {/* 5. Purchase History Button */}
      <button
        onClick={() => {
          setTrackingActiveTab('history');
          setIsTrackingOpen(true);
        }}
        className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition active:scale-95"
      >
        <History className="w-6 h-6 stroke-2" />
        <span className="text-xs font-bold mt-1">{lang === 'km' ? 'ប្រវត្តិទិញ' : 'History'}</span>
      </button>
    </div>
  );
};
