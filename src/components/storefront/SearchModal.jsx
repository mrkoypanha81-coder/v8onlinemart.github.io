import React, { useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Search, X, ShoppingBag, ArrowRight, Sparkles, 
  Flame, Tag, Filter, Check
} from 'lucide-react';

export const SearchModal = ({ isOpen, onClose }) => {
  const { 
    products, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    categories, 
    formatPrice, 
    addToCart, 
    setQuickViewProduct, 
    lang, 
    t 
  } = useStore();

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const query = searchQuery.toLowerCase().trim();
  const searchResults = products.filter(p => {
    const matchQuery = query === '' ||
      (p.title_en && p.title_en.toLowerCase().includes(query)) ||
      (p.title_kh && p.title_kh.toLowerCase().includes(query)) ||
      (p.category_name_en && p.category_name_en.toLowerCase().includes(query)) ||
      (p.category_name_kh && p.category_name_kh.toLowerCase().includes(query));

    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchQuery && matchCat;
  });

  const popularKeywords = [
    { kh: 'ស្រាបៀរ', en: 'Beer' },
    { kh: 'កូកា-កូឡា', en: 'Coca Cola' },
    { kh: 'មីហឹរ', en: 'Ramen' },
    { kh: 'អង្ករ', en: 'Rice' },
    { kh: 'កាហ្វេ', en: 'Coffee' },
    { kh: 'ដំឡូងបារាំង', en: 'Chips' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-start p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl mx-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] mt-2 sm:mt-12">
        {/* Search Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute left-3" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកភេសជ្ជៈ អាហារសម្រន់ មី...' : 'Search beverages, snacks, groceries...'}
              className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-600 shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition text-xs font-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto scrollbar-none bg-white dark:bg-slate-900">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition border ${
                selectedCategory === c.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {lang === 'km' ? c.name_kh : c.name_en}
            </button>
          ))}
        </div>

        {/* Quick Suggestion Tags if query is empty */}
        {!searchQuery && (
          <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'km' ? '🔥 ពាក្យស្វែងរកពេញនិយម៖' : '🔥 Popular Searches:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularKeywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(lang === 'km' ? kw.kh : kw.en)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition shadow-xs"
                >
                  {lang === 'km' ? kw.kh : kw.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-2">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Filter className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">{t.noProductsFound}</p>
            </div>
          ) : (
            searchResults.map(product => {
              const isOut = product.stock_quantity === 0;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setQuickViewProduct(product);
                    onClose();
                  }}
                  className="pt-2 pb-2 flex items-center justify-between space-x-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 p-2 rounded-2xl cursor-pointer transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={product.images[0]}
                      alt={product.title_en || product.title_kh}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block truncate">
                        {lang === 'km' ? product.category_name_kh : product.category_name_en}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {lang === 'km' ? product.title_kh : (product.title_en || product.title_kh)}
                      </h4>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400">
                          {formatPrice(product.price, product.currency)}
                        </span>
                        {product.original_price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatPrice(product.original_price, product.currency)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOut) {
                        addToCart(product, 1);
                      }
                    }}
                    disabled={isOut}
                    className={`p-2.5 rounded-xl font-bold text-xs flex items-center space-x-1 flex-shrink-0 transition ${
                      isOut 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white active:scale-95 shadow-sm'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isOut ? t.outOfStock : t.addToCart}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
