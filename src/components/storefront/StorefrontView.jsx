import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { HeroBanner } from './HeroBanner';
import { CategoryBar } from './CategoryBar';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { WishlistModal } from './WishlistModal';
import { SearchModal } from './SearchModal';
import { OrderTrackingModal } from './OrderTrackingModal';
import { SettingsModal } from './SettingsModal';
import { WalletHistoryModal } from './WalletHistoryModal';
import { 
  ArrowUpDown, Filter, Sparkles, MapPin, 
  Phone, Mail, Heart, ShieldCheck, Truck, QrCode,
  Send
} from 'lucide-react';

export const StorefrontView = () => {
  const { 
    products, 
    selectedCategory, 
    searchQuery, 
    categories, 
    isSearchModalOpen,
    setIsSearchModalOpen,
    lang, 
    t,
    navigateTo 
  } = useStore();


  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price_asc' | 'price_desc' | 'popular'
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

  // Filter products by search and category
  let displayedProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = query === '' || 
                        (p.title_en || '').toLowerCase().includes(query) || 
                        (p.title_kh || '').toLowerCase().includes(query) || 
                        (p.sku || '').toLowerCase().includes(query);
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  // Sort products (Pin Clearance / Unsold Promoted products to the VERY TOP មុនគេបង្អស់!)
  displayedProducts.sort((a, b) => {
    const isPromotedA = (a.is_clearance || a.is_slow_moving || a.is_promoted) ? 1 : 0;
    const isPromotedB = (b.is_clearance || b.is_slow_moving || b.is_promoted) ? 1 : 0;

    if (isPromotedA !== isPromotedB) {
      return isPromotedB - isPromotedA; // Clearance / Unsold Items pin to top!
    }

    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'popular') return (b.sold_count || 0) - (a.sold_count || 0);
    return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  });

  const currentCategoryObj = categories.find(c => c.id === selectedCategory);
  const categoryTitle = currentCategoryObj 
    ? (lang === 'km' ? currentCategoryObj.name_kh : currentCategoryObj.name_en) 
    : t.allCategories;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full max-w-full overflow-x-hidden transition-colors duration-300">
      {/* 1. Promotional Hero Banner */}
      <HeroBanner />

      {/* 2. Category Filter Bar */}
      <CategoryBar />

      {/* 3. Main Product Grid Section */}
      <main id="products-grid" className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-6 flex-1 w-full max-w-full overflow-hidden space-y-4 sm:space-y-6 scroll-mt-20">

        {/* Section Title & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {categoryTitle}
              </h2>
              <span className="bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900">
                {displayedProducts.length} items
              </span>
            </div>
            {searchQuery && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'km' ? 'លទ្ធផលស្វែងរក៖' : 'Showing results for'} "<span className="font-bold text-emerald-700 dark:text-emerald-400">{searchQuery}</span>"
              </p>
            )}
          </div>

          {/* Sorting Dropdown (Compact & Sleek) */}
          <div className="flex items-center space-x-1.5 self-end sm:self-auto flex-shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {lang === 'km' ? 'តម្រៀប៖' : 'Sort by:'}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer max-w-[155px] sm:max-w-[180px] truncate"
            >
              <option value="featured">{lang === 'km' ? 'ពេញនិយម' : 'Featured'}</option>
              <option value="popular">{lang === 'km' ? 'លក់ដាច់បំផុត' : 'Best Selling'}</option>
              <option value="price_asc">{lang === 'km' ? 'តម្លៃទាប ➔ ខ្ពស់' : 'Price: Low to High'}</option>
              <option value="price_desc">{lang === 'km' ? 'តម្លៃខ្ពស់ ➔ ទាប' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-soft">
            <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-500 flex items-center justify-center mx-auto">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t.noProductsFound}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try searching with another keyword or explore other product categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>


      {/* 4. Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

          {/* Col 1: About */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-base">
                V8
              </div>
              <span className="font-black text-lg text-white">V8 ONLINE MART</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              {lang === 'km' 
                ? 'ផ្សារទំនើបអនឡាញឈានមុខគេក្នុងប្រទេសកម្ពុជា ផ្ដល់ជូនទំនិញគុណភាពខ្ពស់ ដឹកជញ្ជូនរហ័ស និងទូទាត់តាម ABA KHQR ងាយស្រួល។'
                : 'Cambodia\'s premier online convenience store. Top quality beverages, snacks, and daily groceries delivered in 30 minutes.'
              }
            </p>
          </div>

          {/* Col 2: Branches */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider">Our Stores</h4>
            <div className="space-y-1.5 text-[11px]">
              <p className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> Toul Kork Branch, St 289</p>
              <p className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> BKK1 Branch, St 63</p>
              <p className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> Chbar Ampov, National Rd 1</p>
            </div>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider">Contact & Support</h4>
            <div className="space-y-1.5 text-[11px]">
              <p className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> +855 12 888 999 / 098 777 666</p>
              <p className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1.5 text-orange-400" /> order@v8mart.com</p>
              <p className="text-emerald-400 font-semibold">Open Daily: 6:00 AM - 11:00 PM</p>
            </div>
          </div>

          {/* Col 4: Payment Accepted */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-xs tracking-wider">Accepted Payments</h4>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="bg-slate-800 text-rose-400 px-2 py-1 rounded border border-slate-700">ABA KHQR</span>
              <span className="bg-slate-800 text-amber-400 px-2 py-1 rounded border border-slate-700">Wing Bank</span>
              <span className="bg-slate-800 text-blue-400 px-2 py-1 rounded border border-slate-700">ACLEDA</span>
              <span className="bg-slate-800 text-slate-200 px-2 py-1 rounded border border-slate-700">Visa / MC</span>
              <span className="bg-slate-800 text-emerald-400 px-2 py-1 rounded border border-slate-700">Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <div>© 2026 V8 Online Mart Co., Ltd. All rights reserved.</div>
          <button 
            onClick={() => navigateTo('/admin')}
            className="text-slate-500 hover:text-orange-400 transition flex items-center space-x-1"
          >
            <span>🔐 ប្រព័ន្ធគ្រប់គ្រងហាង (Admin Portal)</span>
          </button>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderTrackingModal />
      <SettingsModal />
      <WalletHistoryModal />
      <WishlistModal isOpen={isWishlistModalOpen} onClose={() => setIsWishlistModalOpen(false)} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </div>
  );
};
