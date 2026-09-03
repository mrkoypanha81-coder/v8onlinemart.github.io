import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import v8Logo from '../../assets/iconv8mart.jpg';
import { 
  Search, ShoppingCart, Heart, Store, LayoutDashboard, 
  Globe, DollarSign, Bell, MapPin, Phone, Sparkles,
  ChevronDown, X, Check, ArrowRight, Sun, Moon, Menu, Wallet, Settings
} from 'lucide-react';

export const Header = () => {
  const {
    lang,
    setLang,
    currency,
    setCurrency,
    exchangeRate = 4000,
    theme,
    toggleTheme,
    isSideDrawerOpen,
    setIsSideDrawerOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isWalletHistoryOpen,
    setIsWalletHistoryOpen,
    t,
    viewMode,
    setViewMode,
    products,
    cartItemCount,
    cartSubtotal,
    formatPrice,
    setIsCartOpen,
    wishlist,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    lowStockProducts,
    setQuickViewProduct,
    resetDemoData,
    customerProfile,
    notifications = [],
    readNotificationIds = [],
    markAllNotificationsAsRead
  } = useStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isNotifOpenDesktop, setIsNotifOpenDesktop] = useState(false);

  const searchRef = useRef(null);
  const alertRef = useRef(null);
  const desktopNotifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
      if (alertRef.current && !alertRef.current.contains(event.target)) {
        setIsAlertOpen(false);
      }
      if (desktopNotifRef.current && !desktopNotifRef.current.contains(event.target)) {
        setIsNotifOpenDesktop(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for autocomplete search
  const filteredSearchProducts = products.filter(p => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    const matchEn = (p.title_en || '').toLowerCase().includes(query);
    const matchKh = (p.title_kh || '').toLowerCase().includes(query);
    const matchSku = (p.sku || '').toLowerCase().includes(query);
    const matchCat = (p.category_name_en || '').toLowerCase().includes(query) || (p.category_name_kh || '').toLowerCase().includes(query);
    return matchEn || matchKh || matchSku || matchCat;
  }).slice(0, 5);

  return (
    <header className="app-header-fixed sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 shadow-xs">
      {/* 1. Top Utility Bar (Clean without delivery text, with Theme + Currency + Lang) */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs sm:text-sm py-1.5 px-3 sm:px-8 w-full border-b border-emerald-950/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Live Exchange Rate & V8 Wallet Balance */}
          <div className="flex items-center space-x-3.5 text-xs font-bold truncate">
            {/* Live Exchange Rate Badge */}
            <span className="inline-flex items-center text-[10px] sm:text-xs font-mono font-bold text-amber-300 bg-slate-800/90 px-2.5 py-0.5 rounded-lg border border-slate-700 select-none shadow-2xs">
              $1 = {exchangeRate.toLocaleString()} ៛
            </span>

            {/* V8 Wallet Balance Badge (Clickable to open Wallet History!) */}
            <button
              onClick={() => setIsWalletHistoryOpen(true)}
              className="inline-flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/30 px-2.5 py-0.5 rounded-lg border border-emerald-800/50 hover:border-emerald-700/60 shadow-2xs transition duration-200 active:scale-95 cursor-pointer"
              title={lang === 'km' ? 'កាបូបលុយ V8 Wallet - ចុចដើម្បីមើលប្រវត្តិប្រតិបត្តិការ' : 'V8 Wallet Balance - Click to View History'}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">{lang === 'km' ? 'កាបូបលុយ V8៖' : 'V8 Wallet:'}</span>
              <span className="font-mono text-white">${(customerProfile.isRegistered && customerProfile.phone ? (parseFloat(customerProfile.balance) || 0) : 0).toFixed(2)}</span>
            </button>
          </div>

          {/* Right Controls: Theme Mode + Language */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Theme Toggle Button (Dark / Light) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center space-x-1 bg-slate-800/90 hover:bg-slate-700 rounded-lg px-2 py-0.5 border border-slate-700 text-xs text-slate-200 transition"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="font-bold hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Desktop Notification Bell Button */}
            <div ref={desktopNotifRef} className="relative">
              <button
                onClick={() => {
                  setIsNotifOpenDesktop(!isNotifOpenDesktop);
                  if (!isNotifOpenDesktop) {
                    markAllNotificationsAsRead();
                  }
                }}
                className="flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-700 rounded-lg px-2.5 py-1 border border-slate-700 text-xs text-slate-200 transition duration-200 active:scale-95 cursor-pointer relative"
                title={lang === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
              >
                <Bell className={`w-3.5 h-3.5 text-emerald-450 ${notifications.filter(n => !readNotificationIds.includes(n.id)).length > 0 ? 'animate-bounce' : ''}`} />
                <span className="font-bold hidden sm:inline">{lang === 'km' ? 'ការជូនដំណឹង' : 'Notification'}</span>
                {notifications.filter(n => !readNotificationIds.includes(n.id)).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900 shadow-2xs">
                    {notifications.filter(n => !readNotificationIds.includes(n.id)).length}
                  </span>
                )}
              </button>

              {/* Desktop Notification Dropdown Menu */}
              {isNotifOpenDesktop && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-fade-in text-slate-850 dark:text-slate-200">
                  <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {lang === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
                      {notifications.filter(n => !readNotificationIds.includes(n.id)).length > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {notifications.filter(n => !readNotificationIds.includes(n.id)).length}
                        </span>
                      )}
                    </span>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold transition cursor-pointer"
                    >
                      {lang === 'km' ? 'សម្គាល់ថាអានរួច' : 'Mark all as read'}
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                        <Bell className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="text-xs font-semibold">{lang === 'km' ? 'មិនទាន់មានការជូនដំណឹងទេ' : 'No notifications yet'}</p>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const isUnread = !readNotificationIds.includes(notif.id);
                        const formattedDate = new Date(notif.date).toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        return (
                          <div
                            key={notif.id}
                            className={`p-3.5 transition duration-150 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                              isUnread ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                            }`}
                          >
                            <span className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                              {notif.type === 'discount' ? '🎁' : notif.type === 'alert' ? '⚠️' : notif.type === 'welcome' ? '🎉' : '📢'}
                            </span>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className={`text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight ${isUnread ? 'text-emerald-800 dark:text-emerald-300' : ''}`}>
                                  {lang === 'km' ? notif.title_kh : notif.title_en}
                                </h4>
                                {isUnread && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 mt-1.5 animate-pulse" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                                {lang === 'km' ? notif.message_kh : notif.message_en}
                              </p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block pt-0.5">
                                {formattedDate}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8 py-3 sm:py-3.5 w-full">
        {/* DESKTOP ROW (>= md) */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* 4-Line Menu Button + Brand Logo + MINI MART text */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Soft Pastel Emerald Menu Button */}
            <button
              onClick={() => setIsSideDrawerOpen(true)}
              title={lang === 'km' ? 'បើកម៉ឺនុយទំនិញ (Menu)' : 'Open Product Menu'}
              aria-label="Open Navigation Menu"
              className="w-12 h-12 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs flex items-center justify-center transition-all duration-200 cursor-pointer group flex-shrink-0"
            >
              <Menu className="w-6 h-6 stroke-[2.2] text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform" />
            </button>

            {/* Official Logo Box + Text "ONLINE MART" */}
            <div 
              onClick={() => setViewMode('store')}
              className="flex items-center space-x-3 cursor-pointer group select-none"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-emerald-600/30 group-hover:scale-105 transition transform bg-white flex items-center justify-center p-0.5">
                <img src={v8Logo} alt="V8 Online Mart" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-none">
                    Online <span className="text-emerald-700 dark:text-emerald-500">Mart</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  {lang === 'km' ? 'ផ្សារទំនើបអនឡាញទាន់ចិត្ត' : 'Express Convenience & Grocery'}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <div className="flex items-center rounded-2xl border-2 border-emerald-600/80 bg-white dark:bg-slate-800 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-emerald-500/30 transition">
              {/* Category Dropdown Filter */}
              <div className="hidden lg:flex items-center border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter by product category"
                  className="bg-transparent border-none outline-none cursor-pointer pr-2 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="all">{t.allCategories}</option>
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'km' ? c.name_kh : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder={t.searchPlaceholder}
                  className="w-full px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 placeholder-slate-400 outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Submit Button */}
              <button 
                aria-label="Perform search"
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 flex items-center justify-center transition font-bold text-sm"
              >
                <Search className="w-4.5 h-4.5 mr-1" />
                <span>{lang === 'km' ? 'ស្វែងរក' : 'Search'}</span>
              </button>
            </div>

            {/* Desktop Autocomplete Search Dropdown */}
            {isSearchFocused && filteredSearchProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in">
                <div className="px-4 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'km' ? 'លទ្ធផលស្វែងរកភ្លាមៗ' : 'Instant Matching Products'}
                </div>
                {filteredSearchProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setQuickViewProduct(product);
                      setIsSearchFocused(false);
                    }}
                    className="px-4 py-2.5 hover:bg-emerald-50/80 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images[0]}
                        alt={product.title_en}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">
                          {lang === 'km' ? product.title_kh : product.title_en}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                          <span className="text-orange-700 dark:text-orange-400 font-black">{formatPrice(product.price)}</span>
                          <span>•</span>
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{product.sku}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {product.stock_quantity <= 5 && product.stock_quantity > 0 ? (
                        <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {t.onlyLeft} {product.stock_quantity}
                        </span>
                      ) : product.stock_quantity === 0 ? (
                        <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {t.outOfStock}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {t.inStock} ({product.stock_quantity})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Right Action Icons */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Settings & Profile Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title={lang === 'km' ? 'ការកំណត់ & ប្រវត្តិរូប (Settings)' : 'Settings & Profile'}
              className="p-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 relative transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => {
                const wishlistEvent = new CustomEvent('open-wishlist');
                window.dispatchEvent(wishlistEvent);
              }}
              title={t.wishlist}
              className="p-3 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 relative transition border border-slate-200 dark:border-slate-700"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center space-x-2.5 bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 hover:from-orange-700 hover:to-orange-800 text-white px-5 py-2.5 rounded-2xl transition shadow-md shadow-orange-700/25 group"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-white group-hover:scale-110 transition transform" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-orange-700 font-black text-xs w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <span className="text-[11px] text-orange-100 uppercase font-bold block leading-none">{t.cart}</span>
                <span className="text-sm font-black text-white leading-tight block">{formatPrice(cartSubtotal)}</span>
              </div>
            </button>
          </div>
        </div>

        {/* MOBILE VIEW (< md): 4-Line Menu + V8 Icon + MINI MART */}
        <div className="md:hidden space-y-2.5">
          {/* Tier 1: 4-Line Menu, Logo & Actions */}
          <div className="flex items-center justify-between">
            {/* Left: 4-Line Menu + Logo + MINI MART text */}
            <div className="flex items-center space-x-2">
              {/* Mobile Soft Pastel Emerald Menu Button */}
              <button
                onClick={() => setIsSideDrawerOpen(true)}
                title="Open Menu"
                aria-label="Open Menu Drawer"
                className="w-10 h-10 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs flex items-center justify-center transition cursor-pointer flex-shrink-0"
              >
                <Menu className="w-5 h-5 stroke-[2.2] text-emerald-700 dark:text-emerald-300" />
              </button>

              {/* Logo with Official Icon + ONLINE MART text */}
              <div 
                onClick={() => setViewMode('store')}
                className="flex items-center space-x-2 cursor-pointer select-none"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-emerald-600/30 bg-white flex items-center justify-center p-0.5 flex-shrink-0">
                  <img src={v8Logo} alt="V8 Online Mart" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                    Online <span className="text-emerald-700 dark:text-emerald-500">Mart</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions: Settings, Notifications, Wishlist & Cart */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                title={lang === 'km' ? 'ការកំណត់ (Settings)' : 'Settings'}
                className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 relative border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  const wishlistEvent = new CustomEvent('open-wishlist');
                  window.dispatchEvent(wishlistEvent);
                }}
                className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 relative border border-slate-200 dark:border-slate-700"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 text-white px-3 py-2 rounded-xl shadow-sm font-bold"
              >
                <div className="relative">
                  <ShoppingCart className="w-4.5 h-4.5 text-white" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-orange-700 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-black text-white">{formatPrice(cartSubtotal)}</span>
              </button>
            </div>
          </div>

          {/* Tier 2: Search Bar */}
          <div className="relative w-full">
            <div className="flex items-center rounded-2xl border-2 border-emerald-600/80 bg-white dark:bg-slate-800 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-emerald-400/30">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'km' ? 'ស្វែងរកទំនិញ ភេសជ្ជៈ នំចំណី...' : 'Search products...'}
                className="w-full px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 dark:bg-slate-800 placeholder-slate-400 outline-none font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                aria-label="Search"
                className="bg-emerald-700 text-white px-4 py-2.5 flex items-center justify-center font-bold"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
